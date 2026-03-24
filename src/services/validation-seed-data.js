/**
 * VaaS Seed Data — Stage-Based Baseline Task Libraries and Profiles
 *
 * Each lifecycle stage that requires validation has its own profile and task set.
 * Run via the UI or console to populate initial validation configuration.
 * Usage: const seeder = createValidationSeeder(client); await seeder.seedAll();
 */

export function createValidationSeeder(client) {
  if (!client) throw new Error('Seeder requires a Salesforce client')

  // ─── Stage-Specific Baseline Task Templates ───

  const BASELINE_TASKS = {
    // ─── Contract Stage-Specific Sets ───
    'Contract Draft Review': {
      description: 'Review checklist for contracts in Draft stage',
      tasks: [
        { code: 'CTR-D-001', title: 'Verify contract title and description are complete', role: 'Contract Specialist', severity: 'ERROR', sort: 10 },
        { code: 'CTR-D-002', title: 'Verify vendor/parties identified', role: 'Contract Specialist', severity: 'ERROR', sort: 20 },
        { code: 'CTR-D-003', title: 'Verify period of performance dates entered', role: 'Contract Specialist', severity: 'ERROR', sort: 30 },
        { code: 'CTR-D-004', title: 'Verify authorized amount and funding reference', role: 'Finance Analyst', severity: 'ERROR', sort: 40 },
      ],
    },
    'Contract Under Review Review': {
      description: 'Review checklist for contracts in Under Review stage',
      tasks: [
        { code: 'CTR-UR-001', title: 'Review completeness of scope of work', role: 'Contracting Officer', severity: 'ERROR', sort: 10 },
        { code: 'CTR-UR-002', title: 'Verify regulatory and compliance requirements met', role: 'Contracting Officer', severity: 'ERROR', sort: 20 },
        { code: 'CTR-UR-003', title: 'Verify required supporting documents attached', role: 'Contract Specialist', severity: 'ERROR', sort: 30 },
        { code: 'CTR-UR-004', title: 'Verify terms and conditions are standard or approved', role: 'Contracting Officer', severity: 'WARNING', sort: 40 },
      ],
    },
    'Contract Approved For Procurement Review': {
      description: 'Review checklist for contracts in Approved For Procurement stage',
      tasks: [
        { code: 'CTR-AP-001', title: 'Verify procurement package complete', role: 'Contract Specialist', severity: 'ERROR', sort: 10 },
        { code: 'CTR-AP-002', title: 'Verify funding availability confirmed', role: 'Finance Analyst', severity: 'ERROR', sort: 20 },
      ],
    },
    'Contract Submitted To Procurement Review': {
      description: 'Review checklist for contracts in Submitted To Procurement stage',
      tasks: [
        { code: 'CTR-SP-001', title: 'Verify solicitation package submitted to procurement office', role: 'Contract Specialist', severity: 'ERROR', sort: 10 },
        { code: 'CTR-SP-002', title: 'Verify procurement method and justification documented', role: 'Contracting Officer', severity: 'ERROR', sort: 20 },
        { code: 'CTR-SP-003', title: 'Verify independent cost estimate completed', role: 'Finance Analyst', severity: 'ERROR', sort: 30 },
        { code: 'CTR-SP-004', title: 'Verify all required approvals obtained before solicitation', role: 'Contracting Officer', severity: 'ERROR', sort: 40 },
      ],
    },
    'Contract Awarded Review': {
      description: 'Review checklist for contracts in Awarded stage',
      tasks: [
        { code: 'CTR-AW-001', title: 'Verify award notification issued', role: 'Contracting Officer', severity: 'ERROR', sort: 10 },
        { code: 'CTR-AW-002', title: 'Verify signed contract received from vendor', role: 'Contract Specialist', severity: 'ERROR', sort: 20 },
        { code: 'CTR-AW-003', title: 'Verify signed STD 213 is uploaded', role: 'Contract Specialist', severity: 'ERROR', sort: 30 },
      ],
    },
    // ─── Task Order Stage-Specific Sets ───
    'Task Order Draft Review': {
      description: 'Review checklist for task orders in Draft stage',
      tasks: [
        { code: 'TOR-D-001', title: 'Verify parent contract is active and allows new task orders', role: 'Contracting Officer', severity: 'ERROR', sort: 10 },
        { code: 'TOR-D-002', title: 'Verify scope summary is complete', role: 'Contract Specialist', severity: 'ERROR', sort: 20 },
        { code: 'TOR-D-003', title: 'Verify authorized amount within contract ceiling', role: 'Finance Analyst', severity: 'ERROR', sort: 30 },
        { code: 'TOR-D-004', title: 'Verify start/end dates within contract period', role: 'Contract Specialist', severity: 'ERROR', sort: 40 },
      ],
    },
    'Task Order Under Review Review': {
      description: 'Review checklist for task orders in Under Review stage',
      tasks: [
        { code: 'TOR-UR-001', title: 'Verify deliverables and milestones defined', role: 'Program Manager', severity: 'ERROR', sort: 10 },
        { code: 'TOR-UR-002', title: 'Verify personnel requirements identified', role: 'Program Manager', severity: 'WARNING', sort: 20 },
        { code: 'TOR-UR-003', title: 'Verify cost breakdown matches authorized amount', role: 'Finance Analyst', severity: 'ERROR', sort: 30 },
      ],
    },
    'Task Order Approved Review': {
      description: 'Review checklist for task orders in Approved stage',
      tasks: [
        { code: 'TOR-A-001', title: 'Verify approval authority documented', role: 'Contracting Officer', severity: 'ERROR', sort: 10 },
        { code: 'TOR-A-002', title: 'Verify task order signed by both parties', role: 'Contract Specialist', severity: 'ERROR', sort: 20 },
      ],
    },

    // ─── Invoice Stage-Specific Sets ───
    'Invoice Draft Review': {
      description: 'Review checklist for invoices in Draft stage',
      tasks: [
        { code: 'INR-D-001', title: 'Verify invoice amount matches supporting documentation', role: 'Finance Analyst', severity: 'ERROR', sort: 10 },
        { code: 'INR-D-002', title: 'Verify service period is within task order dates', role: 'Finance Analyst', severity: 'ERROR', sort: 20 },
        { code: 'INR-D-003', title: 'Verify external invoice number is present', role: 'Finance Analyst', severity: 'ERROR', sort: 30 },
      ],
    },
    'Invoice Review Review': {
      description: 'Review checklist for invoices in Review stage',
      tasks: [
        { code: 'INR-R-001', title: 'Verify timesheets are uploaded', role: 'Finance Analyst', severity: 'ERROR', sort: 10 },
        { code: 'INR-R-002', title: 'Validate grand total', role: 'Finance Analyst', severity: 'ERROR', sort: 20 },
        { code: 'INR-R-003', title: 'Validate employee list', role: 'Contract Specialist', severity: 'ERROR', sort: 30 },
        { code: 'INR-R-004', title: 'Validate timesheets', role: 'Finance Analyst', severity: 'ERROR', sort: 40 },
        { code: 'INR-R-005', title: 'Validate overtime approval', role: 'Contract Specialist', severity: 'WARNING', sort: 50 },
        { code: 'INR-R-006', title: 'Validate encumbrances', role: 'Finance Analyst', severity: 'ERROR', sort: 60 },
      ],
    },
    'Invoice Approval Review': {
      description: 'Review checklist for invoices in Approval stage',
      tasks: [
        { code: 'INR-A-001', title: 'Verify payment routing information correct', role: 'Finance Analyst', severity: 'ERROR', sort: 10 },
        { code: 'INR-A-002', title: 'Verify approval authority signature obtained', role: 'Finance Analyst', severity: 'ERROR', sort: 20 },
      ],
    },

    // ─── Legacy entity type sets (no stage — fallback) ───
    'Amendment Review (MIN)': {
      description: 'Minimal review checklist for contract amendments',
      tasks: [
        { code: 'AMR-001', title: 'Verify amendment type and effective date', role: 'Contract Specialist', severity: 'ERROR', sort: 10 },
        { code: 'AMR-004', title: 'Verify prior version preserved and referenced', role: 'Contract Specialist', severity: 'ERROR', sort: 20 },
      ],
    },
    'Task Order Supplement Review (MIN)': {
      description: 'Minimal review checklist for task order supplements',
      tasks: [
        { code: 'TOS-002', title: 'Verify supplement supersedes current approved', role: 'Contract Specialist', severity: 'ERROR', sort: 10 },
      ],
    },
    'Termination Review (MIN)': {
      description: 'Minimal review checklist for terminations',
      tasks: [
        { code: 'TER-002', title: 'Verify effective date / cutoff date', role: 'Contracting Officer', severity: 'ERROR', sort: 10 },
      ],
    },
    'Settlement Review (MIN)': {
      description: 'Minimal review checklist for settlements',
      tasks: [
        { code: 'SET-001', title: 'Verify settlement basis and calculations', role: 'Finance Analyst', severity: 'ERROR', sort: 10 },
      ],
    },
  }

  // ─── Profile Definitions (stage-specific + legacy fallback) ───

  const SAMPLE_PROFILES = [
    // Contract stage profiles
    { name: 'CONTRACT_DRAFT_REVIEW', entityType: 'Contract', stage: 'Draft', taskSetName: 'Contract Draft Review' },
    { name: 'CONTRACT_UNDER_REVIEW_REVIEW', entityType: 'Contract', stage: 'Under Review', taskSetName: 'Contract Under Review Review' },
    { name: 'CONTRACT_APPROVED_PROCUREMENT_REVIEW', entityType: 'Contract', stage: 'Approved For Procurement', taskSetName: 'Contract Approved For Procurement Review' },
    { name: 'CONTRACT_SUBMITTED_PROCUREMENT_REVIEW', entityType: 'Contract', stage: 'Submitted To Procurement', taskSetName: 'Contract Submitted To Procurement Review' },
    { name: 'CONTRACT_AWARDED_REVIEW', entityType: 'Contract', stage: 'Awarded', taskSetName: 'Contract Awarded Review' },

    // Task Order stage profiles
    { name: 'TASKORDER_DRAFT_REVIEW', entityType: 'Task Order', stage: 'Draft', taskSetName: 'Task Order Draft Review' },
    { name: 'TASKORDER_UNDER_REVIEW_REVIEW', entityType: 'Task Order', stage: 'Under Review', taskSetName: 'Task Order Under Review Review' },
    { name: 'TASKORDER_APPROVED_REVIEW', entityType: 'Task Order', stage: 'Approved', taskSetName: 'Task Order Approved Review' },

    // Invoice stage profiles
    { name: 'INVOICE_DRAFT_REVIEW', entityType: 'Invoice', stage: 'Draft', taskSetName: 'Invoice Draft Review' },
    { name: 'INVOICE_REVIEW_REVIEW', entityType: 'Invoice', stage: 'Review', taskSetName: 'Invoice Review Review' },
    { name: 'INVOICE_APPROVAL_REVIEW', entityType: 'Invoice', stage: 'Approval', taskSetName: 'Invoice Approval Review' },

    // Legacy fallback profiles (no stage)
    { name: 'CONTRACT_AMENDMENT_REVIEW_MINIMAL', entityType: 'Contract Amendment', stage: null, taskSetName: 'Amendment Review (MIN)' },
    { name: 'TERMINATION_REVIEW_MINIMAL', entityType: 'Termination', stage: null, taskSetName: 'Termination Review (MIN)' },
    { name: 'SETTLEMENT_REVIEW_MINIMAL', entityType: 'Settlement', stage: null, taskSetName: 'Settlement Review (MIN)' },
  ]

  // ─── Seeder Functions ───

  async function seedBaselineTaskSets() {
    const created = []

    for (const [setName, config] of Object.entries(BASELINE_TASKS)) {
      // Create the task set
      const { id: taskSetId } = await client.createBaselineTaskSet({
        cux_Set_Name__c: setName,
        cux_Description__c: config.description,
        cux_Is_Active__c: true,
        cux_Effective_Start__c: '2026-01-01',
      })

      // Create task templates
      for (const task of config.tasks) {
        await client.createBaselineTaskTemplate({
          cux_Baseline_Task_Set__c: taskSetId,
          cux_Task_Code__c: task.code,
          cux_Title__c: task.title,
          cux_Default_Assignee_Role__c: task.role,
          cux_Required__c: true,
          cux_Severity_If_Incomplete__c: task.severity,
          cux_Sort_Order__c: task.sort,
        })
      }

      created.push({ id: taskSetId, name: setName, taskCount: config.tasks.length })
    }

    return created
  }

  async function seedProfiles(taskSetMap) {
    const created = []

    for (const profile of SAMPLE_PROFILES) {
      const data = {
        cux_Profile_Name__c: profile.name,
        cux_Target_Entity_Type__c: profile.entityType,
        cux_Version__c: '1.0',
        cux_Is_Active__c: true,
        cux_Effective_Start__c: '2026-01-01',
        cux_Stage__c: profile.stage || null,
      }

      if (profile.taskSetName && taskSetMap[profile.taskSetName]) {
        data.cux_Baseline_Task_Set__c = taskSetMap[profile.taskSetName]
      }

      const { id } = await client.createValidationProfile(data)
      created.push({ id, name: profile.name, entityType: profile.entityType, stage: profile.stage })
    }

    return created
  }

  async function seedAll() {
    const log = []

    // 1. Seed baseline task sets
    log.push('Creating baseline task sets...')
    const taskSets = await seedBaselineTaskSets()
    const taskSetMap = {}
    for (const ts of taskSets) {
      taskSetMap[ts.name] = ts.id
      log.push(`  Created: ${ts.name} (${ts.taskCount} tasks)`)
    }

    // 2. Seed profiles
    log.push('Creating validation profiles...')
    const profiles = await seedProfiles(taskSetMap)
    for (const p of profiles) {
      log.push(`  Created: ${p.name} for ${p.entityType}${p.stage ? ` [${p.stage}]` : ''}`)
    }

    log.push(`Seed complete: ${taskSets.length} task sets, ${profiles.length} profiles`)

    return {
      taskSets,
      profiles,
      log,
    }
  }

  return {
    seedBaselineTaskSets,
    seedProfiles,
    seedAll,
  }
}
