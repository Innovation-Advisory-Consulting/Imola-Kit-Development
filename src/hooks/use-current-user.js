"use client";

import { useMsal } from "@azure/msal-react";

export function useCurrentUser() {
	const { instance } = useMsal();
	const account = instance.getActiveAccount();

	if (!account) {
		return { id: "USR-000", name: "User", email: "" };
	}

	return {
		id: "USR-000",
		name: account.name || "User",
		email: account.username || "",
	};
}
