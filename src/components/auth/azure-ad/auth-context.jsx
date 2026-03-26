"use client";

import * as React from "react";
import { MsalProvider } from "@azure/msal-react";

import { getMsalInstance } from "@/lib/azure-ad/config";

const initPromise = (async () => {
	const instance = getMsalInstance();
	await instance.initialize();

	const response = await instance.handleRedirectPromise();

	if (response?.account) {
		instance.setActiveAccount(response.account);
	} else {
		const accounts = instance.getAllAccounts();

		if (accounts.length > 0) {
			instance.setActiveAccount(accounts[0]);
		}
	}
})();

export function AuthProvider({ children }) {
	const [msalReady, setMsalReady] = React.useState(false);
	const msalInstance = getMsalInstance();

	React.useEffect(() => {
		initPromise
			.then(() => setMsalReady(true))
			.catch(() => setMsalReady(true));
	}, []);

	if (!msalReady) {
		return null;
	}

	return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
