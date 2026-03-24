"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { QuestionIcon } from "@phosphor-icons/react/dist/ssr/Question";

const faqs = [
	{
		id: "FAQ-1",
		question: "How does CloudCORO ensure data security and compliance?",
		answer:
			"CloudCORO is built on Salesforce Government Cloud with FedRAMP authorization. All data is encrypted at rest and in transit using AES-256 encryption. We maintain SOC 2 Type II certification, support CJIS compliance, and meet FISMA requirements. Role-based access control ensures staff only see data relevant to their responsibilities.",
	},
	{
		id: "FAQ-2",
		question: "Can CloudCORO integrate with our existing legacy systems?",
		answer:
			"Yes. CloudCORO provides pre-built connectors for common government systems including SAP, Oracle, IBM mainframes, and state/county data exchanges. Our REST and SOAP API framework supports custom integrations, and our team has experience migrating data from legacy systems with zero downtime.",
	},
	{
		id: "FAQ-3",
		question: "How do mobile field apps work in areas without internet connectivity?",
		answer:
			"Our mobile apps use an offline-first architecture. Field staff can download assignments, complete inspections, capture photos and signatures, and fill out forms entirely offline. All data syncs automatically when connectivity is restored, with conflict resolution built in to handle concurrent updates.",
	},
	{
		id: "FAQ-4",
		question: "What is the typical implementation timeline?",
		answer:
			"A standard CloudCORO deployment takes 12-16 weeks for core functionality, including citizen portal, back-office system, and mobile apps. Complex integrations or custom workflows may extend the timeline. We follow an agile methodology with phased go-lives so your agency sees value within the first 6 weeks.",
	},
	{
		id: "FAQ-5",
		question: "Is CloudCORO accessible and ADA/Section 508 compliant?",
		answer:
			"Absolutely. CloudCORO meets WCAG 2.1 AA standards and is fully Section 508 compliant. Our citizen portal supports screen readers, keyboard navigation, high contrast modes, and multi-language content. We conduct regular accessibility audits and provide a VPAT (Voluntary Product Accessibility Template) upon request.",
	},
	{
		id: "FAQ-6",
		question: "How does CloudCORO handle scaling for large agencies?",
		answer:
			"Built on Salesforce's multi-tenant architecture, CloudCORO scales automatically to handle millions of citizen interactions. We currently support agencies processing over 500,000 cases annually. Load balancing, auto-scaling, and geographic redundancy ensure consistent performance during peak periods.",
	},
	{
		id: "FAQ-7",
		question: "What training and support options are available?",
		answer:
			"CloudCORO includes comprehensive onboarding with role-based training for administrators, case workers, and field staff. We provide a self-service knowledge base, video tutorials, and dedicated support channels. Enterprise customers receive a named Customer Success Manager and 24/7 priority support with guaranteed SLAs.",
	},
];

export function Faqs() {
	return (
		<Box sx={{ bgcolor: "var(--mui-palette-background-level1)", py: "120px" }}>
			<Container maxWidth="md">
				<Stack spacing={8}>
					<Stack maxWidth="700px" sx={{ mx: "auto" }}>
						<Stack spacing={2}>
							<Box sx={{ display: "flex", justifyContent: "center" }}>
								<Chip color="primary" icon={<QuestionIcon />} label="FAQ" variant="soft" />
							</Box>
							<Typography sx={{ textAlign: "center" }} variant="h3">
								Frequently Asked Questions
							</Typography>
							<Typography color="text.secondary">
								Have another question?{" "}
								<Box
									component="a"
									href="mailto:info@cloudcoro.com"
									sx={{ color: "inherit", textDecoration: "underline" }}
								>
									Email us
								</Box>{" "}
								or{" "}
								<Box component="a" href="#contact" sx={{ color: "inherit", textDecoration: "underline" }}>
									request a consultation
								</Box>
								.
							</Typography>
						</Stack>
					</Stack>
					<Stack spacing={2}>
						{faqs.map((faq) => (
							<Faq key={faq.id} {...faq} />
						))}
					</Stack>
				</Stack>
			</Container>
		</Box>
	);
}

function Faq({ answer, question }) {
	const [isExpanded, setIsExpanded] = React.useState(false);

	return (
		<Card sx={{ p: 3 }}>
			<Stack
				onClick={() => {
					setIsExpanded((prevState) => !prevState);
				}}
				sx={{ cursor: "pointer" }}
			>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
					<Typography variant="subtitle1">{question}</Typography>
					{isExpanded ? <CaretDownIcon /> : <CaretRightIcon />}
				</Stack>
				<Collapse in={isExpanded}>
					<Typography color="text.secondary" sx={{ pt: 3 }} variant="body2">
						{answer}
					</Typography>
				</Collapse>
			</Stack>
		</Card>
	);
}
