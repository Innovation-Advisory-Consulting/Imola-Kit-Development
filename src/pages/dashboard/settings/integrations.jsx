import * as React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Helmet } from "react-helmet-async";
import { CloudIcon } from "@phosphor-icons/react/dist/ssr/Cloud";
import { DatabaseIcon } from "@phosphor-icons/react/dist/ssr/Database";
import { PlugIcon } from "@phosphor-icons/react/dist/ssr/Plug";
import { BrainIcon } from "@phosphor-icons/react/dist/ssr/Brain";
import { ScanIcon } from "@phosphor-icons/react/dist/ssr/Scan";
import { MicrosoftTeamsLogoIcon } from "@phosphor-icons/react/dist/ssr/MicrosoftTeamsLogo";

import { appConfig } from "@/config/app";
import { Integrations } from "@/components/dashboard/settings/integrations";
import { AnimatedPage } from "@/components/core/animations";

const metadata = { title: `Integrations | Settings | Dashboard | ${appConfig.name}` };

export function Page() {
	return (
		<React.Fragment>
			<Helmet>
				<title>{metadata.title}</title>
			</Helmet>
			<AnimatedPage>
			<Stack spacing={4}>
				<div>
					<Typography variant="h4">Integrations</Typography>
				</div>
				<Integrations
					integrations={[
						{
							id: "salesforce",
							name: "Salesforce",
							icon: <CloudIcon fontSize="var(--Icon-fontSize)" weight="fill" />,
							color: "#00A1E0",
							description: "CRM platform — accounts, contacts, cases, and custom objects",
							installed: true,
						},
						{
							id: "dataverse",
							name: "Microsoft Dataverse",
							icon: <DatabaseIcon fontSize="var(--Icon-fontSize)" weight="fill" />,
							color: "#742774",
							description: "Dataverse table access, queries, and CRUD operations",
							installed: true,
						},
						{
							id: "custom_mcp",
							name: "Custom MCP",
							icon: <PlugIcon fontSize="var(--Icon-fontSize)" weight="fill" />,
							color: "#4A5568",
							description: "Model Context Protocol server for AI-powered automation",
							installed: true,
						},
						{
							id: "azure_openai",
							name: "Azure OpenAI",
							icon: <BrainIcon fontSize="var(--Icon-fontSize)" weight="fill" />,
							color: "#0078D4",
							description: "GPT and embedding models for intelligent document processing",
							installed: true,
						},
						{
							id: "azure_doc_intelligence",
							name: "Azure Document Intelligence",
							icon: <ScanIcon fontSize="var(--Icon-fontSize)" weight="fill" />,
							color: "#0078D4",
							description: "AI-powered document scanning, OCR, and data extraction",
							installed: true,
						},
						{
							id: "sharepoint",
							name: "SharePoint",
							icon: <MicrosoftTeamsLogoIcon fontSize="var(--Icon-fontSize)" weight="fill" />,
							color: "#038387",
							description: "Document management and file storage integration",
							installed: false,
						},
					]}
				/>
			</Stack>
			</AnimatedPage>
		</React.Fragment>
	);
}
