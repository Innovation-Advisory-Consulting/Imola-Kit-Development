import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FileArrowDown as FileArrowDownIcon } from "@phosphor-icons/react/FileArrowDown";

const solutions = [
	{ key: "ccx-portfolio", title: "CCX Portfolio", href: "#solutions" },
	{ key: "mobility", title: "Mobility Solutions", href: "#solutions" },
	{ key: "workflow", title: "Workflow Automation", href: "#solutions" },
	{ key: "portal", title: "Portal Solutions", href: "#solutions" },
];

const resources = [
	{ key: "whitepaper", title: "Download Whitepaper", href: "#whitepaper", icon: true },
	{ key: "about", title: "About Us", href: "#about" },
	{ key: "support", title: "Support", href: "#support" },
	{ key: "contact", title: "Contact", href: "#contact" },
];

const legalLinks = [
	{ key: "eula", title: "EULA", href: "#eula" },
	{ key: "privacy", title: "Privacy Statement", href: "#privacy" },
	{ key: "ai-policy", title: "AI-Policy Statement", href: "#ai-policy" },
	{ key: "third-party", title: "Third Party Notices", href: "#third-party" },
];

export function Footer() {
	return (
		<Box
			component="footer"
			sx={{
				bgcolor: "#0f172a",
				color: "#9ca3af",
				py: { xs: 4, md: 5 },
			}}
		>
			<Container maxWidth="lg">
				<Grid container spacing={{ xs: 3, md: 4 }} sx={{ mb: { xs: 3, md: 4 } }}>
					{/* Brand column */}
					<Grid size={{ xs: 12, md: 3 }}>
						<Box
							component="img"
							src="/assets/CloudCoro_compact.png"
							alt="CloudCORO"
							sx={{ height: { xs: 32, md: 40 }, width: "auto", mb: 1.5 }}
						/>
						<Typography variant="body2" sx={{ color: "#9ca3af", fontSize: { xs: "0.75rem", md: "0.875rem" } }}>
							The #1 Partner for Government-to-Constituent Interaction
						</Typography>
					</Grid>

					{/* Solutions column */}
					<Grid size={{ xs: 12, sm: 4, md: 3 }}>
						<Typography
							variant="subtitle2"
							sx={{ color: "#ffffff", fontWeight: 600, mb: 1.5, fontSize: { xs: "0.875rem", md: "1rem" } }}
						>
							Solutions
						</Typography>
						<Stack component="ul" spacing={0.75} sx={{ listStyle: "none", m: 0, p: 0 }}>
							{solutions.map((item) => (
								<li key={item.key}>
									<Link
										href={item.href}
										underline="none"
										sx={{
											color: "#9ca3af",
											fontSize: { xs: "0.75rem", md: "0.875rem" },
											"&:hover": { color: "#4ade80" },
											transition: "color 0.2s",
										}}
									>
										{item.title}
									</Link>
								</li>
							))}
						</Stack>
					</Grid>

					{/* Resources column */}
					<Grid size={{ xs: 12, sm: 4, md: 3 }}>
						<Typography
							variant="subtitle2"
							sx={{ color: "#ffffff", fontWeight: 600, mb: 1.5, fontSize: { xs: "0.875rem", md: "1rem" } }}
						>
							Resources
						</Typography>
						<Stack component="ul" spacing={0.75} sx={{ listStyle: "none", m: 0, p: 0 }}>
							{resources.map((item) => (
								<li key={item.key}>
									<Link
										href={item.href}
										underline="none"
										sx={{
											color: "#9ca3af",
											fontSize: { xs: "0.75rem", md: "0.875rem" },
											"&:hover": { color: "#4ade80" },
											transition: "color 0.2s",
											display: "inline-flex",
											alignItems: "center",
											gap: 0.75,
										}}
									>
										{item.icon ? <FileArrowDownIcon size={14} /> : null}
										{item.title}
									</Link>
								</li>
							))}
						</Stack>
					</Grid>

					{/* Connect column */}
					<Grid size={{ xs: 12, sm: 4, md: 3 }}>
						<Typography
							variant="subtitle2"
							sx={{ color: "#ffffff", fontWeight: 600, mb: 1.5, fontSize: { xs: "0.875rem", md: "1rem" } }}
						>
							Connect
						</Typography>
						<Typography variant="body2" sx={{ color: "#9ca3af", fontSize: { xs: "0.75rem", md: "0.875rem" }, mb: 1.5 }}>
							Ready to transform your agency&apos;s operations?
						</Typography>
						<Button
							href="#contact"
							variant="contained"
							size="small"
							sx={{
								bgcolor: "#84cc16",
								color: "#ffffff",
								fontWeight: 600,
								fontSize: { xs: "0.75rem", md: "0.875rem" },
								borderRadius: 2,
								px: 2.5,
								textTransform: "none",
								"&:hover": { bgcolor: "#65a30d" },
							}}
						>
							Get Started
						</Button>
					</Grid>
				</Grid>

				{/* Bottom bar */}
				<Divider sx={{ borderColor: "#1f2937" }} />
				<Stack
					direction={{ xs: "column", md: "row" }}
					spacing={1.5}
					sx={{
						alignItems: "center",
						justifyContent: "space-between",
						pt: { xs: 2, md: 3 },
					}}
				>
					<Typography
						variant="body2"
						sx={{ color: "#9ca3af", fontSize: { xs: "0.75rem", md: "0.875rem" }, textAlign: { xs: "center", md: "left" } }}
					>
						&copy; 2026 CloudCORO. All rights reserved. | Modernization that feels natural.
					</Typography>
					<Stack
						direction="row"
						spacing={1.5}
						sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}
						divider={
							<Typography sx={{ color: "#374151", fontSize: "0.75rem" }}>|</Typography>
						}
					>
						{legalLinks.map((item) => (
							<Link
								key={item.key}
								href={item.href}
								underline="none"
								sx={{
									color: "#9ca3af",
									fontSize: "0.75rem",
									"&:hover": { color: "#4ade80" },
									transition: "color 0.2s",
								}}
							>
								{item.title}
							</Link>
						))}
					</Stack>
				</Stack>
			</Container>
		</Box>
	);
}
