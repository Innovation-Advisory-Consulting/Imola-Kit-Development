import axios from 'axios'

const API_VERSION = import.meta.env.VITE_SF_API_VERSION || 'v65.0'

export function createSalesforceClient(instanceUrl, accessToken) {
  const client = axios.create({
    baseURL: `${instanceUrl}/services/data/${API_VERSION}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  const query = (soql) =>
    client.get('/query', { params: { q: soql.replace(/\s+/g, ' ').trim() } }).then((r) => r.data.records)

  const getRecord = (sobject, id) =>
    client.get(`/sobjects/${sobject}/${id}`).then((r) => r.data)

  const createRecord = (sobject, data) =>
    client.post(`/sobjects/${sobject}`, data).then((r) => r.data)

  const updateRecord = (sobject, id, data) =>
    client.patch(`/sobjects/${sobject}/${id}`, data).then((r) => r.data)

  const deleteRecord = (sobject, id) =>
    client.delete(`/sobjects/${sobject}/${id}`).then((r) => r.data)

  const uploadContentVersion = async (file) => {
    const formData = new FormData()
    const versionData = JSON.stringify({
      Title: file.name,
      PathOnClient: file.name,
    })
    formData.append('entity_content', new Blob([versionData], { type: 'application/json' }), '')
    formData.append('VersionData', file, file.name)

    const response = await axios.post(
      `${instanceUrl}/services/data/${API_VERSION}/sobjects/ContentVersion`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  }

  const getContentDocumentId = async (contentVersionId) => {
    const rows = await query(
      `SELECT ContentDocumentId FROM ContentVersion WHERE Id = '${contentVersionId}' LIMIT 1`
    )
    return rows[0]?.ContentDocumentId || null
  }

  const getContentVersionDownloadUrl = (contentVersionId) =>
    `${instanceUrl}/services/data/${API_VERSION}/sobjects/ContentVersion/${contentVersionId}/VersionData`

  const downloadContentVersion = async (contentVersionId, fileName) => {
    const response = await axios.get(
      `${instanceUrl}/services/data/${API_VERSION}/sobjects/ContentVersion/${contentVersionId}/VersionData`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: 'blob',
      }
    )
    const url = window.URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || 'download'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  return {
    // Generic helpers
    query,
    getRecord,
    createRecord,
    updateRecord,
    deleteRecord,
    uploadContentVersion,
    getContentDocumentId,
    getContentVersionDownloadUrl,
    downloadContentVersion,
    accessToken,

    // ─── Global Search (SOQL-based) ───
    search: async (term) => {
      const safe = term.replace(/'/g, "\\'").replace(/%/g, '\\%').replace(/_/g, '\\_')
      const like = `%${safe}%`
      const [contracts, taskOrders, accounts, contacts] = await Promise.all([
        query(`SELECT Id, Name, cux_Title__c, cux_Status__c, cux_Contract_Type__c FROM cux_Contract__c WHERE Name LIKE '${like}' OR cux_Title__c LIKE '${like}' LIMIT 10`),
        query(`SELECT Id, Name, cux_Scope_Summary__c, cux_Status__c, cux_Task_Order_Type__c FROM cux_TaskOrder__c WHERE Name LIKE '${like}' LIMIT 10`),
        query(`SELECT Id, Name, Phone, BillingCity, BillingState FROM Account WHERE Name LIKE '${like}' LIMIT 10`),
        query(`SELECT Id, FirstName, LastName, Email, Phone, Title, AccountId, Account.Name FROM Contact WHERE FirstName LIKE '${like}' OR LastName LIKE '${like}' OR Email LIKE '${like}' LIMIT 10`),
      ])
      return { contracts, taskOrders, accounts, contacts }
    },

    // ─── Accounts (standard) ───
    getAccounts: () =>
      query(
        `SELECT Id, Name, AccountNumber, Phone, Website, Industry, Type,
                BillingCity, BillingState,
                (SELECT Id FROM Contacts)
         FROM Account ORDER BY Name LIMIT 100`
      ),
    getAccount: (id) =>
      query(
        `SELECT Id, Name, AccountNumber, Phone, Website, Industry, Type,
                BillingStreet, BillingCity, BillingState, BillingPostalCode, BillingCountry,
                Description, CreatedDate, LastModifiedDate
         FROM Account WHERE Id = '${id}' LIMIT 1`
      ).then((rows) => rows[0] || null),
    getAccountContacts: (accountId) =>
      query(
        `SELECT Id, FirstName, LastName, Email, Phone, Title, CreatedDate
         FROM Contact WHERE AccountId = '${accountId}' ORDER BY LastName LIMIT 100`
      ),

    // ─── Contacts (standard) ───
    getContacts: () =>
      query(
        'SELECT Id, FirstName, LastName, Email, Phone, Title, AccountId, Account.Name FROM Contact ORDER BY LastName LIMIT 100'
      ),
    getContact: (id) => getRecord('Contact', id),

    // ─── Contracts (cux_Contract__c) ───
    getContracts: () =>
      query(
        `SELECT Id, Name, cux_Title__c, cux_Status__c, cux_Contract_Type__c,
                cux_Start_Date__c, cux_End_Date__c, cux_Total_Authorized_Amount__c,
                cux_Total_Obligated_Amount__c, cux_Total_Expended_Amount__c,
                cux_Account__c, cux_Account__r.Name, cux_Contract_Manager__r.Name,
                cux_Business_Unit__c, cux_Business_Unit__r.cux_Unit_Name__c,
                cux_Procurement_Method__c, cux_Amendment_Count__c,
                CreatedDate
         FROM cux_Contract__c ORDER BY CreatedDate DESC LIMIT 100`
      ),
    getContract: (id) =>
      query(
        `SELECT Id, Name, cux_Title__c, cux_Status__c, cux_Contract_Type__c,
                cux_Start_Date__c, cux_End_Date__c, cux_Total_Authorized_Amount__c,
                cux_Total_Obligated_Amount__c, cux_Total_Expended_Amount__c,
                cux_Account__c, cux_Account__r.Name, cux_Account__r.Phone, cux_Account__r.Website,
                cux_Contract_Manager__c, cux_Contract_Manager__r.Name, cux_Contract_Manager__r.Email, cux_Contract_Manager__r.SmallPhotoUrl,
                cux_Vendor_Contact__c, cux_Vendor_Contact__r.Name, cux_Vendor_Contact__r.Email, cux_Vendor_Contact__r.Phone, cux_Vendor_Contact__r.PhotoUrl,
                cux_Business_Unit__c, cux_Business_Unit__r.cux_Unit_Name__c,
                cux_Procurement_Method__c, cux_Procurement_Reference__c, cux_Amendment_Count__c,
                cux_Narrative__c, cux_Contract_Classification__c,
                cux_Risk_Level__c, cux_DBE_Goal_Percent__c, cux_DVBE_Goal_Percent__c,
                cux_Is_Locked__c, cux_Final_Perf_Eval_Complete__c, cux_Parent_Contract__c,
                cux_Contracting_Agency__c, cux_Purchasing_Authority_Number__c,
                cux_Contract_Status_Code__c, cux_CMSS_Id__c, cux_Trans_Doc_Number__c,
                cux_Agency_Object_Code__c, cux_District_Or_Region__c, cux_Unit_Number__c,
                cux_Current_Fiscal_Year__c, cux_DGS_Approval_Status__c, cux_DGS_Exemption__c,
                cux_RQM_RQS_Number__c, cux_Project_Classification__c, cux_Division__c,
                cux_EA_Phase__c, cux_Work_Bucket__c, cux_Functional_Area__c,
                cux_Specialty_Workload_Percent__c, cux_Flexible_Workload_Percent__c,
                cux_Date_Posted_On_LAR__c, cux_Retention_Until__c,
                cux_Current_Amendment_Effective_Date__c, cux_Is_HQ__c,
                cux_Current_Amendment__c, cux_Current_Amendment__r.Name,
                CreatedDate, LastModifiedDate
         FROM cux_Contract__c WHERE Id = '${id}' LIMIT 1`
      ).then((rows) => rows[0] || null),
    createContract: (data) => createRecord('cux_Contract__c', data),
    updateContract: (id, data) => updateRecord('cux_Contract__c', id, data),

    // ─── Contract Amendments (cux_ContractAmendment__c) ───
    getAmendments: (contractId) =>
      query(
        `SELECT Id, Name, cux_Amendment_Number__c, cux_Amendment_Type__c,
                cux_Approval_Status__c, cux_Amendment_Date__c, cux_Effective_Date__c,
                cux_New_Authorized_Amount__c, cux_Amount_Change__c,
                cux_Amendment_Narrative__c, cux_Is_Locked__c,
                cux_Approved_By__r.Name, cux_Approved_At__c,
                CreatedDate
         FROM cux_ContractAmendment__c
         WHERE cux_Contract__c = '${contractId}'
         ORDER BY CreatedDate DESC LIMIT 100`
      ),
    getAllAmendments: () =>
      query(
        `SELECT Id, Name, cux_Amendment_Number__c, cux_Amendment_Type__c,
                cux_Approval_Status__c, cux_Amendment_Date__c, cux_Effective_Date__c,
                cux_New_Authorized_Amount__c, cux_New_End_Date__c,
                cux_Amendment_Narrative__c, cux_Other_Description__c, cux_Is_Locked__c,
                cux_Reason__c, cux_Approved_By__r.Name, cux_Approved_At__c,
                cux_Applied_At__c,
                cux_Contract__c, cux_Contract__r.Name, cux_Contract__r.cux_Title__c,
                cux_Contract__r.cux_Status__c,
                cux_Contract__r.cux_End_Date__c, cux_Contract__r.cux_Total_Authorized_Amount__c,
                cux_Contract__r.cux_Narrative__c,
                CreatedDate
         FROM cux_ContractAmendment__c
         ORDER BY CreatedDate DESC LIMIT 100`
      ),
    getAmendment: (amendmentId) =>
      query(
        `SELECT Id, Name, cux_Amendment_Number__c, cux_Amendment_Type__c,
                cux_Approval_Status__c, cux_Amendment_Date__c, cux_Effective_Date__c,
                cux_New_Authorized_Amount__c, cux_New_End_Date__c,
                cux_Amendment_Narrative__c, cux_Other_Description__c, cux_Is_Locked__c,
                cux_Reason__c, cux_Approved_By__r.Name, cux_Approved_At__c,
                cux_Applied_At__c, cux_Amendment_Start_Date__c, cux_Amendment_Title__c,
                cux_Purchasing_Authority_Number__c,
                cux_Contract__c, cux_Contract__r.Name, cux_Contract__r.cux_Title__c,
                cux_Contract__r.cux_Status__c,
                cux_Contract__r.cux_End_Date__c, cux_Contract__r.cux_Total_Authorized_Amount__c,
                cux_Contract__r.cux_Total_Obligated_Amount__c,
                cux_Contract__r.cux_Narrative__c,
                CreatedDate
         FROM cux_ContractAmendment__c
         WHERE Id = '${amendmentId}'
         LIMIT 1`
      ).then((rows) => rows[0] || null),
    createAmendment: (data) => createRecord('cux_ContractAmendment__c', data),
    updateAmendment: (id, data) => updateRecord('cux_ContractAmendment__c', id, data),

    // ─── Terminations (cux_TaskOrderTermination__c) ───
    getAllTerminations: () =>
      query(
        `SELECT Id, Name, cux_Parent_Type__c, cux_Contract__c, cux_Contract__r.Name,
                cux_Task_Order__c, cux_Task_Order__r.Name, cux_Termination_Type__c,
                cux_Termination_Date__c, cux_Status__c, cux_Reason_Code__c,
                cux_Requires_Settlement__c, cux_Settlement__c, cux_Is_Locked__c,
                CreatedDate, LastModifiedDate
         FROM cux_TaskOrderTermination__c
         ORDER BY CreatedDate DESC LIMIT 200`
      ),
    getTermination: (id) =>
      query(
        `SELECT Id, Name, cux_Parent_Type__c, cux_Contract__c, cux_Contract__r.Name,
                cux_Task_Order__c, cux_Task_Order__r.Name, cux_Termination_Type__c,
                cux_Termination_Date__c, cux_Status__c, cux_Reason_Code__c,
                cux_Narrative__c, cux_Requires_Settlement__c, cux_Settlement__c,
                cux_Settlement__r.Name, cux_Is_Locked__c, CreatedDate, LastModifiedDate
         FROM cux_TaskOrderTermination__c
         WHERE Id = '${id}' LIMIT 1`
      ).then((rows) => rows[0] || null),
    getContractTerminations: (contractId) =>
      query(
        `SELECT Id, Name, cux_Termination_Type__c, cux_Termination_Date__c, cux_Status__c,
                cux_Requires_Settlement__c, CreatedDate
         FROM cux_TaskOrderTermination__c
         WHERE cux_Contract__c = '${contractId}'
         ORDER BY CreatedDate DESC LIMIT 100`
      ),
    getTaskOrderTerminations: (taskOrderId) =>
      query(
        `SELECT Id, Name, cux_Termination_Type__c, cux_Termination_Date__c, cux_Status__c,
                cux_Requires_Settlement__c, CreatedDate
         FROM cux_TaskOrderTermination__c
         WHERE cux_Task_Order__c = '${taskOrderId}'
         ORDER BY CreatedDate DESC LIMIT 100`
      ),
    createTermination: (data) => createRecord('cux_TaskOrderTermination__c', data),
    updateTermination: (id, data) => updateRecord('cux_TaskOrderTermination__c', id, data),

    // ─── Settlements (cux_Settlement__c) ───
    getAllSettlements: () =>
      query(
        `SELECT Id, Name, cux_Parent_Type__c, cux_Contract__c, cux_Contract__r.Name,
                cux_Task_Order__c, cux_Task_Order__r.Name, cux_Termination__c,
                cux_Termination__r.Name, cux_Status__c, cux_Authorized_Amount__c,
                cux_Effective_Date__c, cux_Approved_At__c, cux_Executed_At__c,
                cux_Allows_Post_Termination_Invoicing__c, cux_Is_Locked__c,
                CreatedDate, LastModifiedDate
         FROM cux_Settlement__c
         ORDER BY CreatedDate DESC LIMIT 200`
      ),
    getSettlement: (id) =>
      query(
        `SELECT Id, Name, cux_Parent_Type__c, cux_Contract__c, cux_Contract__r.Name,
                cux_Task_Order__c, cux_Task_Order__r.Name, cux_Termination__c,
                cux_Termination__r.Name, cux_Status__c, cux_Authorized_Amount__c,
                cux_Effective_Date__c, cux_Approved_At__c, cux_Executed_At__c,
                cux_Allows_Post_Termination_Invoicing__c,
                cux_Post_Termination_Invoice_Cutoff_Date__c, cux_Is_Locked__c,
                CreatedDate, LastModifiedDate
         FROM cux_Settlement__c
         WHERE Id = '${id}' LIMIT 1`
      ).then((rows) => rows[0] || null),
    getSettlementLineItems: (settlementId) =>
      query(
        `SELECT Id, Name, cux_Settlement__c, cux_Category__c, cux_Amount__c,
                cux_Description__c, CreatedDate
         FROM cux_SettlementLineItem__c
         WHERE cux_Settlement__c = '${settlementId}'
         ORDER BY cux_Category__c LIMIT 200`
      ),
    createSettlement: (data) => createRecord('cux_Settlement__c', data),
    updateSettlement: (id, data) => updateRecord('cux_Settlement__c', id, data),
    createSettlementLineItem: (data) => createRecord('cux_SettlementLineItem__c', data),
    updateSettlementLineItem: (id, data) => updateRecord('cux_SettlementLineItem__c', id, data),
    deleteSettlementLineItem: (id) => deleteRecord('cux_SettlementLineItem__c', id),

    // ─── Contract Documents (cux_ContractDocument__c) ───
    getDocuments: (contractId) =>
      query(
        `SELECT Id, Name, cux_File_Name__c, cux_Document_Type__c,
                cux_Version_Number__c, cux_Is_Official__c, cux_Is_Final__c,
                cux_Is_Locked__c, cux_Effective_Date__c,
                cux_Content_Version_Id__c, cux_Short_Summary__c,
                cux_Uploaded_By__r.Name, cux_Uploaded_At__c,
                CreatedDate
         FROM cux_ContractDocument__c
         WHERE cux_Contract__c = '${contractId}'
         AND (cux_Related_Entity_Type__c = null OR cux_Related_Entity_Type__c = '')
         ORDER BY CreatedDate DESC LIMIT 100`
      ),
    createDocument: (data) => createRecord('cux_ContractDocument__c', data),
    updateDocument: (id, data) => updateRecord('cux_ContractDocument__c', id, data),

    // ─── Entity Documents (cux_ContractDocument__c by related entity) ───
    getEntityDocuments: (entityType, entityId) =>
      query(
        `SELECT Id, Name, cux_File_Name__c, cux_Document_Type__c,
                cux_Version_Number__c, cux_Is_Official__c, cux_Is_Final__c,
                cux_Is_Locked__c, cux_Effective_Date__c,
                cux_Content_Version_Id__c, cux_Short_Summary__c,
                cux_Uploaded_By__r.Name, cux_Uploaded_At__c,
                CreatedDate
         FROM cux_ContractDocument__c
         WHERE cux_Related_Entity_Type__c = '${entityType}'
         AND cux_Related_Entity_Id__c = '${entityId}'
         ORDER BY CreatedDate DESC LIMIT 100`
      ),

    // ─── Contract Events (cux_ContractEvent__c) — read-only audit log ───
    getContractEvents: (contractId) =>
      query(
        `SELECT Id, Name, cux_Event_Type__c, cux_Previous_Status__c, cux_New_Status__c,
                cux_Event_Detail__c, cux_Performed_By__r.Name, cux_Event_Timestamp__c,
                cux_Related_Record_Id__c, cux_Related_Object_Type__c
         FROM cux_ContractEvent__c
         WHERE cux_Contract__c = '${contractId}'
         ORDER BY cux_Event_Timestamp__c DESC LIMIT 100`
      ),
    getEntityEvents: (entityId) =>
      query(
        `SELECT Id, Name, cux_Event_Type__c, cux_Previous_Status__c, cux_New_Status__c,
                cux_Event_Detail__c, cux_Performed_By__r.Name, cux_Event_Timestamp__c,
                cux_Related_Record_Id__c, cux_Related_Object_Type__c
         FROM cux_ContractEvent__c
         WHERE cux_Related_Record_Id__c = '${entityId}'
         ORDER BY cux_Event_Timestamp__c DESC LIMIT 100`
      ),
    createEvent: (data) => createRecord('cux_ContractEvent__c', data),

    // ─── Contract Funding (cux_ContractFunding__c) ───
    getContractFunding: (contractId) =>
      query(
        `SELECT Id, Name, cux_Funding_Code__c, cux_Funding_Code__r.cux_Code__c,
                cux_Funding_Code__r.cux_Fund_Name__c, cux_Funding_Code__r.cux_Fund_Type__c,
                cux_Funding_Source__c, cux_Fiscal_Year__c,
                cux_Allocated_Amount__c, cux_Obligated_Amount__c, cux_Expended_Amount__c,
                cux_Is_Primary__c, cux_Start_Date__c, cux_End_Date__c
         FROM cux_ContractFunding__c
         WHERE cux_Contract__c = '${contractId}'
         ORDER BY cux_Is_Primary__c DESC LIMIT 100`
      ),
    createContractFunding: (data) => createRecord('cux_ContractFunding__c', data),

    // ─── All Funding (cross-contract) ───
    getAllFunding: () =>
      query(
        `SELECT Id, Name, cux_Contract__c, cux_Contract__r.Name,
                cux_Funding_Code__c, cux_Funding_Code__r.cux_Code__c,
                cux_Funding_Code__r.cux_Fund_Type__c,
                cux_Funding_Source__c, cux_Fiscal_Year__c,
                cux_Allocated_Amount__c, cux_Obligated_Amount__c, cux_Expended_Amount__c,
                cux_Is_Primary__c,
                CreatedDate
         FROM cux_ContractFunding__c
         ORDER BY cux_Contract__r.Name, cux_Is_Primary__c DESC LIMIT 200`
      ),

    // ─── Reference Data ───
    getBusinessUnits: () =>
      query(
        'SELECT Id, Name, cux_Code__c, cux_Unit_Name__c, cux_Is_Active__c FROM cux_BusinessUnit__c ORDER BY cux_Code__c LIMIT 100'
      ),
    getFundingCodes: () =>
      query(
        'SELECT Id, Name, cux_Fund_Name__c, cux_Code__c, cux_Fund_Type__c, cux_Appropriation_Year__c, cux_Amount__c, cux_Effective_Start__c, cux_Effective_End__c, cux_Retired_On__c, cux_Masked_Format__c, cux_Is_Active__c FROM cux_FundingCode__c ORDER BY cux_Fund_Name__c LIMIT 100'
      ),
    getFundingCode: (id) =>
      query(
        `SELECT Id, Name, cux_Fund_Name__c, cux_Code__c, cux_Fund_Type__c, cux_Appropriation_Year__c, cux_Amount__c, cux_Effective_Start__c, cux_Effective_End__c, cux_Retired_On__c, cux_Masked_Format__c, cux_Is_Active__c, CreatedDate, LastModifiedDate FROM cux_FundingCode__c WHERE Id = '${id}' LIMIT 1`
      ).then((rows) => rows[0] || null),
    getFundAllocations: (fundId) =>
      query(
        `SELECT Id, Name, cux_Contract__c, cux_Contract__r.Name, cux_Contract__r.cux_Title__c, cux_Fiscal_Year__c, cux_Allocated_Amount__c, cux_Obligated_Amount__c, cux_Expended_Amount__c, cux_Is_Primary__c, cux_Funding_Source__c FROM cux_ContractFunding__c WHERE cux_Funding_Code__c = '${fundId}' ORDER BY cux_Fiscal_Year__c, cux_Contract__r.Name LIMIT 200`
      ),
    getFundAllocationTotals: () =>
      query(
        'SELECT cux_Funding_Code__c fundId, SUM(cux_Allocated_Amount__c) totalAllocated FROM cux_ContractFunding__c GROUP BY cux_Funding_Code__c LIMIT 200'
      ),
    createFundingCode: (data) => createRecord('cux_FundingCode__c', data),
    updateFundingCode: (id, data) => updateRecord('cux_FundingCode__c', id, data),
    getAmendmentReasons: () =>
      query(
        'SELECT Id, Name, cux_Code__c, cux_Reason_Name__c, cux_Is_Active__c, cux_Sort_Order__c FROM cux_AmendmentReason__c ORDER BY cux_Sort_Order__c LIMIT 100'
      ),

    // ─── Task Orders (cux_TaskOrder__c) ───
    getTaskOrders: () =>
      query(
        `SELECT Id, Name, cux_Contract__c, cux_Contract__r.Name, cux_Contract__r.cux_Title__c,
                cux_Task_Order_Type__c, cux_Status__c, cux_Start_Date__c, cux_End_Date__c,
                cux_Authorized_Amount__c, cux_Max_Authorized_Hours__c,
                cux_Total_Invoiced_Amount__c, cux_Is_Locked__c,
                cux_Assigned_To__c, cux_Assigned_To__r.Name,
                CreatedDate
         FROM cux_TaskOrder__c ORDER BY CreatedDate DESC LIMIT 100`
      ),
    getContractTaskOrders: (contractId) =>
      query(
        `SELECT Id, Name, cux_Task_Order_Type__c, cux_Status__c,
                cux_Start_Date__c, cux_End_Date__c,
                cux_Authorized_Amount__c, cux_Max_Authorized_Hours__c,
                cux_Total_Invoiced_Amount__c,
                cux_Assigned_To__r.Name,
                CreatedDate
         FROM cux_TaskOrder__c
         WHERE cux_Contract__c = '${contractId}'
         ORDER BY CreatedDate DESC LIMIT 100`
      ),
    getTaskOrder: (id) =>
      query(
        `SELECT Id, Name, cux_Contract__c,
                cux_Contract__r.Name, cux_Contract__r.cux_Title__c,
                cux_Contract__r.cux_Status__c, cux_Contract__r.cux_Contract_Type__c,
                cux_Contract__r.cux_Start_Date__c, cux_Contract__r.cux_End_Date__c,
                cux_Contract__r.cux_Total_Authorized_Amount__c,
                cux_Contract__r.cux_Total_Obligated_Amount__c,
                cux_Contract__r.cux_Account__c,
                cux_Contract__r.cux_Account__r.Name, cux_Contract__r.cux_Account__r.Phone,
                cux_Contract__r.cux_Account__r.Website, cux_Contract__r.cux_Account__r.BillingCity,
                cux_Contract__r.cux_Account__r.BillingState,
                cux_Contract__r.cux_Vendor_Contact__r.Name, cux_Contract__r.cux_Vendor_Contact__r.Email,
                cux_Contract__r.cux_Vendor_Contact__r.Phone, cux_Contract__r.cux_Vendor_Contact__r.Title,
                cux_Contract__r.cux_Contract_Manager__r.Name, cux_Contract__r.cux_Contract_Manager__r.Email,
                cux_Contract__r.cux_Contract_Manager__r.SmallPhotoUrl,
                cux_Task_Order_Type__c, cux_Status__c, cux_Start_Date__c, cux_End_Date__c,
                cux_Authorized_Amount__c, cux_Max_Authorized_Hours__c,
                cux_Total_Invoiced_Amount__c, cux_Is_Locked__c,
                cux_Scope_Summary__c, cux_Activated_At__c,
                cux_Current_Supplement_Number__c, cux_Current_Supplement_Reason__c,
                cux_Assigned_To__c, cux_Assigned_To__r.Name, cux_Assigned_To__r.Email,
                CreatedDate, LastModifiedDate
         FROM cux_TaskOrder__c WHERE Id = '${id}' LIMIT 1`
      ).then((rows) => rows[0] || null),
    getTaskOrderInvoices: (taskOrderId) =>
      query(
        `SELECT Id, Name, cux_Status__c, cux_Amount__c, cux_Category__c,
                cux_Invoice_Date__c, cux_Service_Period_Start__c, cux_Service_Period_End__c,
                cux_External_Invoice_Number__c, CreatedDate
         FROM cux_Invoice__c
         WHERE cux_Task_Order__c = '${taskOrderId}'
         ORDER BY CreatedDate DESC LIMIT 100`
      ),
    getTaskOrderTimesheets: (taskOrderId) =>
      query(
        `SELECT Id, Name, cux_Status__c, cux_Worker_Name__c, cux_Work_Date__c,
                cux_Hours__c, cux_Hourly_Rate__c, cux_Total_Amount__c,
                cux_Category__c, CreatedDate
         FROM cux_Timesheet__c
         WHERE cux_Task_Order__c = '${taskOrderId}'
         ORDER BY cux_Work_Date__c DESC LIMIT 100`
      ),
    createTaskOrder: (data) => createRecord('cux_TaskOrder__c', data),
    updateTaskOrder: (id, data) => updateRecord('cux_TaskOrder__c', id, data),

    // ─── Task Order Supplements (cux_TaskOrderSupplement__c) ───
    getSupplements: (taskOrderId) =>
      query(
        `SELECT Id, Name, cux_Supplement_Number__c, cux_Supplement_Reason__c, cux_Status__c,
                cux_Full_Obligation_Amount__c, cux_Full_Scope__c,
                cux_Start_Date__c, cux_End_Date__c, cux_Task_Order_Type__c,
                cux_Version_Type__c, cux_Is_Effective__c, cux_Is_Locked__c,
                cux_Applied_At__c, CreatedDate
         FROM cux_TaskOrderSupplement__c
         WHERE cux_Task_Order__c = '${taskOrderId}'
         ORDER BY CreatedDate DESC LIMIT 100`
      ),
    getSupplement: (supplementId) =>
      query(
        `SELECT Id, Name, cux_Supplement_Number__c, cux_Supplement_Reason__c, cux_Status__c,
                cux_Full_Obligation_Amount__c, cux_Full_Scope__c,
                cux_Start_Date__c, cux_End_Date__c, cux_Task_Order_Type__c,
                cux_Version_Type__c, cux_Is_Effective__c, cux_Is_Locked__c,
                cux_Applied_At__c, cux_Supersedes_Supplement_Id__c, CreatedDate,
                cux_Task_Order__c, cux_Task_Order__r.Name,
                cux_Task_Order__r.cux_Task_Order_Type__c, cux_Task_Order__r.cux_Status__c,
                cux_Task_Order__r.cux_Start_Date__c, cux_Task_Order__r.cux_End_Date__c,
                cux_Task_Order__r.cux_Authorized_Amount__c, cux_Task_Order__r.cux_Scope_Summary__c,
                cux_Task_Order__r.cux_Contract__c, cux_Task_Order__r.cux_Contract__r.Name,
                cux_Task_Order__r.cux_Contract__r.cux_Total_Authorized_Amount__c,
                cux_Task_Order__r.cux_Contract__r.cux_Total_Obligated_Amount__c,
                cux_Task_Order__r.cux_Contract__r.cux_End_Date__c
         FROM cux_TaskOrderSupplement__c
         WHERE Id = '${supplementId}'
         LIMIT 1`
      ).then((rows) => rows[0] || null),
    createSupplement: (data) => createRecord('cux_TaskOrderSupplement__c', data),
    updateSupplement: (id, data) => updateRecord('cux_TaskOrderSupplement__c', id, data),

    // ─── Invoices (cux_Invoice__c) ───
    getContractInvoices: (contractId) =>
      query(
        `SELECT Id, Name, cux_Status__c, cux_Amount__c,
                cux_Service_Period_Start__c, cux_Service_Period_End__c,
                cux_Task_Order__c, cux_Task_Order__r.Name
         FROM cux_Invoice__c
         WHERE cux_Contract__c = '${contractId}'
         ORDER BY cux_Service_Period_Start__c ASC LIMIT 100`
      ),
    getInvoices: () =>
      query(
        `SELECT Id, Name, cux_Status__c, cux_Amount__c, cux_Category__c,
                cux_Invoice_Date__c, cux_Service_Period_Start__c, cux_Service_Period_End__c,
                cux_Task_Order__c, cux_Task_Order__r.Name,
                cux_Contract__c, cux_Contract__r.Name,
                cux_External_Invoice_Number__c, cux_Total_Hours__c, cux_Is_Locked__c,
                cux_Assigned_To__c, cux_Assigned_To__r.Name,
                CreatedDate
         FROM cux_Invoice__c ORDER BY CreatedDate DESC LIMIT 100`
      ),
    getInvoice: (id) =>
      query(
        `SELECT Id, Name, cux_Status__c, cux_Amount__c, cux_Category__c,
                cux_Invoice_Date__c, cux_Service_Period_Start__c, cux_Service_Period_End__c,
                cux_External_Invoice_Number__c, cux_Total_Hours__c, cux_Description__c,
                cux_Received_Date__c,
                cux_Out_to_Account_Date__c, cux_Payment_Schedule_Date__c,
                cux_Schedule_Number__c, cux_Paid_Amount__c,
                cux_Submitted_At__c, cux_Approved_At__c, cux_Approved_By__r.Name,
                cux_Paid_At__c, cux_Rejection_Reason__c, cux_Is_Locked__c,
                cux_Task_Order__c, cux_Task_Order__r.Name,
                cux_Task_Order__r.cux_Task_Order_Type__c, cux_Task_Order__r.cux_Status__c,
                cux_Task_Order__r.cux_Start_Date__c, cux_Task_Order__r.cux_End_Date__c,
                cux_Task_Order__r.cux_Authorized_Amount__c,
                cux_Task_Order__r.cux_Total_Invoiced_Amount__c,
                cux_Contract__c, cux_Contract__r.Name, cux_Contract__r.cux_Title__c,
                cux_Contract__r.cux_Status__c, cux_Contract__r.cux_Contract_Type__c,
                cux_Contract__r.cux_Start_Date__c, cux_Contract__r.cux_End_Date__c,
                cux_Contract__r.cux_Total_Authorized_Amount__c,
                cux_Contract__r.cux_Account__c,
                cux_Contract__r.cux_Account__r.Name, cux_Contract__r.cux_Account__r.Phone,
                cux_Contract__r.cux_Account__r.Website,
                cux_Contract__r.cux_Account__r.BillingCity, cux_Contract__r.cux_Account__r.BillingState,
                cux_Contract__r.cux_Vendor_Contact__r.Name, cux_Contract__r.cux_Vendor_Contact__r.Email,
                cux_Contract__r.cux_Vendor_Contact__r.Phone, cux_Contract__r.cux_Vendor_Contact__r.Title,
                cux_Contract__r.cux_Contract_Manager__r.Name,
                cux_Contract__r.cux_Contract_Manager__r.Email,
                cux_Contract__r.cux_Contract_Manager__r.SmallPhotoUrl,
                cux_Assigned_To__c, cux_Assigned_To__r.Name,
                CreatedDate, LastModifiedDate
         FROM cux_Invoice__c WHERE Id = '${id}' LIMIT 1`
      ).then((rows) => rows[0] || null),
    getAccountInvoices: (accountId) =>
      query(
        `SELECT Id, Name, cux_Status__c, cux_Amount__c, cux_Invoice_Date__c,
                cux_Contract__c, cux_Contract__r.Name,
                cux_Task_Order__c, cux_Task_Order__r.Name,
                cux_Paid_At__c, CreatedDate
         FROM cux_Invoice__c
         WHERE cux_Contract__r.cux_Account__c = '${accountId}'
         ORDER BY CreatedDate DESC LIMIT 100`
      ),
    createInvoice: (data) => createRecord('cux_Invoice__c', data),
    updateInvoice: (id, data) => updateRecord('cux_Invoice__c', id, data),

    // ─── Invoice Attachments (ContentDocumentLink → cux_Invoice__c) ───
    getInvoiceAttachments: (invoiceId) =>
      query(
        `SELECT ContentDocumentId, ContentDocument.Title, ContentDocument.FileExtension,
                ContentDocument.ContentSize, ContentDocument.CreatedDate,
                ContentDocument.LatestPublishedVersionId
         FROM ContentDocumentLink
         WHERE LinkedEntityId = '${invoiceId}'
         ORDER BY ContentDocument.CreatedDate DESC LIMIT 50`
      ),
    uploadInvoiceAttachment: async (invoiceId, file) => {
      const cv = await uploadContentVersion(file)
      const contentDocId = await getContentDocumentId(cv.id)
      await createRecord('ContentDocumentLink', {
        ContentDocumentId: contentDocId,
        LinkedEntityId: invoiceId,
        ShareType: 'V',
      })
      return { contentVersionId: cv.id, contentDocumentId: contentDocId }
    },

    // ─── Cases (cux_Case__c) ───
    getCases: () =>
      query(
        `SELECT Id, Name, cux_Subject__c, cux_Status__c, cux_Priority__c, cux_Category__c,
                cux_Account__c, cux_Account__r.Name,
                cux_Contact__c, cux_Contact__r.Name,
                cux_Contract__c, cux_Contract__r.Name,
                cux_Assigned_To__c, cux_Assigned_To__r.Name,
                CreatedDate
         FROM cux_Case__c ORDER BY CreatedDate DESC LIMIT 100`
      ),
    getCase: (id) =>
      query(
        `SELECT Id, Name, cux_Subject__c, cux_Status__c, cux_Priority__c, cux_Category__c,
                cux_Account__c, cux_Account__r.Name,
                cux_Contact__c, cux_Contact__r.Name,
                cux_Contract__c, cux_Contract__r.Name,
                cux_Description__c, cux_Resolution__c,
                cux_Resolved_At__c, cux_Closed_At__c,
                cux_Assigned_To__c, cux_Assigned_To__r.Name,
                CreatedDate, LastModifiedDate
         FROM cux_Case__c WHERE Id = '${id}' LIMIT 1`
      ).then((rows) => rows[0] || null),
    createCase: (data) => createRecord('cux_Case__c', data),
    updateCase: (id, data) => updateRecord('cux_Case__c', id, data),

    // ─── Timesheets (cux_Timesheet__c) ───
    getTimesheets: () =>
      query(
        `SELECT Id, Name, cux_Status__c, cux_Worker_Name__c, cux_Work_Date__c,
                cux_Hours__c, cux_Hourly_Rate__c, cux_Total_Amount__c, cux_Category__c,
                cux_Task_Order__c, cux_Task_Order__r.Name,
                cux_Contract__c, cux_Contract__r.Name,
                cux_Invoice__c, cux_Invoice__r.Name,
                CreatedDate
         FROM cux_Timesheet__c ORDER BY cux_Work_Date__c DESC LIMIT 100`
      ),
    getTimesheet: (id) =>
      query(
        `SELECT Id, Name, cux_Status__c, cux_Worker_Name__c, cux_Work_Date__c,
                cux_Hours__c, cux_Hourly_Rate__c, cux_Total_Amount__c, cux_Category__c,
                cux_Task_Order__c, cux_Task_Order__r.Name,
                cux_Contract__c, cux_Contract__r.Name,
                cux_Invoice__c, cux_Invoice__r.Name,
                cux_Description__c,
                CreatedDate, LastModifiedDate
         FROM cux_Timesheet__c WHERE Id = '${id}' LIMIT 1`
      ).then((rows) => rows[0] || null),
    createTimesheet: (data) => createRecord('cux_Timesheet__c', data),
    updateTimesheet: (id, data) => updateRecord('cux_Timesheet__c', id, data),

    // ─── Work Tasks (cux_WorkTask__c) — My Day / Work Queue / Team Monitor ───
    getMyWorkTasks: (userId) =>
      query(
        `SELECT Id, Name, cux_Title__c, cux_Status__c, cux_Priority__c,
                cux_Due_Date__c, cux_Entity_Type__c, cux_Entity_Id__c,
                cux_Assigned_Role__c, cux_Is_Blocked__c, cux_Is_Required__c,
                cux_Contract__c, cux_Contract__r.Name,
                cux_Task_Order__c, cux_Task_Order__r.Name,
                cux_Description__c, CreatedDate
         FROM cux_WorkTask__c
         WHERE cux_Assigned_To__c = '${userId}'
           AND cux_Status__c NOT IN ('Complete','Cancelled','Not Applicable')
         ORDER BY cux_Due_Date__c ASC NULLS LAST
         LIMIT 100`
      ),
    getMyAllWorkTasks: (userId) =>
      query(
        `SELECT Id, Name, cux_Title__c, cux_Status__c, cux_Priority__c,
                cux_Due_Date__c, cux_Entity_Type__c, cux_Entity_Id__c,
                cux_Assigned_Role__c, cux_Is_Blocked__c,
                cux_Contract__c, cux_Contract__r.Name,
                cux_Task_Order__c, cux_Task_Order__r.Name,
                cux_Completed_At__c, cux_Completed_By__r.Name,
                CreatedDate
         FROM cux_WorkTask__c
         WHERE cux_Assigned_To__c = '${userId}'
         ORDER BY CreatedDate DESC
         LIMIT 100`
      ),
    getMyCompletedToday: (userId) =>
      query(
        `SELECT Id, Name, cux_Title__c, cux_Completed_At__c,
                cux_Entity_Type__c, cux_Entity_Id__c
         FROM cux_WorkTask__c
         WHERE cux_Completed_By__c = '${userId}'
           AND cux_Completed_At__c = TODAY
         LIMIT 50`
      ),
    getTeamWorkload: () =>
      query(
        `SELECT cux_Assigned_To__c, cux_Assigned_To__r.Name, COUNT(Id) cnt
         FROM cux_WorkTask__c
         WHERE cux_Assigned_To__c != null
           AND cux_Status__c NOT IN ('Complete','Cancelled','Not Applicable')
         GROUP BY cux_Assigned_To__c, cux_Assigned_To__r.Name
         LIMIT 100`
      ),
    getTeamCompletedTasks: () =>
      query(
        `SELECT cux_Completed_By__c, cux_Completed_By__r.Name, COUNT(Id) cnt
         FROM cux_WorkTask__c
         WHERE cux_Status__c = 'Complete'
           AND cux_Completed_At__c >= LAST_N_DAYS:30
         GROUP BY cux_Completed_By__c, cux_Completed_By__r.Name
         LIMIT 100`
      ),
    getTeamOverdueTasks: () =>
      query(
        `SELECT cux_Assigned_To__c, cux_Assigned_To__r.Name, COUNT(Id) cnt
         FROM cux_WorkTask__c
         WHERE cux_Due_Date__c < TODAY
           AND cux_Status__c NOT IN ('Complete','Cancelled','Not Applicable')
           AND cux_Assigned_To__c != null
         GROUP BY cux_Assigned_To__c, cux_Assigned_To__r.Name
         LIMIT 100`
      ),
    getAllOpenWorkTasks: () =>
      query(
        `SELECT Id, Name, cux_Title__c, cux_Status__c, cux_Priority__c,
                cux_Due_Date__c, cux_Entity_Type__c, cux_Entity_Id__c,
                cux_Assigned_To__c, cux_Assigned_To__r.Name, cux_Assigned_To__r.SmallPhotoUrl,
                cux_Assigned_Role__c, cux_Is_Blocked__c,
                cux_Contract__c, cux_Contract__r.Name,
                cux_Task_Order__c, cux_Task_Order__r.Name,
                CreatedDate
         FROM cux_WorkTask__c
         WHERE cux_Status__c NOT IN ('Complete','Cancelled','Not Applicable')
         ORDER BY cux_Due_Date__c ASC NULLS LAST
         LIMIT 100`
      ),
    getActiveUsers: () =>
      query(
        `SELECT Id, Name, Email, SmallPhotoUrl
         FROM User
         WHERE IsActive = true AND UserType = 'Standard'
         ORDER BY Name
         LIMIT 100`
      ),
    createWorkTask: (data) => createRecord('cux_WorkTask__c', data),
    updateWorkTask: (id, data) => updateRecord('cux_WorkTask__c', id, data),
    completeWorkTask: (id, userId) =>
      updateRecord('cux_WorkTask__c', id, {
        cux_Status__c: 'Complete',
        cux_Assigned_To__c: userId,
        cux_Completed_By__c: userId,
        cux_Completed_At__c: new Date().toISOString(),
      }),

    // ─── My Day Composite Query ───
    getMyDayData: async (userId) => {
      const [tasks, completedToday, myInvoices, myContracts, myCases, myValidations] = await Promise.all([
        query(
          `SELECT Id, Name, cux_Title__c, cux_Status__c, cux_Priority__c,
                  cux_Due_Date__c, cux_Entity_Type__c, cux_Entity_Id__c,
                  cux_Assigned_Role__c, cux_Is_Blocked__c, cux_Is_Required__c,
                  cux_Contract__c, cux_Contract__r.Name,
                  cux_Task_Order__c, cux_Task_Order__r.Name,
                  cux_Description__c, CreatedDate
           FROM cux_WorkTask__c
           WHERE cux_Assigned_To__c = '${userId}'
             AND cux_Status__c NOT IN ('Complete','Cancelled','Not Applicable')
           ORDER BY cux_Due_Date__c ASC NULLS LAST
           LIMIT 100`
        ),
        query(
          `SELECT Id, Name, cux_Title__c, cux_Completed_At__c,
                  cux_Entity_Type__c, cux_Entity_Id__c
           FROM cux_WorkTask__c
           WHERE cux_Completed_By__c = '${userId}'
             AND cux_Completed_At__c = TODAY
           LIMIT 50`
        ),
        query(
          `SELECT Id, Name, cux_Status__c, cux_Amount__c,
                  cux_Payment_Schedule_Date__c, cux_Invoice_Date__c,
                  cux_Task_Order__c, cux_Task_Order__r.Name,
                  cux_Contract__c, cux_Contract__r.Name
           FROM cux_Invoice__c
           WHERE cux_Assigned_To__c = '${userId}'
             AND cux_Status__c NOT IN ('Paid','Void')
           ORDER BY cux_Payment_Schedule_Date__c ASC NULLS LAST
           LIMIT 8`
        ),
        query(
          `SELECT Id, Name, cux_Title__c, cux_Status__c,
                  cux_Total_Authorized_Amount__c, cux_Total_Expended_Amount__c,
                  cux_End_Date__c, cux_Account__r.Name
           FROM cux_Contract__c
           WHERE cux_Contract_Manager__c = '${userId}'
             AND cux_Status__c = 'Active'
           ORDER BY cux_End_Date__c ASC NULLS LAST
           LIMIT 5`
        ),
        query(
          `SELECT Id, Name, cux_Subject__c, cux_Status__c, cux_Priority__c,
                  cux_Account__r.Name, CreatedDate
           FROM cux_Case__c
           WHERE cux_Assigned_To__c = '${userId}'
             AND cux_Status__c NOT IN ('Closed','Resolved')
           ORDER BY CreatedDate DESC
           LIMIT 5`
        ),
        query(
          `SELECT Id, Name, cux_Target_Type__c, cux_Status__c,
                  cux_Validation_Profile__r.cux_Profile_Name__c,
                  cux_Requested_At__c, CreatedDate
           FROM cux_ValidationRequest__c
           WHERE cux_Requested_By__c = '${userId}'
             AND cux_Status__c IN ('Pending','In Progress')
           ORDER BY CreatedDate DESC
           LIMIT 5`
        ),
      ])
      return { tasks, completedToday, myInvoices, myContracts, myCases, myValidations }
    },

    // ─── Validation Profiles (cux_ValidationProfile__c) ───
    getValidationProfiles: () =>
      query(
        `SELECT Id, Name, cux_Profile_Name__c, cux_Target_Entity_Type__c,
                cux_Version__c, cux_Is_Active__c, cux_Stage__c,
                cux_Effective_Start__c, cux_Effective_End__c,
                cux_Baseline_Task_Set__c, cux_Baseline_Task_Set__r.Name,
                cux_Baseline_Task_Set__r.cux_Set_Name__c,
                cux_Rule_Set__c, cux_Rule_Set__r.Name,
                cux_Rule_Set__r.cux_Rule_Set_Name__c,
                cux_Ai_Validator_Set_Id__c,
                CreatedDate, LastModifiedDate
         FROM cux_ValidationProfile__c
         ORDER BY cux_Target_Entity_Type__c, cux_Profile_Name__c
         LIMIT 100`
      ),
    getValidationProfile: (id) =>
      query(
        `SELECT Id, Name, cux_Profile_Name__c, cux_Target_Entity_Type__c,
                cux_Version__c, cux_Is_Active__c, cux_Stage__c,
                cux_Effective_Start__c, cux_Effective_End__c,
                cux_Baseline_Task_Set__c, cux_Baseline_Task_Set__r.Name,
                cux_Baseline_Task_Set__r.cux_Set_Name__c,
                cux_Rule_Set__c, cux_Rule_Set__r.Name,
                cux_Rule_Set__r.cux_Rule_Set_Name__c,
                cux_Ai_Validator_Set_Id__c,
                CreatedDate, LastModifiedDate
         FROM cux_ValidationProfile__c WHERE Id = '${id}' LIMIT 1`
      ).then((rows) => rows[0] || null),
    createValidationProfile: (data) => createRecord('cux_ValidationProfile__c', data),
    updateValidationProfile: (id, data) => updateRecord('cux_ValidationProfile__c', id, data),

    // ─── Baseline Task Sets (cux_BaselineTaskSet__c) ───
    getBaselineTaskSets: () =>
      query(
        `SELECT Id, Name, cux_Set_Name__c, cux_Description__c,
                cux_Is_Active__c, cux_Effective_Start__c, cux_Effective_End__c,
                CreatedDate, LastModifiedDate
         FROM cux_BaselineTaskSet__c
         ORDER BY cux_Set_Name__c
         LIMIT 100`
      ),
    getBaselineTaskSet: (id) =>
      query(
        `SELECT Id, Name, cux_Set_Name__c, cux_Description__c,
                cux_Is_Active__c, cux_Effective_Start__c, cux_Effective_End__c,
                CreatedDate, LastModifiedDate
         FROM cux_BaselineTaskSet__c WHERE Id = '${id}' LIMIT 1`
      ).then((rows) => rows[0] || null),
    createBaselineTaskSet: (data) => createRecord('cux_BaselineTaskSet__c', data),
    updateBaselineTaskSet: (id, data) => updateRecord('cux_BaselineTaskSet__c', id, data),

    // ─── Baseline Task Templates (cux_BaselineTaskTemplate__c) ───
    getBaselineTaskTemplates: (taskSetId) =>
      query(
        `SELECT Id, Name, cux_Task_Code__c, cux_Title__c, cux_Description__c,
                cux_Default_Assignee_Role__c, cux_Required__c,
                cux_Severity_If_Incomplete__c, cux_Sort_Order__c,
                cux_Baseline_Task_Set__c
         FROM cux_BaselineTaskTemplate__c
         WHERE cux_Baseline_Task_Set__c = '${taskSetId}'
         ORDER BY cux_Sort_Order__c ASC NULLS LAST
         LIMIT 100`
      ),
    createBaselineTaskTemplate: (data) => createRecord('cux_BaselineTaskTemplate__c', data),
    updateBaselineTaskTemplate: (id, data) => updateRecord('cux_BaselineTaskTemplate__c', id, data),
    deleteBaselineTaskTemplate: (id) => deleteRecord('cux_BaselineTaskTemplate__c', id),

    // ─── Rule Sets (cux_RuleSet__c) ───
    getRuleSets: () =>
      query(
        `SELECT Id, Name, cux_Rule_Set_Name__c, cux_Target_Entity_Type__c,
                cux_Version__c, cux_Is_Active__c,
                cux_Effective_Start__c, cux_Effective_End__c,
                cux_Description__c,
                CreatedDate, LastModifiedDate
         FROM cux_RuleSet__c
         ORDER BY cux_Target_Entity_Type__c, cux_Rule_Set_Name__c
         LIMIT 100`
      ),
    getRuleSet: (id) =>
      query(
        `SELECT Id, Name, cux_Rule_Set_Name__c, cux_Target_Entity_Type__c,
                cux_Version__c, cux_Is_Active__c,
                cux_Effective_Start__c, cux_Effective_End__c,
                cux_Description__c,
                CreatedDate, LastModifiedDate
         FROM cux_RuleSet__c WHERE Id = '${id}' LIMIT 1`
      ).then((rows) => rows[0] || null),
    createRuleSet: (data) => createRecord('cux_RuleSet__c', data),
    updateRuleSet: (id, data) => updateRecord('cux_RuleSet__c', id, data),

    // ─── Validation Rules (cux_ValidationRule__c) ───
    getValidationRules: (ruleSetId) =>
      query(
        `SELECT Id, Name, cux_Rule_Code__c, cux_Title__c, cux_Description__c,
                cux_Rule_Type__c, cux_Severity__c, cux_Blocking__c,
                cux_Execution_Default_Mode__c, cux_Expression__c,
                cux_Handler_Key__c, cux_Sort_Order__c,
                cux_Is_Active__c, cux_Effective_Start__c, cux_Effective_End__c,
                cux_Rule_Set__c
         FROM cux_ValidationRule__c
         WHERE cux_Rule_Set__c = '${ruleSetId}'
         ORDER BY cux_Sort_Order__c ASC NULLS LAST
         LIMIT 100`
      ),
    createValidationRule: (data) => createRecord('cux_ValidationRule__c', data),
    updateValidationRule: (id, data) => updateRecord('cux_ValidationRule__c', id, data),
    deleteValidationRule: (id) => deleteRecord('cux_ValidationRule__c', id),

    // ─── Validation Requests (cux_ValidationRequest__c) ───
    getValidationRequests: (targetType, targetId) => {
      let where = ''
      if (targetType && targetId) {
        where = `WHERE cux_Target_Type__c = '${targetType}' AND cux_Target_Id__c = '${targetId}'`
      } else if (targetType) {
        where = `WHERE cux_Target_Type__c = '${targetType}'`
      }
      return query(
        `SELECT Id, Name, cux_Target_Type__c, cux_Target_Id__c,
                cux_Status__c, cux_Outcome__c, cux_Stage__c,
                cux_Requested_By__c, cux_Requested_At__c,
                cux_Completed_At__c, cux_Idempotency_Key__c,
                cux_Profile_Version__c, cux_Rule_Set_Version__c,
                cux_Validation_Profile__c, cux_Validation_Profile__r.Name,
                cux_Validation_Profile__r.cux_Profile_Name__c,
                cux_Validator_Definition__c, cux_Validator_Definition__r.Name,
                CreatedDate
         FROM cux_ValidationRequest__c
         ${where}
         ORDER BY CreatedDate DESC
         LIMIT 100`
      )
    },
    getValidationRequest: (id) =>
      query(
        `SELECT Id, Name, cux_Target_Type__c, cux_Target_Id__c,
                cux_Status__c, cux_Outcome__c, cux_Stage__c,
                cux_Requested_By__c, cux_Requested_At__c,
                cux_Completed_At__c, cux_Idempotency_Key__c,
                cux_Profile_Version__c, cux_Rule_Set_Version__c,
                cux_Validation_Profile__c, cux_Validation_Profile__r.Name,
                cux_Validation_Profile__r.cux_Profile_Name__c,
                cux_Validator_Definition__c, cux_Validator_Definition__r.Name,
                cux_Correlation_Id__c,
                CreatedDate
         FROM cux_ValidationRequest__c WHERE Id = '${id}' LIMIT 1`
      ).then((rows) => rows[0] || null),
    createValidationRequest: (data) => createRecord('cux_ValidationRequest__c', data),
    updateValidationRequest: (id, data) => updateRecord('cux_ValidationRequest__c', id, data),

    // ─── Validation Results (cux_ValidationResult__c) ───
    getValidationResults: (requestId) =>
      query(
        `SELECT Id, Name, cux_Result_Type__c, cux_Outcome__c, cux_Severity__c,
                cux_Message__c, cux_Evidence_Ref__c,
                cux_Execution_Mode__c, cux_Executed_By_Actor_Id__c,
                cux_Execution_Engine__c, cux_Execution_Run_Id__c,
                cux_Rule_Id__c,
                cux_Baseline_Task_Template__c, cux_Baseline_Task_Template__r.Name,
                cux_Baseline_Task_Template__r.cux_Task_Code__c,
                cux_Result_Status__c, cux_Result_Summary__c,
                cux_Completed_At__c, CreatedDate
         FROM cux_ValidationResult__c
         WHERE cux_Validation_Request__c = '${requestId}'
         ORDER BY CreatedDate ASC
         LIMIT 100`
      ),
    createValidationResult: (data) => createRecord('cux_ValidationResult__c', data),
    updateValidationResult: (id, data) => updateRecord('cux_ValidationResult__c', id, data),

    // ─── Dashboard Analytics ───
    getDashboardStats: async () => {
      const [contracts, taskOrders, invoicesByStatus, invoicesByCategory, recentContracts, amendments, recentInvoices, taskOrdersByContract] = await Promise.all([
        query(
          `SELECT cux_Status__c, COUNT(Id) cnt, SUM(cux_Total_Authorized_Amount__c) totalAuth,
                  SUM(cux_Total_Obligated_Amount__c) totalObl, SUM(cux_Total_Expended_Amount__c) totalExp
           FROM cux_Contract__c GROUP BY cux_Status__c`
        ),
        query(
          `SELECT cux_Status__c, COUNT(Id) cnt, SUM(cux_Authorized_Amount__c) totalAuth,
                  SUM(cux_Total_Invoiced_Amount__c) totalInv
           FROM cux_TaskOrder__c GROUP BY cux_Status__c`
        ),
        query(
          `SELECT cux_Status__c, COUNT(Id) cnt, SUM(cux_Amount__c) totalAmt
           FROM cux_Invoice__c GROUP BY cux_Status__c`
        ),
        query(
          `SELECT cux_Category__c, SUM(cux_Amount__c) totalAmt
           FROM cux_Invoice__c WHERE cux_Status__c IN ('Approval','Paid')
           GROUP BY cux_Category__c`
        ),
        query(
          `SELECT Id, Name, cux_Title__c, cux_Status__c, cux_Total_Authorized_Amount__c,
                  cux_Total_Expended_Amount__c, cux_Account__r.Name, cux_End_Date__c
           FROM cux_Contract__c WHERE cux_Status__c = 'Active'
           ORDER BY cux_End_Date__c ASC LIMIT 5`
        ),
        query(
          `SELECT cux_Approval_Status__c, COUNT(Id) cnt
           FROM cux_ContractAmendment__c GROUP BY cux_Approval_Status__c`
        ),
        query(
          `SELECT Id, Name, cux_Amount__c, cux_Status__c, cux_Category__c,
                  cux_Task_Order__r.Name, cux_Invoice_Date__c
           FROM cux_Invoice__c ORDER BY cux_Invoice_Date__c DESC LIMIT 8`
        ),
        query(
          `SELECT Id, Name, cux_Authorized_Amount__c, cux_Total_Invoiced_Amount__c,
                  cux_Contract__r.Name
           FROM cux_TaskOrder__c WHERE cux_Status__c = 'Active'
           ORDER BY cux_Authorized_Amount__c DESC LIMIT 10`
        ),
      ])
      return { contracts, taskOrders, invoicesByStatus, invoicesByCategory, recentContracts, amendments, recentInvoices, taskOrdersByContract }
    },

    // ─── Notifications ───
    getNotifications: (userId) =>
      query(
        `SELECT Id, Name, cux_Title__c, cux_Message__c, cux_Type__c,
                cux_Is_Read__c, cux_Link__c, cux_Category__c, CreatedDate
         FROM cux_Notification__c
         WHERE cux_User__c = '${userId}'
         ORDER BY CreatedDate DESC
         LIMIT 50`
      ),

    getUnreadNotificationCount: (userId) =>
      client.get('/query', {
        params: {
          q: `SELECT COUNT() FROM cux_Notification__c WHERE cux_User__c = '${userId}' AND cux_Is_Read__c = false`.replace(/\s+/g, ' ').trim()
        }
      }).then((r) => r.data.totalSize),

    markNotificationRead: (notificationId) =>
      updateRecord('cux_Notification__c', notificationId, { cux_Is_Read__c: true }),

    markAllNotificationsRead: (userId) =>
      query(
        `SELECT Id FROM cux_Notification__c
         WHERE cux_User__c = '${userId}' AND cux_Is_Read__c = false
         LIMIT 100`
      ).then((records) =>
        Promise.all(records.map((r) => updateRecord('cux_Notification__c', r.Id, { cux_Is_Read__c: true })))
      ),

    deleteNotification: (notificationId) =>
      deleteRecord('cux_Notification__c', notificationId),

    createNotification: (data) =>
      createRecord('cux_Notification__c', data),

    // ─── Contract Comments (cux_ContractComment__c) ───
    getContractComments: (contractId) =>
      query(
        `SELECT Id, Name, cux_Comment_Text__c, cux_Commented_By__c,
                cux_Commented_By__r.Name, cux_Commented_By__r.SmallPhotoUrl,
                cux_Comment_Timestamp__c, cux_Visibility__c, cux_Contract__c
         FROM cux_ContractComment__c
         WHERE cux_Contract__c = '${contractId}'
         ORDER BY cux_Comment_Timestamp__c DESC LIMIT 100`
      ),
    createContractComment: (data) => createRecord('cux_ContractComment__c', data),
  }
}
