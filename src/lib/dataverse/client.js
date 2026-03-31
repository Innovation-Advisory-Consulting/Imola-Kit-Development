import { getMsalInstance } from '@/lib/azure-ad/config';

const DATAVERSE_URL = import.meta.env.VITE_AZURE_ORG_URL || 'https://orge8d9b29f.crm.dynamics.com';
const DATAVERSE_SCOPE = `${DATAVERSE_URL}/.default`;

async function getAccessToken() {
  const msalInstance = getMsalInstance();
  const account = msalInstance.getActiveAccount();
  if (!account) throw new Error('No active account. Please sign in first.');

  try {
    const response = await msalInstance.acquireTokenSilent({ scopes: [DATAVERSE_SCOPE], account });
    return response.accessToken;
  } catch {
    const response = await msalInstance.acquireTokenPopup({ scopes: [DATAVERSE_SCOPE], account });
    return response.accessToken;
  }
}

function buildHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'OData-MaxVersion': '4.0',
    'OData-Version': '4.0',
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

export async function queryAccounts({ select = [], filter, orderby, top = 50 } = {}) {
  const token = await getAccessToken();
  const params = new URLSearchParams();
  if (select.length) params.set('$select', select.join(','));
  if (filter) params.set('$filter', filter);
  if (orderby) params.set('$orderby', orderby);
  params.set('$top', String(top));

  const res = await fetch(`${DATAVERSE_URL}/api/data/v9.2/accounts?${params}`, {
    headers: buildHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Dataverse error: ${res.status}`);
  }
  const data = await res.json();
  return data.value;
}

export async function fetchAccount(accountId) {
  const token = await getAccessToken();
  const select = [
    'accountid', 'name', 'accountnumber', 'telephone1', 'emailaddress1', 'websiteurl',
    'industrycode', 'customertypecode', 'statecode', 'numberofemployees',
    'address1_line1', 'address1_city', 'address1_stateorprovince', 'address1_postalcode', 'address1_country',
    'description', 'createdon', 'revenue',
  ].join(',');

  const res = await fetch(`${DATAVERSE_URL}/api/data/v9.2/accounts(${accountId})?$select=${select}`, {
    headers: buildHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Dataverse error: ${res.status}`);
  }
  return res.json();
}

export async function createAccount(fields) {
  const token = await getAccessToken();
  const res = await fetch(`${DATAVERSE_URL}/api/data/v9.2/accounts`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Dataverse error: ${res.status}`);
  }
  // 204 No Content — returns the new record URI in the OData-EntityId header
  return res.headers.get('OData-EntityId') || res.headers.get('Location');
}

// ── Email Functions ──

export async function whoAmI() {
  const token = await getAccessToken();
  const res = await fetch(`${DATAVERSE_URL}/api/data/v9.2/WhoAmI`, {
    headers: buildHeaders(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Dataverse error: ${res.status}`);
  }
  return res.json();
}

async function findOrCreateContact(email, name) {
  const token = await getAccessToken();

  // Search for existing contact by email
  const searchRes = await fetch(
    `${DATAVERSE_URL}/api/data/v9.2/contacts?$filter=emailaddress1 eq '${email}'&$select=contactid,fullname,emailaddress1&$top=1`,
    { headers: buildHeaders(token) }
  );
  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.value?.length > 0) {
      return data.value[0].contactid;
    }
  }

  // Create new contact
  const nameParts = (name || email.split('@')[0]).split(' ');
  const createRes = await fetch(`${DATAVERSE_URL}/api/data/v9.2/contacts`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify({
      firstname: nameParts[0] || '',
      lastname: nameParts.slice(1).join(' ') || nameParts[0] || 'Contact',
      emailaddress1: email,
    }),
  });
  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to create contact: ${createRes.status}`);
  }
  const entityUri = createRes.headers.get('OData-EntityId') || '';
  const match = entityUri.match(/\(([^)]+)\)/);
  return match ? match[1] : null;
}

export async function sendEmail({ to, subject, body }) {
  const token = await getAccessToken();

  // Get current user's systemuser ID
  const whoAmIData = await whoAmI();
  const systemUserId = whoAmIData.UserId;

  // Resolve each recipient to a contact
  const toParties = [];
  for (const recipient of to) {
    const contactId = await findOrCreateContact(recipient.email, recipient.name);
    toParties.push({
      'partyid_contact@odata.bind': `/contacts(${contactId})`,
      participationtypemask: 2, // To
    });
  }

  // Create the email activity
  const emailRecord = {
    subject,
    description: body,
    directioncode: true, // Outgoing
    'email_activity_parties': [
      {
        'partyid_systemuser@odata.bind': `/systemusers(${systemUserId})`,
        participationtypemask: 1, // From
      },
      ...toParties,
    ],
  };

  const createRes = await fetch(`${DATAVERSE_URL}/api/data/v9.2/emails`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(emailRecord),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to create email: ${createRes.status}`);
  }

  // Extract the email activity ID
  const entityUri = createRes.headers.get('OData-EntityId') || '';
  const match = entityUri.match(/\(([^)]+)\)/);
  const activityId = match ? match[1] : null;

  if (!activityId) {
    throw new Error('Email created but could not extract activity ID');
  }

  // Send the email using the SendEmail action
  try {
    const sendRes = await fetch(`${DATAVERSE_URL}/api/data/v9.2/emails(${activityId})/Microsoft.Dynamics.CRM.SendEmail`, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify({
        IssueSend: true,
      }),
    });

    if (!sendRes.ok) {
      // If SendEmail fails, set status to Pending Send for Server-Side Sync
      await fetch(`${DATAVERSE_URL}/api/data/v9.2/emails(${activityId})`, {
        method: 'PATCH',
        headers: buildHeaders(token),
        body: JSON.stringify({ statuscode: 6 }), // Pending Send
      });
    }
  } catch {
    // Fallback: set to Pending Send for Server-Side Sync delivery
    await fetch(`${DATAVERSE_URL}/api/data/v9.2/emails(${activityId})`, {
      method: 'PATCH',
      headers: buildHeaders(token),
      body: JSON.stringify({ statuscode: 6 }),
    });
  }

  return activityId;
}

export async function fetchEmails({ folder = 'inbox', top = 50 } = {}) {
  const token = await getAccessToken();
  const whoAmIData = await whoAmI();
  const systemUserId = whoAmIData.UserId;

  let filter;
  if (folder === 'sent') {
    filter = `directioncode eq true and _ownerid_value eq '${systemUserId}'`;
  } else {
    // Inbox: all incoming emails owned by or regarding the current user
    filter = `directioncode eq false and (_ownerid_value eq '${systemUserId}' or _regardingobjectid_value ne null)`;
  }

  const params = new URLSearchParams();
  params.set('$select', 'activityid,subject,description,directioncode,statuscode,createdon,modifiedon');
  params.set('$expand', 'email_activity_parties($select=participationtypemask,_partyid_value,addressused)');
  params.set('$filter', filter);
  params.set('$orderby', 'createdon desc');
  params.set('$top', String(top));

  const res = await fetch(`${DATAVERSE_URL}/api/data/v9.2/emails?${params}`, {
    headers: buildHeaders(token),
  });

  if (!res.ok) {
    // If complex filter fails, try simpler query for all incoming emails
    const simpleParams = new URLSearchParams();
    simpleParams.set('$select', 'activityid,subject,description,directioncode,statuscode,createdon,modifiedon');
    simpleParams.set('$expand', 'email_activity_parties($select=participationtypemask,_partyid_value,addressused)');
    simpleParams.set('$filter', `directioncode eq false`);
    simpleParams.set('$orderby', 'createdon desc');
    simpleParams.set('$top', String(top));

    const fallbackRes = await fetch(`${DATAVERSE_URL}/api/data/v9.2/emails?${simpleParams}`, {
      headers: buildHeaders(token),
    });

    if (!fallbackRes.ok) {
      const err = await fallbackRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Dataverse error: ${fallbackRes.status}`);
    }

    const fallbackData = await fallbackRes.json();
    return fallbackData.value;
  }

  const data = await res.json();
  return data.value;
}
