"use client";

import * as React from "react";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { BellIcon } from "@phosphor-icons/react/dist/ssr/Bell";

export function useNotifications() {
	const [notifications] = React.useState([]);
	const [unreadCount] = React.useState(0);

	const markAsRead = React.useCallback(() => {}, []);
	const markAllAsRead = React.useCallback(() => {}, []);
	const removeOne = React.useCallback(() => {}, []);

	return { notifications, unreadCount, markAsRead, markAllAsRead, removeOne, refetch: () => {} };
}

export function NotificationsButton() {
	const popoverRef = React.useRef(null);
	const [open, setOpen] = React.useState(false);
	const { unreadCount } = useNotifications();

	return (
		<React.Fragment>
			<Tooltip title="Notifications">
				<Badge
					badgeContent={unreadCount}
					color="error"
					max={99}
					sx={{
						"& .MuiBadge-badge": {
							right: 4,
							top: 4,
							fontSize: "0.65rem",
							height: 18,
							minWidth: 18,
						},
					}}
				>
					<IconButton onClick={() => setOpen(true)} ref={popoverRef}>
						<BellIcon />
					</IconButton>
				</Badge>
			</Tooltip>
			<Popover
				anchorEl={popoverRef.current}
				anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
				onClose={() => setOpen(false)}
				open={open}
				slotProps={{ paper: { sx: { width: "400px" } } }}
				transformOrigin={{ horizontal: "right", vertical: "top" }}
			>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
					<Typography variant="h6">Notifications</Typography>
				</Stack>
				<Divider />
				<Box sx={{ py: 4, textAlign: "center" }}>
					<Typography variant="body2" color="text.secondary">
						No notifications
					</Typography>
				</Box>
			</Popover>
		</React.Fragment>
	);
}
