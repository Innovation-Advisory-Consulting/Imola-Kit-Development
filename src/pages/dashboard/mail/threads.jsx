import * as React from "react";
import { Helmet } from "react-helmet-async";

import { appConfig } from "@/config/app";
import { ThreadsView } from "@/components/dashboard/mail/threads-view";

const metadata = { title: `Mail | Dashboard | ${appConfig.name}` };

export function Page() {
	return (
		<React.Fragment>
			<Helmet>
				<title>{metadata.title}</title>
			</Helmet>
			<ThreadsView />
		</React.Fragment>
	);
}
