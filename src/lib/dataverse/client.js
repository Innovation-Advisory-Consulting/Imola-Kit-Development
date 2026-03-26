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
