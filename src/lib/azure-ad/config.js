"use client";

import { PublicClientApplication } from "@azure/msal-browser";

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
const authority = `https://login.microsoftonline.com/${tenantId}`;

export const msalConfig = {
	auth: {
		clientId,
		authority,
		redirectUri: window.location.origin,
		postLogoutRedirectUri: window.location.origin,
		navigateToLoginRequestUrl: true,
	},
	cache: {
		cacheLocation: "sessionStorage",
		storeAuthStateInCookie: false,
	},
};

export const loginRequest = {
	scopes: ["User.Read", "openid", "profile", "email"],
};

let msalInstance;

export function getMsalInstance() {
	if (msalInstance) {
		return msalInstance;
	}

	msalInstance = new PublicClientApplication(msalConfig);
	return msalInstance;
}
