"use client";

import * as React from "react";
import Alert from "@mui/material/Alert";
import { useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";

import { paths } from "@/paths";
import { logger } from "@/lib/default-logger";

export function Page() {
	const { instance } = useMsal();
	const navigate = useNavigate();
	const executedRef = React.useRef(false);
	const [displayError, setDisplayError] = React.useState(null);

	const handle = React.useCallback(async () => {
		if (executedRef.current) {
			return;
		}

		executedRef.current = true;

		try {
			const response = await instance.handleRedirectPromise();

			if (response) {
				navigate(paths.dashboard.overview);
			}
		} catch (error) {
			logger.error("Azure AD callback error", error);
			setDisplayError("Authentication failed");
		}
	}, [instance, navigate]);

	React.useEffect(() => {
		handle().catch(logger.error);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Expected
	}, []);

	if (displayError) {
		return <Alert color="error">{displayError}</Alert>;
	}

	return null;
}
