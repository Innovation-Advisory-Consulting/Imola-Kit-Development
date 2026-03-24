import * as React from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { GlobeIcon } from "@phosphor-icons/react/dist/ssr/Globe";
import { CurrencyDollarIcon } from "@phosphor-icons/react/dist/ssr/CurrencyDollar";
import { IdentificationCardIcon } from "@phosphor-icons/react/dist/ssr/IdentificationCard";
import { DeviceMobileIcon } from "@phosphor-icons/react/dist/ssr/DeviceMobile";

const solutions = [
	{
		id: "portal",
		icon: GlobeIcon,
		chip: "Multi-Channel Access",
		title: "Citizen Self-Service Portal",
		description:
			"Empower constituents with 24/7 online access to government services, applications, and case status tracking through an intuitive, accessible web portal.",
	},
	{
		id: "grants",
		icon: CurrencyDollarIcon,
		chip: "Financial Management",
		title: "Grants Management",
		description:
			"Complete grant lifecycle management from application intake through award tracking, compliance monitoring, and financial reporting.",
	},
	{
		id: "licensing",
		icon: IdentificationCardIcon,
		chip: "Regulatory Compliance",
		title: "Licensing & Permits",
		description:
			"Streamlined processing for licenses, permits, and certifications with automated workflows, renewal tracking, and compliance verification.",
	},
	{
		id: "mobile",
		icon: DeviceMobileIcon,
		chip: "Field Operations",
		title: "Mobile Field Apps",
		description:
			"Field-ready mobile applications for inspectors, case workers, and field staff with offline capabilities, GPS tracking, and real-time sync.",
	},
];

export function Productivity() {
	return (
		<Box sx={{ bgcolor: "var(--mui-palette-background-paper)", py: "120px" }}>
			<Container maxWidth="lg">
				<Stack spacing={8}>
					<Stack maxWidth="700px" spacing={2} sx={{ mx: "auto" }}>
						<Box sx={{ display: "flex", justifyContent: "center" }}>
							<Chip color="primary" icon={<GlobeIcon />} label="Solutions" variant="soft" />
						</Box>
						<Typography sx={{ textAlign: "center" }} variant="h3">
							Comprehensive Government Solutions
						</Typography>
						<Typography color="text.secondary" sx={{ textAlign: "center" }}>
							Purpose-built platforms designed for the unique needs of federal, state, and local government
							agencies.
						</Typography>
					</Stack>
					<Grid container spacing={3}>
						{solutions.map((solution) => (
							<Grid key={solution.id} size={{ xs: 12, md: 6 }}>
								<Box
									sx={{
										bgcolor: "var(--mui-palette-background-level1)",
										border: "1px solid var(--mui-palette-divider)",
										borderRadius: "20px",
										p: 4,
										height: "100%",
									}}
								>
									<Stack spacing={2}>
										<Box
											sx={{
												alignItems: "center",
												bgcolor: "var(--mui-palette-primary-50)",
												borderRadius: "12px",
												color: "var(--mui-palette-primary-main)",
												display: "flex",
												height: 48,
												justifyContent: "center",
												width: 48,
											}}
										>
											<solution.icon fontSize="var(--icon-fontSize-lg)" />
										</Box>
										<div>
											<Chip color="primary" label={solution.chip} size="small" variant="soft" />
										</div>
										<Typography variant="h5">{solution.title}</Typography>
										<Typography color="text.secondary" variant="body2">
											{solution.description}
										</Typography>
									</Stack>
								</Box>
							</Grid>
						))}
					</Grid>
				</Stack>
			</Container>
		</Box>
	);
}
