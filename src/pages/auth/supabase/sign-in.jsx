import * as React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import { appConfig } from "@/config/app";
import { paths } from "@/paths";
import { logger } from "@/lib/default-logger";
import { SplitLayout } from "@/components/auth/split-layout";
import { useAuth } from "@/components/auth/supabase/auth-context";
import { SignInForm } from "@/components/auth/supabase/sign-in-form";

const metadata = { title: `Sign in | Supabase | Auth | ${appConfig.name}` };

export function Page() {
	const { isAuthenticated, isLoading } = useAuth();
	const navigate = useNavigate();

	React.useEffect(() => {
		if (isLoading || !isAuthenticated) {
			return;
		}

		logger.debug("[Sign in] User is authenticated, redirecting to dashboard");
		navigate(paths.dashboard.overview);
	}, [isAuthenticated, isLoading, navigate]);

	if (isLoading || isAuthenticated) {
		return null;
	}

	return (
		<React.Fragment>
			<Helmet>
				<title>{metadata.title}</title>
			</Helmet>
			<SplitLayout>
				<SignInForm />
			</SplitLayout>
		</React.Fragment>
	);
}
