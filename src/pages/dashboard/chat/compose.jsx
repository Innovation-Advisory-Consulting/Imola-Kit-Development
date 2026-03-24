import * as React from "react";
import { Helmet } from "react-helmet-async";

import { appConfig } from "@/config/app";
import { ComposeView } from "@/components/dashboard/chat/compose-view";

const metadata = { title: `Compose | Chat | Dashboard | ${appConfig.name}` };

export function Page() {
	return (
		<React.Fragment>
			<Helmet>
				<title>{metadata.title}</title>
			</Helmet>
			<ComposeView />
		</React.Fragment>
	);
}
