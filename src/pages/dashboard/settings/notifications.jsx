import * as React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Helmet } from "react-helmet-async";

import { appConfig } from "@/config/app";
import { EmailNotifications } from "@/components/dashboard/settings/email-notifications";
import { PhoneNotifications } from "@/components/dashboard/settings/phone-notifications";
import { AnimatedPage } from "@/components/core/animations";

const metadata = { title: `Notifications | Settings | Dashboard | ${appConfig.name}` };

export function Page() {
	return (
		<React.Fragment>
			<Helmet>
				<title>{metadata.title}</title>
			</Helmet>
			<AnimatedPage>
			<Stack spacing={4}>
				<div>
					<Typography variant="h4">Notifications</Typography>
				</div>
				<Stack spacing={4}>
					<EmailNotifications />
					<PhoneNotifications />
				</Stack>
			</Stack>
			</AnimatedPage>
		</React.Fragment>
	);
}
