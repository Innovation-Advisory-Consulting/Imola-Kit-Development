import * as React from "react";
import { Helmet } from "react-helmet-async";

import { appConfig } from "@/config/app";
import { SplitLayout } from "@/components/auth/split-layout";
import { SignUpForm } from "@/components/auth/supabase/sign-up-form";

const metadata = { title: `Sign up | Supabase | Auth | ${appConfig.name}` };

export function Page() {
	return (
		<React.Fragment>
			<Helmet>
				<title>{metadata.title}</title>
			</Helmet>
			<SplitLayout>
				<SignUpForm />
			</SplitLayout>
		</React.Fragment>
	);
}
