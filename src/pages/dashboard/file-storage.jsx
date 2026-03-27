import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { Helmet } from "react-helmet-async";

import { appConfig } from "@/config/app";
import { AiAnalysisPanel } from "@/components/dashboard/file-storage/ai-analysis-panel";
import { DocumentIntelligencePanel } from "@/components/dashboard/file-storage/document-intelligence-panel";

const metadata = { title: `Document Studio | Dashboard | ${appConfig.name}` };

export function Page() {
	const [tab, setTab] = React.useState(0);

	return (
		<React.Fragment>
			<Helmet>
				<title>{metadata.title}</title>
			</Helmet>
			<Box
				sx={{
					maxWidth: "var(--Content-maxWidth)",
					m: "var(--Content-margin)",
					p: "var(--Content-padding)",
					width: "var(--Content-width)",
				}}
			>
				<Stack spacing={4}>
					<Box sx={{ flex: "1 1 auto" }}>
						<Typography variant="h4">Document Studio</Typography>
					</Box>

					<Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
						<Tab label="Document Intelligence" />
						<Tab label="AI Analysis" />
					</Tabs>

					{tab === 0 && <DocumentIntelligencePanel />}
					{tab === 1 && <AiAnalysisPanel />}
				</Stack>
			</Box>
		</React.Fragment>
	);
}
