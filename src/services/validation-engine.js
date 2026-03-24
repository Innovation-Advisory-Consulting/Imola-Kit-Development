/**
 * Validation Engine Service (VaaS)
 *
 * Implements the core validation execution algorithm per the v1.4 capability spec:
 * 1. Resolve active ValidationProfile for target entity type (effective dating)
 * 2. Create ValidationRequest (idempotent via IdempotencyKey)
 * 3. Generate baseline checklist tasks from BaselineTaskSet templates
 * 4. Execute ValidationRules from RuleSet
 * 5. Compute outcome (PASS / PASS_WITH_WARNINGS / FAIL)
 * 6. Provide approval gating answer
 */

const TARGET_ENTITY_TYPES = ['Contract', 'Contract Amendment', 'Task Order', 'Task Order Supplement', 'Termination', 'Settlement', 'Invoice']

/**
 * Create a validation engine bound to a Salesforce client instance.
 * @param {object} client - Salesforce API client from createSalesforceClient
 */
export function createValidationEngine(client) {
  if (!client) throw new Error('Validation engine requires a Salesforce client')

  // ─── Profile Resolution ───

  /**
   * Find exactly one active ValidationProfile for the given target entity type
   * as of the specified date (default: now).
   * Respects effective dating: EffectiveStart <= asOf AND (EffectiveEnd is null OR EffectiveEnd > asOf)
   */
  async function resolveProfile(targetEntityType, { profileName, profileId, asOf, stage } = {}) {
    if (!TARGET_ENTITY_TYPES.includes(targetEntityType)) {
      throw new ValidationEngineError('INVALID_TARGET_TYPE', `Unknown target entity type: ${targetEntityType}`)
    }

    const profiles = await client.getValidationProfiles()
    const asOfDate = asOf ? new Date(asOf) : new Date()

    const matchesBase = (p) => {
      if (p.cux_Target_Entity_Type__c !== targetEntityType) return false
      if (!p.cux_Is_Active__c) return false
      if (profileId && p.Id !== profileId) return false
      if (profileName && p.cux_Profile_Name__c !== profileName) return false
      const start = p.cux_Effective_Start__c ? new Date(p.cux_Effective_Start__c) : null
      const end = p.cux_Effective_End__c ? new Date(p.cux_Effective_End__c) : null
      if (start && start > asOfDate) return false
      if (end && end <= asOfDate) return false
      return true
    }

    // Try stage-specific profile first, then fallback to generic (null stage)
    let candidates = profiles.filter((p) => matchesBase(p) && p.cux_Stage__c === stage)
    if (candidates.length === 0 && stage) {
      candidates = profiles.filter((p) => matchesBase(p) && !p.cux_Stage__c)
    }

    if (candidates.length === 0) {
      // Return null instead of throwing — caller can skip validation for this stage
      return null
    }
    if (candidates.length > 1) {
      // Pick the one with the latest EffectiveStart (most specific version)
      candidates.sort((a, b) => new Date(b.cux_Effective_Start__c) - new Date(a.cux_Effective_Start__c))
    }

    return candidates[0]
  }

  // ─── Request Validation (main entry point) ───

  /**
   * RequestValidation - main engine entry point.
   * @param {object} input
   * @param {string} input.targetEntityType - e.g. "Contract"
   * @param {string} input.targetEntityId - Salesforce record ID
   * @param {string} [input.profileName] - profile name to match
   * @param {string} [input.profileId] - or direct profile ID
   * @param {string} [input.requestedBy] - actor ID
   * @param {string} [input.correlationId] - correlation ID for tracing
   * @param {string} [input.idempotencyKey] - idempotency key
   * @param {Date|string} [input.asOf] - effective date (default: now)
   * @returns {object} { requestId, status, outcome, profile, results }
   */
  async function requestValidation(input) {
    const {
      targetEntityType,
      targetEntityId,
      profileName,
      profileId,
      requestedBy,
      correlationId,
      idempotencyKey,
      asOf,
      stage,
    } = input

    if (!targetEntityType || !targetEntityId) {
      throw new ValidationEngineError('MISSING_INPUT', 'targetEntityType and targetEntityId are required')
    }

    // Step 1: Check idempotency - if key provided, look for existing request
    if (idempotencyKey) {
      const existing = await findExistingRequest(idempotencyKey, targetEntityType, targetEntityId)
      if (existing) {
        return {
          requestId: existing.Id,
          status: existing.cux_Status__c,
          outcome: existing.cux_Outcome__c,
          deduplicated: true,
        }
      }
    }

    // Step 2: Resolve profile (stage-aware)
    const profile = await resolveProfile(targetEntityType, { profileName, profileId, asOf, stage })

    // If no profile exists for this stage, skip validation
    if (!profile) {
      return { skipped: true, stage, message: `No validation profile for ${targetEntityType} stage "${stage}"` }
    }

    // Step 3: Create ValidationRequest
    const requestData = {
      cux_Target_Type__c: targetEntityType,
      cux_Target_Id__c: targetEntityId,
      cux_Status__c: 'Running',
      cux_Requested_By__c: requestedBy || null,
      cux_Requested_At__c: new Date().toISOString(),
      cux_Validation_Profile__c: profile.Id,
      cux_Profile_Version__c: profile.cux_Version__c,
      cux_Correlation_Id__c: correlationId || null,
      cux_Idempotency_Key__c: idempotencyKey || null,
      cux_Stage__c: stage || null,
    }

    const { id: requestId } = await client.createValidationRequest(requestData)

    // Step 4: Execute validation
    const results = []
    let hasBlockingFailure = false
    let hasWarnings = false

    try {
      // 4a: Execute baseline task checklist (if configured)
      if (profile.cux_Baseline_Task_Set__c) {
        const checklistResults = await executeBaselineTasks(requestId, profile.cux_Baseline_Task_Set__c, asOf)
        results.push(...checklistResults)
      }

      // Step 5: Compute outcome
      for (const r of results) {
        if (r.cux_Outcome__c === 'FAIL' && isBlocking(r)) {
          hasBlockingFailure = true
        }
        if (r.cux_Outcome__c === 'WARN') {
          hasWarnings = true
        }
      }

      const outcome = hasBlockingFailure ? 'FAIL' : hasWarnings ? 'PASS_WITH_WARNINGS' : 'PASS'

      // Step 6: Complete the request
      await client.updateValidationRequest(requestId, {
        cux_Status__c: 'Completed',
        cux_Outcome__c: outcome,
        cux_Completed_At__c: new Date().toISOString(),
      })

      // Step 7: Create review WorkTask (awaited so callers know when it's ready)
      try {
        await createReviewWorkTask(requestId, targetEntityType, targetEntityId, stage)
      } catch (err) {
        console.warn('Failed to create review WorkTask:', err)
      }

      return {
        requestId,
        status: 'Completed',
        outcome,
        profile: { id: profile.Id, name: profile.cux_Profile_Name__c, version: profile.cux_Version__c },
        resultCount: results.length,
        blockingCount: results.filter((r) => r.cux_Outcome__c === 'FAIL' && isBlocking(r)).length,
        warningCount: results.filter((r) => r.cux_Outcome__c === 'WARN').length,
        passCount: results.filter((r) => r.cux_Outcome__c === 'PASS').length,
      }
    } catch (execError) {
      // Failure handling: mark request as completed with FAIL and write system error result
      await client.createValidationResult({
        cux_Validation_Request__c: requestId,
        cux_Result_Type__c: 'RULE',
        cux_Result_Status__c: 'Fail',
        cux_Outcome__c: 'FAIL',
        cux_Severity__c: 'CRITICAL',
        cux_Message__c: `System error during validation: ${sanitizeError(execError)}`,
        cux_Execution_Mode__c: 'AUTOMATED',
        cux_Rule_Id__c: 'SYSTEM-ERROR',
        cux_Completed_At__c: new Date().toISOString(),
      })

      await client.updateValidationRequest(requestId, {
        cux_Status__c: 'Completed',
        cux_Outcome__c: 'FAIL',
        cux_Completed_At__c: new Date().toISOString(),
      })

      return {
        requestId,
        status: 'Completed',
        outcome: 'FAIL',
        error: sanitizeError(execError),
      }
    }
  }

  // ─── Baseline Task Execution ───

  async function executeBaselineTasks(requestId, taskSetId, asOf) {
    const templates = await client.getBaselineTaskTemplates(taskSetId)
    const asOfDate = asOf ? new Date(asOf) : new Date()
    const results = []

    for (const template of templates) {
      // Templates are pre-sorted by Sort_Order from the API
      // For automated execution, checklist items start as pending (awaiting manual completion)
      // We create a ValidationResult with PENDING status to track them
      const resultData = {
        cux_Validation_Request__c: requestId,
        cux_Result_Type__c: 'CHECKLIST',
        cux_Result_Status__c: 'Manual Review Required',
        cux_Outcome__c: 'WARN', // Pending checklist items are warnings until completed
        cux_Severity__c: template.cux_Required__c ? (template.cux_Severity_If_Incomplete__c || 'ERROR') : 'INFO',
        cux_Message__c: `Checklist task pending: ${template.cux_Title__c}`,
        cux_Execution_Mode__c: 'MANUAL',
        cux_Baseline_Task_Template__c: template.Id,
        cux_Rule_Id__c: template.cux_Task_Code__c,
        cux_Completed_At__c: new Date().toISOString(),
      }

      await client.createValidationResult(resultData)
      results.push(resultData)
    }

    return results
  }

  // ─── Rule Set Execution ───

  // Map target entity types to Salesforce SObject API names
  const TARGET_TYPE_TO_SOBJECT = {
    'Contract': 'cux_Contract__c',
    'Contract Amendment': 'cux_ContractAmendment__c',
    'Task Order': 'cux_TaskOrder__c',
    'Task Order Supplement': 'cux_TaskOrderSupplement__c',
    'Termination': 'cux_Termination__c',
    'Settlement': 'cux_Settlement__c',
    'Invoice': 'cux_Invoice__c',
  }

  async function executeRuleSet(requestId, ruleSetId, targetEntityType, targetEntityId, asOf) {
    const rules = await client.getValidationRules(ruleSetId)
    const asOfDate = asOf ? new Date(asOf) : new Date()
    const results = []

    // Filter to active rules within effective dates
    const activeRules = rules.filter((rule) => {
      if (!rule.cux_Is_Active__c) return false
      const start = rule.cux_Effective_Start__c ? new Date(rule.cux_Effective_Start__c) : null
      const end = rule.cux_Effective_End__c ? new Date(rule.cux_Effective_End__c) : null
      if (start && start > asOfDate) return false
      if (end && end <= asOfDate) return false
      return true
    })

    // Pre-fetch target record if any rules use expressions
    let targetRecord = null
    const hasExpressionRules = activeRules.some((r) => r.cux_Rule_Type__c === 'RULE' && r.cux_Expression__c && !r.cux_Handler_Key__c)
    if (hasExpressionRules) {
      const sobject = TARGET_TYPE_TO_SOBJECT[targetEntityType]
      if (sobject) {
        try {
          targetRecord = await client.getRecord(sobject, targetEntityId)
        } catch (err) {
          console.warn('Failed to fetch target record for expression evaluation:', err)
        }
      }
    }

    for (const rule of activeRules) {
      const result = await executeRule(requestId, rule, targetEntityType, targetEntityId, targetRecord)
      results.push(result)
    }

    return results
  }

  /**
   * Execute a single validation rule and persist the result.
   */
  async function executeRule(requestId, rule, targetEntityType, targetEntityId, targetRecord) {
    const executionMode = rule.cux_Execution_Default_Mode__c || 'AUTOMATED'
    let outcome = 'PASS'
    let message = ''
    let evidenceRef = null

    try {
      switch (rule.cux_Rule_Type__c) {
        case 'RULE': {
          // Deterministic rule - use handler or expression
          if (rule.cux_Handler_Key__c) {
            const handlerResult = await runHandler(rule.cux_Handler_Key__c, targetEntityType, targetEntityId, rule)
            outcome = handlerResult.outcome
            message = handlerResult.message
            evidenceRef = handlerResult.evidenceRef
          } else if (rule.cux_Expression__c) {
            const exprResult = evaluateExpression(rule.cux_Expression__c, targetRecord)
            outcome = exprResult.outcome
            message = rule.cux_Title__c || exprResult.message
            evidenceRef = exprResult.message
          } else {
            // No handler or expression - mark as pending manual review
            outcome = 'WARN'
            message = `Rule ${rule.cux_Rule_Code__c} has no handler or expression configured`
          }
          break
        }
        case 'DOCUMENT': {
          // Document presence/completeness checks
          outcome = 'WARN'
          message = `Document check pending: ${rule.cux_Title__c}`
          break
        }
        case 'AI': {
          // AI validation - queued for async processing
          outcome = 'WARN'
          message = `AI validation queued: ${rule.cux_Title__c}`
          break
        }
        case 'CHECKLIST_GATE': {
          // Compute gate based on previous results for this request
          const existingResults = await client.getValidationResults(requestId)
          const blockingFailures = existingResults.filter(
            (r) => r.cux_Outcome__c === 'FAIL' && ['ERROR', 'CRITICAL'].includes(r.cux_Severity__c)
          )
          const pendingRequired = existingResults.filter(
            (r) => r.cux_Result_Type__c === 'CHECKLIST' && r.cux_Outcome__c !== 'PASS' && r.cux_Severity__c !== 'INFO'
          )

          if (blockingFailures.length > 0 || pendingRequired.length > 0) {
            outcome = 'FAIL'
            message = `Gate blocked: ${blockingFailures.length} blocking failures, ${pendingRequired.length} incomplete required tasks`
          } else {
            outcome = 'PASS'
            message = 'All gate conditions satisfied'
          }
          break
        }
        default:
          outcome = 'WARN'
          message = `Unknown rule type: ${rule.cux_Rule_Type__c}`
      }
    } catch (ruleError) {
      outcome = 'FAIL'
      message = `Rule execution error: ${sanitizeError(ruleError)}`
    }

    const resultType = rule.cux_Rule_Type__c === 'CHECKLIST_GATE' ? 'RULE' : rule.cux_Rule_Type__c
    const isManual = executionMode === 'MANUAL'
    const resultData = {
      cux_Validation_Request__c: requestId,
      cux_Result_Type__c: resultType,
      cux_Result_Status__c: outcomeToResultStatus(outcome, isManual),
      cux_Outcome__c: outcome,
      cux_Severity__c: rule.cux_Severity__c,
      cux_Message__c: message,
      cux_Evidence_Ref__c: evidenceRef,
      cux_Execution_Mode__c: executionMode,
      cux_Rule_Id__c: rule.cux_Rule_Code__c,
      cux_Completed_At__c: new Date().toISOString(),
    }

    await client.createValidationResult(resultData)
    return resultData
  }

  // ─── Handler Registry ───

  const handlers = {}

  /**
   * Register a deterministic rule handler.
   * @param {string} key - handler key matching cux_Handler_Key__c
   * @param {function} fn - async (targetEntityType, targetEntityId, rule, client) => { outcome, message, evidenceRef? }
   */
  function registerHandler(key, fn) {
    handlers[key] = fn
  }

  async function runHandler(handlerKey, targetEntityType, targetEntityId, rule) {
    const handler = handlers[handlerKey]
    if (!handler) {
      return {
        outcome: 'WARN',
        message: `Handler not registered: ${handlerKey}`,
      }
    }
    return handler(targetEntityType, targetEntityId, rule, client)
  }

  /**
   * Evaluate a simple expression against a target record.
   * Supports:
   *   - field != null / field == null
   *   - field > value / field < value / field >= value / field <= value
   *   - field < field (date/number comparison)
   *   - AND to combine conditions
   * @param {string} expression - e.g. "cux_Title__c != null"
   * @param {object|null} record - the target entity record data
   */
  function evaluateExpression(expression, record) {
    if (!record) {
      return { outcome: 'WARN', message: `Expression evaluation deferred (no record data): ${expression}` }
    }

    try {
      // Split on AND and evaluate each condition
      const conditions = expression.split(/\s+AND\s+/)
      const failures = []

      for (const condition of conditions) {
        const trimmed = condition.trim()
        if (!evaluateCondition(trimmed, record)) {
          failures.push(trimmed)
        }
      }

      if (failures.length === 0) {
        return { outcome: 'PASS', message: `All conditions satisfied: ${expression}` }
      }
      return { outcome: 'FAIL', message: `Failed conditions: ${failures.join(', ')}` }
    } catch (err) {
      return { outcome: 'WARN', message: `Expression evaluation error: ${err.message}` }
    }
  }

  /**
   * Evaluate a single condition like "field != null" or "field > 0" or "fieldA < fieldB".
   */
  function evaluateCondition(condition, record) {
    // Match: field operator value/field
    const match = condition.match(/^(\S+)\s*(!=|==|>=|<=|>|<)\s*(.+)$/)
    if (!match) throw new Error(`Cannot parse condition: ${condition}`)

    const [, leftToken, operator, rightToken] = match
    const leftVal = resolveValue(leftToken.trim(), record)
    const rightVal = resolveValue(rightToken.trim(), record)

    switch (operator) {
      case '!=': return rightToken.trim() === 'null' ? leftVal != null && leftVal !== '' : leftVal !== rightVal
      case '==': return rightToken.trim() === 'null' ? leftVal == null || leftVal === '' : leftVal === rightVal
      case '>':  return Number(leftVal) > Number(rightVal)
      case '<':  return compareLessThan(leftVal, rightVal)
      case '>=': return Number(leftVal) >= Number(rightVal)
      case '<=': return Number(leftVal) <= Number(rightVal)
      default:   throw new Error(`Unknown operator: ${operator}`)
    }
  }

  /** Resolve a token to a value — either a record field, a number, or a string literal. */
  function resolveValue(token, record) {
    if (token === 'null') return null
    if (token === 'true') return true
    if (token === 'false') return false
    if (/^-?\d+(\.\d+)?$/.test(token)) return Number(token)
    if (/^['"].*['"]$/.test(token)) return token.slice(1, -1)
    // Treat as field name
    return record[token] !== undefined ? record[token] : null
  }

  /** Compare two values — supports dates (string comparison works for ISO dates) and numbers. */
  function compareLessThan(a, b) {
    if (typeof a === 'string' && typeof b === 'string') return a < b
    return Number(a) < Number(b)
  }

  // ─── Approval Gate ───

  /**
   * Determine if a target entity is eligible for approval transition.
   * Checks all completed validation requests for blocking findings.
   */
  async function getApprovalGate(targetEntityType, targetEntityId, stage) {
    let requests = await client.getValidationRequests(targetEntityType, targetEntityId)
    // Filter by stage if provided
    if (stage && requests?.length > 0) {
      const stageFiltered = requests.filter((r) => r.cux_Stage__c === stage)
      if (stageFiltered.length > 0) requests = stageFiltered
    }
    if (!requests || requests.length === 0) {
      return {
        allowed: false,
        reasonCodes: ['NO_VALIDATION'],
        message: 'No validation has been performed',
        blockingFindings: [],
        requiredTasksIncomplete: [],
      }
    }

    // Get the most recent completed request
    const latestCompleted = requests.find((r) => r.cux_Status__c === 'Completed')
    if (!latestCompleted) {
      const inProgress = requests.find((r) => r.cux_Status__c === 'Running')
      return {
        allowed: false,
        reasonCodes: inProgress ? ['VALIDATION_IN_PROGRESS'] : ['NO_COMPLETED_VALIDATION'],
        message: inProgress ? 'Validation is still in progress' : 'No completed validation found',
        blockingFindings: [],
        requiredTasksIncomplete: [],
      }
    }

    if (latestCompleted.cux_Outcome__c === 'PASS') {
      return { allowed: true, reasonCodes: [], message: 'All validations passed', blockingFindings: [], requiredTasksIncomplete: [] }
    }

    // Get results to determine specific blocking issues
    const results = await client.getValidationResults(latestCompleted.Id)

    const blockingFindings = results.filter(
      (r) => r.cux_Outcome__c === 'FAIL' && ['ERROR', 'CRITICAL'].includes(r.cux_Severity__c)
    )

    const requiredTasksIncomplete = results.filter(
      (r) => r.cux_Result_Type__c === 'CHECKLIST' && r.cux_Outcome__c !== 'PASS' && r.cux_Severity__c !== 'INFO'
    )

    const reasonCodes = []
    if (blockingFindings.length > 0) reasonCodes.push('BLOCKING_FINDINGS')
    if (requiredTasksIncomplete.length > 0) reasonCodes.push('REQUIRED_TASKS_INCOMPLETE')

    return {
      allowed: latestCompleted.cux_Outcome__c === 'PASS_WITH_WARNINGS',
      reasonCodes,
      message: latestCompleted.cux_Outcome__c === 'PASS_WITH_WARNINGS'
        ? 'Validation passed with warnings - approval allowed'
        : `Approval blocked: ${blockingFindings.length} blocking findings, ${requiredTasksIncomplete.length} incomplete tasks`,
      blockingFindings: blockingFindings.map((f) => ({
        resultId: f.Id,
        ruleId: f.cux_Rule_Id__c,
        severity: f.cux_Severity__c,
        message: f.cux_Message__c,
      })),
      requiredTasksIncomplete: requiredTasksIncomplete.map((t) => ({
        resultId: t.Id,
        taskCode: t.cux_Rule_Id__c,
        message: t.cux_Message__c,
      })),
    }
  }

  // ─── Record Manual Checklist Result ───

  /**
   * Record the completion of a manual checklist task.
   * Updates the existing ValidationResult for the given template.
   */
  async function recordChecklistResult(input) {
    const {
      requestId,
      baselineTaskTemplateId,
      taskCode,
      outcome,
      message,
      evidenceRef,
      executedByActorId,
    } = input

    if (!requestId) throw new ValidationEngineError('MISSING_INPUT', 'requestId is required')
    if (!outcome || !['PASS', 'WARN', 'FAIL'].includes(outcome)) {
      throw new ValidationEngineError('INVALID_OUTCOME', 'outcome must be PASS, WARN, or FAIL')
    }
    if (!executedByActorId) {
      throw new ValidationEngineError('MISSING_ACTOR', 'executedByActorId is required for manual results')
    }

    // Find existing result for this checklist item
    const results = await client.getValidationResults(requestId)
    const existing = results.find((r) => {
      if (r.cux_Result_Type__c !== 'CHECKLIST') return false
      if (baselineTaskTemplateId && r.cux_Baseline_Task_Template__c === baselineTaskTemplateId) return true
      if (taskCode && r.cux_Rule_Id__c === taskCode) return true
      return false
    })

    if (existing) {
      // Update existing result
      await client.updateValidationResult(existing.Id, {
        cux_Result_Status__c: outcomeToResultStatus(outcome, true),
        cux_Outcome__c: outcome,
        cux_Message__c: message || `Checklist completed: ${outcome}`,
        cux_Evidence_Ref__c: evidenceRef || null,
        cux_Executed_By_Actor_Id__c: executedByActorId,
        cux_Execution_Mode__c: 'MANUAL',
        cux_Completed_At__c: new Date().toISOString(),
      })
      return { resultId: existing.Id, updated: true }
    }

    // Create new result if no existing one found
    const { id } = await client.createValidationResult({
      cux_Validation_Request__c: requestId,
      cux_Result_Type__c: 'CHECKLIST',
      cux_Result_Status__c: outcomeToResultStatus(outcome, true),
      cux_Outcome__c: outcome,
      cux_Severity__c: outcome === 'FAIL' ? 'ERROR' : outcome === 'WARN' ? 'WARNING' : 'INFO',
      cux_Message__c: message || `Checklist completed: ${outcome}`,
      cux_Evidence_Ref__c: evidenceRef || null,
      cux_Execution_Mode__c: 'MANUAL',
      cux_Executed_By_Actor_Id__c: executedByActorId,
      cux_Baseline_Task_Template__c: baselineTaskTemplateId || null,
      cux_Rule_Id__c: taskCode || null,
      cux_Completed_At__c: new Date().toISOString(),
    })

    return { resultId: id, updated: false }
  }

  // ─── Get Validation Status ───

  async function getValidationStatus(requestId) {
    const request = await client.getValidationRequest(requestId)
    if (!request) throw new ValidationEngineError('NOT_FOUND', `ValidationRequest ${requestId} not found`)

    const results = await client.getValidationResults(requestId)
    const blockingCount = results.filter(
      (r) => r.cux_Outcome__c === 'FAIL' && ['ERROR', 'CRITICAL'].includes(r.cux_Severity__c)
    ).length
    const requiredIncomplete = results.filter(
      (r) => r.cux_Result_Type__c === 'CHECKLIST' && r.cux_Outcome__c !== 'PASS' && r.cux_Severity__c !== 'INFO'
    ).length

    return {
      requestId: request.Id,
      name: request.Name,
      status: request.cux_Status__c,
      outcome: request.cux_Outcome__c,
      completedAt: request.cux_Completed_At__c,
      totalResults: results.length,
      blockingFindingCount: blockingCount,
      requiredTasksIncompleteCount: requiredIncomplete,
      passCount: results.filter((r) => r.cux_Outcome__c === 'PASS').length,
      warnCount: results.filter((r) => r.cux_Outcome__c === 'WARN').length,
      failCount: results.filter((r) => r.cux_Outcome__c === 'FAIL').length,
    }
  }

  // ─── Review WorkTask Creation ───

  async function createReviewWorkTask(requestId, targetEntityType, targetEntityId, stage) {
    // Skip if an open review WorkTask already exists for this entity + stage (prevents duplicates on re-run)
    // Stage-aware: allow multiple review tasks per entity (one per stage)
    const stageFilter = stage
      ? `AND cux_Title__c LIKE '%[${stage}]%'`
      : ''
    const existing = await client.query(
      `SELECT Id FROM cux_WorkTask__c WHERE cux_Entity_Id__c = '${targetEntityId}' AND cux_Assigned_Role__c = 'Review' AND cux_Status__c NOT IN ('Complete','Cancelled') ${stageFilter} LIMIT 1`
    )
    if (existing.length > 0) return

    // Fetch entity name for a descriptive title
    let entityName = targetEntityType
    const sobject = TARGET_TYPE_TO_SOBJECT[targetEntityType]
    if (sobject) {
      try {
        const record = await client.getRecord(sobject, targetEntityId)
        entityName = record.Name || entityName
      } catch (_) {
        // Non-critical — use entity type as fallback
      }
    }

    const stageLabel = stage ? ` [${stage}]` : ''
    const taskData = {
      cux_Title__c: `Review ${targetEntityType}${stageLabel}: ${entityName}`,
      cux_Status__c: 'Not Started',
      cux_Priority__c: 'High',
      cux_Entity_Type__c: sobject || targetEntityType,
      cux_Entity_Id__c: targetEntityId,
      cux_Is_Required__c: true,
      cux_Assigned_Role__c: 'Review',
      cux_Source_Definition_Id__c: requestId,
      cux_Description__c: `Complete the ${stage ? stage + ' ' : ''}review checklist for this ${targetEntityType.toLowerCase()}.`,
    }

    // Link to parent entity for easier querying
    if (targetEntityType === 'Contract') {
      taskData.cux_Contract__c = targetEntityId
    } else if (targetEntityType === 'Task Order') {
      taskData.cux_Task_Order__c = targetEntityId
    } else if (targetEntityType === 'Invoice') {
      taskData.cux_Invoice__c = targetEntityId
    }

    await client.createWorkTask(taskData)
  }

  // ─── Helpers ───

  async function findExistingRequest(idempotencyKey, targetEntityType, targetEntityId) {
    const requests = await client.getValidationRequests(targetEntityType, targetEntityId)
    return requests?.find((r) => r.cux_Idempotency_Key__c === idempotencyKey) || null
  }

  function isBlocking(result) {
    return ['ERROR', 'CRITICAL'].includes(result.cux_Severity__c)
  }

  /** Map outcome to the cux_Result_Status__c picklist values (Pass, Fail, Warning, Manual Review Required) */
  function outcomeToResultStatus(outcome, isManual) {
    if (isManual && outcome === 'WARN') return 'Manual Review Required'
    if (outcome === 'PASS') return 'Pass'
    if (outcome === 'FAIL') return 'Fail'
    return 'Warning'
  }

  function sanitizeError(error) {
    const msg = error?.message || String(error)
    // Remove potential secrets/tokens from error messages
    return msg.replace(/Bearer\s+\S+/g, 'Bearer [REDACTED]').replace(/00D\w{12,}/g, '[ORG_ID]')
  }

  // ─── Public API ───

  return {
    resolveProfile,
    requestValidation,
    getApprovalGate,
    recordChecklistResult,
    getValidationStatus,
    registerHandler,
  }
}

/**
 * Custom error class for validation engine errors
 */
export class ValidationEngineError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'ValidationEngineError'
    this.code = code
  }
}
