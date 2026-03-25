import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { DesktopIcon } from "@phosphor-icons/react/dist/ssr/Desktop";
import { DeviceMobileIcon } from "@phosphor-icons/react/dist/ssr/DeviceMobile";
import { CloudIcon } from "@phosphor-icons/react/dist/ssr/Cloud";

const platforms = [
	{
		id: "citizen-portal",
		icon: UsersThreeIcon,
		title: "Citizen Portal",
		description: "Self-service portal for constituents to access services, submit applications, and track cases online.",
		features: [
			"Online application submission",
			"Real-time case status tracking",
			"Document upload & management",
			"Multi-language support",
			"ADA/Section 508 compliant",
		],
		highlighted: false,
	},
	{
		id: "back-office",
		icon: DesktopIcon,
		title: "Back Office System",
		description:
			"Comprehensive case management and workflow automation for government staff and administrators.",
		features: [
			"Intelligent case routing",
			"Automated workflow engine",
			"Document generation & templates",
			"Role-based access control",
			"Advanced reporting & analytics",
		],
		highlighted: true,
	},
	{
		id: "mobile-field",
		icon: DeviceMobileIcon,
		title: "Mobile Field Apps",
		description: "Native mobile applications for field staff with offline capabilities and real-time synchronization.",
		features: [
			"Offline-first architecture",
			"GPS & location services",
			"Photo & signature capture",
			"Push notifications",
			"Real-time data sync",
		],
		highlighted: false,
	},
];

export function Included() {
	return (
		<Box
			sx={{
				bgcolor: "var(--mui-palette-neutral-950)",
				color: "var(--mui-palette-common-white)",
				overflow: "hidden",
				py: "120px",
				position: "relative",
			}}
		>
			<Box
				sx={{
					alignItems: "center",
					display: "flex",
					height: "100%",
					justifyContent: "center",
					left: 0,
					position: "absolute",
					top: 0,
					width: "100%",
					zIndex: 0,
				}}
			>
				<Box component="img" src="/assets/home-cosmic.svg" sx={{ height: "auto", width: "1600px" }} />
			</Box>
			<Stack spacing={8} sx={{ position: "relative", zIndex: 1 }}>
				<Container maxWidth="md">
					<Stack spacing={2}>
						<Box sx={{ display: "flex", justifyContent: "center" }}>
							<Chip color="primary" icon={<CloudIcon />} label="Platform" variant="soft" />
						</Box>
						<Typography color="inherit" sx={{ textAlign: "center" }} variant="h3">
							Three Platforms, One Solution
						</Typography>
						<Typography color="neutral.300" sx={{ textAlign: "center" }}>
							A unified ecosystem connecting citizens, government staff, and field workers through integrated
							platforms that share data seamlessly.
						</Typography>
					</Stack>
				</Container>
				<Container maxWidth="lg">
					<Grid container spacing={3}>
						{platforms.map((platform) => (
							<Grid key={platform.id} size={{ xs: 12, md: 4 }}>
								<Card
									sx={{
										bgcolor: platform.highlighted ? "var(--mui-palette-primary-main)" : "rgba(255,255,255,0.05)",
										border: platform.highlighted ? "none" : "1px solid rgba(255,255,255,0.1)",
										borderRadius: "20px",
										color: "var(--mui-palette-common-white)",
										height: "100%",
										p: 4,
									}}
								>
									<Stack spacing={3}>
										<Box
											sx={{
												alignItems: "center",
												bgcolor: platform.highlighted ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
												borderRadius: "12px",
												display: "flex",
												height: 48,
												justifyContent: "center",
												width: 48,
											}}
										>
											<platform.icon size={24} />
										</Box>
										<Typography color="inherit" variant="h5">
											{platform.title}
										</Typography>
										<Typography
											sx={{ color: platform.highlighted ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.6)" }}
											variant="body2"
										>
											{platform.description}
										</Typography>
										<Stack spacing={1.5}>
											{platform.features.map((feature) => (
												<Stack key={feature} direction="row" spacing={1} sx={{ alignItems: "center" }}>
													<CheckIcon
														size={16}
														style={{
															color: platform.highlighted ? "#ffffff" : "#84cc16",
															flexShrink: 0,
														}}
													/>
													<Typography
														sx={{
															color: platform.highlighted ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.7)",
															fontSize: "0.875rem",
														}}
													>
														{feature}
													</Typography>
												</Stack>
											))}
										</Stack>
									</Stack>
								</Card>
							</Grid>
						))}
					</Grid>
				</Container>
				<Container maxWidth="md">
					<Box
						sx={{
							bgcolor: "rgba(132,204,22,0.1)",
							border: "1px solid rgba(132,204,22,0.3)",
							borderRadius: "12px",
							p: 3,
							textAlign: "center",
						}}
					>
						<Typography color="inherit" variant="subtitle1">
							Deploy Anywhere, Connect Everything
						</Typography>
						<Typography sx={{ color: "rgba(255,255,255,0.7)", mt: 1 }} variant="body2">
							Imola Kit integrates with existing systems through secure APIs and pre-built connectors.
						</Typography>
					</Box>
				</Container>
			</Stack>
		</Box>
	);
}
