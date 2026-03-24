import * as React from "react";
import { Helmet } from "react-helmet-async";

import { appConfig } from "@/config/app";
import { SplitLayout } from "@/components/auth/split-layout";
import { ResetPasswordForm } from "@/components/auth/supabase/reset-password-form";

const metadata = { title: `Reset password | Supabase | Auth | ${appConfig.name}` };

export function Page() {
	return (
		<React.Fragment>
			<Helmet>
				<title>{metadata.title}</title>
			</Helmet>
			<SplitLayout>
				<ResetPasswordForm />
			</SplitLayout>
		</React.Fragment>
	);
}
