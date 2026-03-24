import * as React from 'react'

import { useSalesforceClient } from '@/hooks/use-salesforce'
import { createValidationEngine } from '@/services/validation-engine'

/**
 * Hook that provides a memoized validation engine instance.
 * Returns null if the Salesforce client is not available.
 */
export function useValidationEngine() {
  const client = useSalesforceClient()

  const engine = React.useMemo(() => {
    if (!client) return null
    return createValidationEngine(client)
  }, [client])

  return engine
}

/**
 * Hook to run a validation and track its state.
 * Returns { run, loading, result, error, reset }
 */
export function useRunValidation() {
  const engine = useValidationEngine()
  const [loading, setLoading] = React.useState(false)
  const [result, setResult] = React.useState(null)
  const [error, setError] = React.useState(null)

  const run = React.useCallback(
    async (input) => {
      if (!engine) {
        setError(new Error('Validation engine not available'))
        return null
      }

      setLoading(true)
      setError(null)
      setResult(null)

      try {
        const res = await engine.requestValidation(input)
        setResult(res)
        setLoading(false)
        return res
      } catch (err) {
        setError(err)
        setLoading(false)
        return null
      }
    },
    [engine]
  )

  const reset = React.useCallback(() => {
    setLoading(false)
    setResult(null)
    setError(null)
  }, [])

  return { run, loading, result, error, reset }
}

// ─── Plain helpers (not hooks — safe to call from any async context) ───

function buildEntityLink(entityType, entityId) {
  const map = {
    Contract: `/dashboard/contracts/${entityId}`,
    'Task Order': `/dashboard/task-orders/${entityId}`,
    Invoice: `/dashboard/invoices/${entityId}`,
  }
  return map[entityType] || `/dashboard`
}

/**
 * Trigger validation for a specific lifecycle stage.
 * Returns the validation result, or null if no profile exists for this stage.
 */
export async function triggerStageValidation(client, targetEntityType, targetEntityId, stage) {
  try {
    const engine = createValidationEngine(client)
    const result = await engine.requestValidation({
      targetEntityType,
      targetEntityId,
      stage,
      idempotencyKey: `${(stage || 'initial').toLowerCase().replace(/\s+/g, '-')}-${targetEntityType.toLowerCase().replace(/\s+/g, '-')}-${targetEntityId}`,
    })
    return result
  } catch (err) {
    if (err.code === 'NO_PROFILE') {
      console.info(`No validation profile for ${targetEntityType} stage "${stage}" — skipping`)
      return null
    }
    console.warn(`Stage validation failed for ${targetEntityType} [${stage}]:`, err)
    return null
  }
}

/**
 * Trigger initial validation when an entity is created (Draft stage).
 * Delegates to triggerStageValidation with stage='Draft'.
 */
export async function triggerInitialValidation(client, targetEntityType, targetEntityId) {
  return triggerStageValidation(client, targetEntityType, targetEntityId, 'Draft')
}

/**
 * Assign (or reassign) an entity's review WorkTask to a user and send a notification.
 * Call after updating the entity's assignment field.
 * Finds the most recent open review WorkTask for the entity (stage-aware via title).
 */
export async function assignReviewWork(client, entityType, entityId, assigneeUserId, entityName) {
  // Find ALL open review WorkTasks for this entity and assign them all
  const tasks = await client.query(
    `SELECT Id FROM cux_WorkTask__c WHERE cux_Entity_Id__c = '${entityId}' AND cux_Assigned_Role__c = 'Review' AND cux_Status__c NOT IN ('Complete','Cancelled') ORDER BY CreatedDate DESC LIMIT 10`
  )
  if (tasks.length > 0) {
    await Promise.all(
      tasks.map((t) =>
        client.updateWorkTask(t.Id, { cux_Assigned_To__c: assigneeUserId })
      )
    )
  } else {
    // No review WorkTask exists yet — create one so the assignment is tracked
    const sobjectMap = { Contract: 'cux_Contract__c', 'Task Order': 'cux_Task_Order__c', Invoice: 'cux_Invoice__c' }
    const taskData = {
      cux_Title__c: `Review ${entityType}: ${entityName || entityType}`,
      cux_Status__c: 'Not Started',
      cux_Priority__c: 'High',
      cux_Entity_Type__c: sobjectMap[entityType] || entityType,
      cux_Entity_Id__c: entityId,
      cux_Assigned_To__c: assigneeUserId,
      cux_Assigned_Role__c: 'Review',
      cux_Is_Required__c: true,
      cux_Description__c: `Review assigned for this ${entityType.toLowerCase()}.`,
    }
    if (sobjectMap[entityType]) {
      const parentField = sobjectMap[entityType]
      taskData[parentField] = entityId
    }
    await client.createWorkTask(taskData)
  }

  // Send notification
  await client.createNotification({
    cux_User__c: assigneeUserId,
    cux_Title__c: `${entityType} assigned for review`,
    cux_Message__c: `${entityName || entityType} has been assigned to you for review.`,
    cux_Type__c: 'Action Required',
    cux_Category__c: entityType === 'Task Order' ? 'Task Order' : entityType,
    cux_Link__c: buildEntityLink(entityType, entityId),
  })
}

/**
 * Complete the review WorkTask for an entity's current stage.
 * If stage is provided, completes only the WorkTask matching that stage (via title).
 * Otherwise completes the most recent open review task.
 */
export async function completeReviewWork(client, entityId, userId, stage) {
  const stageFilter = stage
    ? `AND cux_Title__c LIKE '%[${stage}]%'`
    : ''
  const tasks = await client.query(
    `SELECT Id FROM cux_WorkTask__c WHERE cux_Entity_Id__c = '${entityId}' AND cux_Assigned_Role__c = 'Review' AND cux_Status__c NOT IN ('Complete','Cancelled') ${stageFilter} ORDER BY CreatedDate DESC LIMIT 1`
  )
  if (tasks.length > 0) {
    await client.completeWorkTask(tasks[0].Id, userId)
  }
}

/**
 * Reopen a completed review WorkTask when a supervisor rejects/returns the review.
 * Clears completion fields, sets status back to "Not Started", and notifies the original reviewer.
 */
export async function reopenReviewWork(client, entityType, entityId, stage, rejectorUserId, rejectionNotes) {
  const stageFilter = stage
    ? `AND cux_Title__c LIKE '%[${stage}]%'`
    : ''
  const tasks = await client.query(
    `SELECT Id, cux_Assigned_To__c FROM cux_WorkTask__c WHERE cux_Entity_Id__c = '${entityId}' AND cux_Assigned_Role__c = 'Review' AND cux_Status__c = 'Complete' ${stageFilter} ORDER BY cux_Completed_At__c DESC LIMIT 1`
  )
  if (tasks.length === 0) return null

  const task = tasks[0]

  // Reopen — clear completion, set back to Not Started
  await client.updateWorkTask(task.Id, {
    cux_Status__c: 'Not Started',
    cux_Completed_By__c: null,
    cux_Completed_At__c: null,
  })

  // Notify the original reviewer (if assigned and not the rejector themselves)
  if (task.cux_Assigned_To__c && task.cux_Assigned_To__c !== rejectorUserId) {
    await client.createNotification({
      cux_User__c: task.cux_Assigned_To__c,
      cux_Title__c: `${entityType} review returned`,
      cux_Message__c: rejectionNotes
        ? `Your review was returned with notes: "${rejectionNotes}". Please revisit and resubmit.`
        : `Your review was returned. Please revisit and resubmit.`,
      cux_Type__c: 'Action Required',
      cux_Category__c: entityType === 'Task Order' ? 'Task Order' : entityType,
      cux_Link__c: buildEntityLink(entityType, entityId),
    })
  }

  return { reopenedTaskId: task.Id, notifiedUserId: task.cux_Assigned_To__c }
}

/**
 * Hook to check approval gate status for a target entity.
 * Returns { gate, loading, error, refetch }
 */
export function useApprovalGate(targetEntityType, targetEntityId, stage) {
  const engine = useValidationEngine()
  const [gate, setGate] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  const refetch = React.useCallback(async () => {
    if (!engine || !targetEntityType || !targetEntityId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await engine.getApprovalGate(targetEntityType, targetEntityId, stage)
      setGate(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [engine, targetEntityType, targetEntityId, stage])

  React.useEffect(() => {
    refetch()
  }, [refetch])

  return { gate, loading, error, refetch }
}
