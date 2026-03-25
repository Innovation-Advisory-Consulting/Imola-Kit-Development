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
		question: "How does Imola Kit ensure data security and compliance?",
		answer:
			"Imola Kit is built with security best practices including encryption at rest and in transit using AES-256 encryption. Role-based access control ensures users only see data relevant to their responsibilities.",
	},
	{
		id: "FAQ-2",
		question: "Can Imola Kit integrate with existing systems?",
		answer:
			"Yes. Imola Kit provides REST and SOAP API frameworks that support custom integrations with a wide variety of systems and services.",
	},
	{
		id: "FAQ-3",
		question: "How do mobile apps work in areas without internet connectivity?",
		answer:
			"Our mobile apps use an offline-first architecture. Users can work entirely offline, and all data syncs automatically when connectivity is restored, with conflict resolution built in to handle concurrent updates.",
	},
	{
		id: "FAQ-4",
		question: "What is the typical implementation timeline?",
		answer:
			"A standard Imola Kit deployment takes 12-16 weeks for core functionality. Complex integrations or custom workflows may extend the timeline. We follow an agile methodology with phased go-lives so you see value quickly.",
	},
	{
		id: "FAQ-5",
		question: "Is Imola Kit accessible and ADA/Section 508 compliant?",
		answer:
			"Absolutely. Imola Kit meets WCAG 2.1 AA standards and is fully Section 508 compliant. It supports screen readers, keyboard navigation, high contrast modes, and multi-language content.",
	},
	{
		id: "FAQ-6",
		question: "How does Imola Kit handle scaling?",
		answer:
			"Imola Kit scales automatically to handle high volumes of interactions. Load balancing, auto-scaling, and geographic redundancy ensure consistent performance during peak periods.",
	},
	{
		id: "FAQ-7",
		question: "What training and support options are available?",
		answer:
			"Imola Kit includes comprehensive onboarding with role-based training. We provide a self-service knowledge base, video tutorials, and dedicated support channels.",
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
									href="mailto:info@example.com"
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
