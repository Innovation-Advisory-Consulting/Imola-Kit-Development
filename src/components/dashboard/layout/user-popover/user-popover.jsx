"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemIcon from "@mui/material/ListItemIcon";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import { CreditCardIcon } from "@phosphor-icons/react/dist/ssr/CreditCard";
import { LockKeyIcon } from "@phosphor-icons/react/dist/ssr/LockKey";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";

import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";

import { paths } from "@/paths";
import { useAuth } from "@/auth/AuthContext";
import { RouterLink } from "@/components/core/link";

import { SalesforceSignOut } from "./salesforce-sign-out";

export function UserPopover({ anchorEl, onClose, open }) {
	const { auth } = useAuth();
	const user = auth?.user;

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
					<Avatar src={user?.avatar} sx={{ width: 40, height: 40 }}>{user?.name?.[0]}</Avatar>
					<Box>
						<Typography variant="subtitle2">{user?.name || "User"}</Typography>
						<Typography color="text.secondary" variant="body2">
							{user?.email || user?.username || ""}
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
			<Box sx={{ p: 1 }}>
				<SalesforceSignOut />
			</Box>
		</Popover>
	);
}
