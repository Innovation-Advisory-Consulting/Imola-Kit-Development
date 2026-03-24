import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PlugsConnectedIcon } from "@phosphor-icons/react/dist/ssr/PlugsConnected";
import Chip from "@mui/material/Chip";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { MinusCircleIcon } from "@phosphor-icons/react/dist/ssr/MinusCircle";

export function Integrations({ integrations }) {
	return (
		<Card>
			<CardHeader
				avatar={
					<Avatar>
						<PlugsConnectedIcon fontSize="var(--Icon-fontSize)" />
					</Avatar>
				}
				title="Integrations"
			/>
			<CardContent>
				<Card sx={{ borderRadius: 1 }} variant="outlined">
					<Stack divider={<Divider />}>
						{integrations.map((integration) => (
							<Stack direction="row" key={integration.id} spacing={2} sx={{ alignItems: "center", px: 2, py: 1 }}>
								<Avatar
									src={typeof integration.icon === 'string' ? integration.icon : undefined}
									sx={{
										bgcolor: integration.color || "var(--mui-palette-background-paper)",
										boxShadow: "var(--mui-shadows-8)",
										color: integration.color ? "#fff" : "var(--mui-palette-text-primary)",
									}}
								>
									{typeof integration.icon !== 'string' ? integration.icon : null}
								</Avatar>
								<Box sx={{ flex: "1 1 auto" }}>
									<Typography variant="subtitle2">{integration.name}</Typography>
									<Typography color="text.secondary" variant="caption">
										{integration.description}
									</Typography>
								</Box>
								<Chip
									icon={integration.installed ? <CheckCircleIcon weight="fill" /> : <MinusCircleIcon />}
									label={integration.installed ? "Connected" : "Not configured"}
									size="small"
									color={integration.installed ? "success" : "default"}
									variant={integration.installed ? "soft" : "outlined"}
								/>
							</Stack>
						))}
					</Stack>
				</Card>
			</CardContent>
		</Card>
	);
}
