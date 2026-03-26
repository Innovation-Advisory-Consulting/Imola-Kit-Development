"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemIcon from "@mui/material/ListItemIcon";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";

import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import { useMsal } from "@azure/msal-react";

import { paths } from "@/paths";
import { RouterLink } from "@/components/core/link";
import { AzureAdSignOut } from "./azure-ad-sign-out";

export function UserPopover({ anchorEl, onClose, open }) {
	const { instance } = useMsal();
	const activeAccount = instance.getActiveAccount();

	const user = activeAccount
		? {
				name: activeAccount.name,
				email: activeAccount.username,
			}
		: { name: "User", email: "" };

	return (
		<Popover
			anchorEl={anchorEl}
			anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
			onClose={onClose}
			open={Boolean(open)}
			slotProps={{ paper: { sx: { width: "280px" } } }}
			transformOrigin={{ horizontal: "right", vertical: "top" }}
		>
			<Box sx={{ p: 2 }}>
				<Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
					<Avatar sx={{ width: 40, height: 40 }}>{user.name?.[0]}</Avatar>
					<Box>
						<Typography variant="subtitle2">{user.name}</Typography>
						<Typography color="text.secondary" variant="body2">
							{user.email}
						</Typography>
					</Box>
				</Stack>
			</Box>
			<Divider />
			<List sx={{ p: 1 }}>
				<MenuItem component={RouterLink} href={paths.dashboard.settings.account} onClick={onClose}>
					<ListItemIcon>
						<UserIcon />
					</ListItemIcon>
					Account
				</MenuItem>
			</List>
			<Divider />
			<AzureAdSignOut />
		</Popover>
	);
}
