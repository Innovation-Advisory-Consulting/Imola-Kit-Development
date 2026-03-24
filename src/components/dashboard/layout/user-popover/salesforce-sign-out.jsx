"use client";

import * as React from "react";
import MenuItem from "@mui/material/MenuItem";

import { useAuth } from "@/auth/AuthContext";

export function SalesforceSignOut() {
	const { logout } = useAuth();

	const handleSignOut = React.useCallback(() => {
		logout();
	}, [logout]);

	return (
		<MenuItem component="div" onClick={handleSignOut} sx={{ justifyContent: "center" }}>
			Sign out
		</MenuItem>
	);
}
