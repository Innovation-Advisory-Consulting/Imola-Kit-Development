"use client";

import * as React from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

import { loginRequest } from "@/lib/azure-ad/config";

// Module-level flag to prevent StrictMode from calling loginRedirect twice
let loginInProgress = false;

export function AuthGuard({ children }) {
	const { instance, inProgress } = useMsal();
	const isAuthenticated = useIsAuthenticated();

	React.useEffect(() => {
		if (inProgress !== InteractionStatus.None || isAuthenticated || loginInProgress) {
			return;
		}

		loginInProgress = true;
		instance.loginRedirect(loginRequest).catch((error) => {
			console.error("[AzureAD] Login redirect error:", error);
			loginInProgress = false;
		});
	}, [isAuthenticated, inProgress, instance]);

	if (inProgress !== InteractionStatus.None || !isAuthenticated) {
		return null;
	}

	return <React.Fragment>{children}</React.Fragment>;
}
