"use client";

import * as React from "react";
import MenuItem from "@mui/material/MenuItem";
import { useMsal } from "@azure/msal-react";

import { logger } from "@/lib/default-logger";
import { toast } from "@/components/core/toaster";

export function AzureAdSignOut() {
	const { instance } = useMsal();

	const handleSignOut = React.useCallback(async () => {
		try {
			await instance.logoutRedirect();
		} catch (error) {
			logger.error("Sign out error", error);
			toast.error("Something went wrong, unable to sign out");
		}
	}, [instance]);

	return (
		<MenuItem component="div" onClick={handleSignOut} sx={{ justifyContent: "center" }}>
			Sign out
		</MenuItem>
	);
}
