"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";

import { PropertyItem } from "@/components/core/property-item";
import { PropertyList } from "@/components/core/property-list";

export function AccountDetails() {
	const user = { name: "Sofia Rivers", avatar: "/assets/avatar.png", email: "sofia@devias.io", username: "sofia.rivers", id: "USR-000" };

	return (
		<Card>
			<CardHeader
				avatar={
					<Avatar>
						<UserIcon fontSize="var(--Icon-fontSize)" />
					</Avatar>
				}
				title="Profile"
				subheader="Your account information"
			/>
			<Divider />
			<CardContent>
				<Stack spacing={3}>
					<Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
						<Avatar
							src={user?.avatar || undefined}
							sx={{ "--Avatar-size": "80px", fontSize: "2rem" }}
						>
							{user?.name ? user.name.charAt(0) : "U"}
						</Avatar>
						<Stack spacing={0.5}>
							<Typography variant="h6">{user?.name || "User"}</Typography>
							{user?.username ? (
								<Typography variant="body2" color="text.secondary">
									{user.username}
								</Typography>
							) : null}
							<Chip label="User" size="small" variant="outlined" color="primary" />
						</Stack>
					</Stack>
					<Divider />
					<PropertyList divider={<Divider />} sx={{ "--PropertyItem-padding": "12px 0" }}>
						<PropertyItem name="Full Name" value={user?.name || "—"} />
						<PropertyItem name="Email" value={user?.email || "—"} />
						<PropertyItem name="Username" value={user?.username || "—"} />
						<PropertyItem name="User ID" value={user?.id || "—"} />
					</PropertyList>
				</Stack>
			</CardContent>
		</Card>
	);
}
