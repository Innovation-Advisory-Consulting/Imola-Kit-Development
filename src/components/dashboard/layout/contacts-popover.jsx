"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import { Presence } from "@/components/core/presence";

const contacts = [
	{
		id: "USR-AI",
		name: "AI Assistant",
		avatar: "/assets/avatar-ai.svg",
		status: "online",
	},
];

export function ContactsPopover({ anchorEl, onClose, open = false }) {
	return (
		<Popover
			anchorEl={anchorEl}
			anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
			onClose={onClose}
			open={open}
			slotProps={{ paper: { sx: { width: "300px" } } }}
			transformOrigin={{ horizontal: "right", vertical: "top" }}
		>
			<Box sx={{ px: 3, py: 2 }}>
				<Typography variant="h6">Contacts</Typography>
			</Box>
			<Box sx={{ maxHeight: "400px", overflowY: "auto", px: 1, pb: 2 }}>
				<List disablePadding sx={{ "& .MuiListItemButton-root": { borderRadius: 1 } }}>
					{contacts.map((contact) => (
						<ListItem disablePadding key={contact.id}>
							<ListItemButton>
								<ListItemAvatar>
									<Avatar src={contact.avatar} />
								</ListItemAvatar>
								<ListItemText
									disableTypography
									primary={
										<Link color="text.primary" noWrap underline="none" variant="subtitle2">
											{contact.name}
										</Link>
									}
								/>
								<Presence size="small" status={contact.status} />
							</ListItemButton>
						</ListItem>
					))}
				</List>
			</Box>
		</Popover>
	);
}
