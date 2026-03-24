import * as React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Helmet } from "react-helmet-async";

import { appConfig } from "@/config/app";
import { AccountDetails } from "@/components/dashboard/settings/account-details";
import { ThemeSwitch } from "@/components/dashboard/settings/theme-switch";
import { AnimatedPage } from "@/components/core/animations";

const metadata = { title: `Account | Settings | Dashboard | ${appConfig.name}` };

export function Page() {
	return (
		<React.Fragment>
			<Helmet>
				<title>{metadata.title}</title>
			</Helmet>
			<AnimatedPage>
			<Stack spacing={4}>
				<div>
					<Typography variant="h4">Account</Typography>
				</div>
				<Stack spacing={4}>
					<AccountDetails />
					<ThemeSwitch />
				</Stack>
			</Stack>
			</AnimatedPage>
		</React.Fragment>
	);
}
