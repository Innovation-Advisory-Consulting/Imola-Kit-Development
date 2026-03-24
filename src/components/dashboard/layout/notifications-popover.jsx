"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { BellIcon } from "@phosphor-icons/react/dist/ssr/Bell";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";
import { InfoIcon } from "@phosphor-icons/react/dist/ssr/Info";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { useNavigate } from "react-router-dom";

import { dayjs } from "@/lib/dayjs";
import { useAuth } from "@/auth/AuthContext";
import { useSalesforceClient } from "@/hooks/use-salesforce";

const typeConfig = {
	Info: { icon: InfoIcon, color: "info" },
	Warning: { icon: WarningIcon, color: "warning" },
	Success: { icon: CheckCircleIcon, color: "success" },
	Error: { icon: WarningCircleIcon, color: "error" },
	"Action Required": { icon: BellIcon, color: "warning" },
};

export function useNotifications() {
	const [notifications, setNotifications] = React.useState([]);
	const [unreadCount, setUnreadCount] = React.useState(0);
	const client = useSalesforceClient();
	const { auth } = useAuth();
	const userId = auth?.user?.id;

	const fetchNotifications = React.useCallback(async () => {
		if (!client || !userId) return;
		try {
			const records = await client.getNotifications(userId);
			setNotifications(records);
			setUnreadCount(records.filter((n) => !n.cux_Is_Read__c).length);
		} catch (err) {
			console.error("Failed to fetch notifications:", err);
		}
	}, [client, userId]);

	React.useEffect(() => {
		fetchNotifications();
		const interval = setInterval(fetchNotifications, 45000);
		return () => clearInterval(interval);
	}, [fetchNotifications]);

	const markAsRead = React.useCallback(
		async (notificationId) => {
			if (!client) return;
			await client.markNotificationRead(notificationId);
			setNotifications((prev) =>
				prev.map((n) => (n.Id === notificationId ? { ...n, cux_Is_Read__c: true } : n))
			);
			setUnreadCount((prev) => Math.max(0, prev - 1));
		},
		[client]
	);

	const markAllAsRead = React.useCallback(async () => {
		if (!client || !userId) return;
		await client.markAllNotificationsRead(userId);
		setNotifications((prev) => prev.map((n) => ({ ...n, cux_Is_Read__c: true })));
		setUnreadCount(0);
	}, [client, userId]);

	const removeOne = React.useCallback(
		async (notificationId) => {
			if (!client) return;
			const notification = notifications.find((n) => n.Id === notificationId);
			await client.deleteNotification(notificationId);
			setNotifications((prev) => prev.filter((n) => n.Id !== notificationId));
			if (notification && !notification.cux_Is_Read__c) {
				setUnreadCount((prev) => Math.max(0, prev - 1));
			}
		},
		[client, notifications]
	);

	return { notifications, unreadCount, markAsRead, markAllAsRead, removeOne, refetch: fetchNotifications };
}

export function NotificationsButton() {
	const popoverRef = React.useRef(null);
	const [open, setOpen] = React.useState(false);
	const { notifications, unreadCount, markAsRead, markAllAsRead, removeOne } = useNotifications();

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
			<NotificationsPopover
				anchorEl={popoverRef.current}
				onClose={() => setOpen(false)}
				open={open}
				notifications={notifications}
				unreadCount={unreadCount}
				onMarkAllAsRead={markAllAsRead}
				onMarkAsRead={markAsRead}
				onRemoveOne={removeOne}
			/>
		</React.Fragment>
	);
}

function NotificationsPopover({ anchorEl, onClose, open = false, notifications, unreadCount, onMarkAllAsRead, onMarkAsRead, onRemoveOne }) {
	const navigate = useNavigate();

	function handleClick(notification) {
		if (!notification.cux_Is_Read__c) {
			onMarkAsRead(notification.Id);
		}
		if (notification.cux_Link__c) {
			onClose();
			navigate(notification.cux_Link__c);
		}
	}

	return (
		<Popover
			anchorEl={anchorEl}
			anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
			onClose={onClose}
			open={open}
			slotProps={{ paper: { sx: { width: "400px" } } }}
			transformOrigin={{ horizontal: "right", vertical: "top" }}
		>
			<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
				<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
					<Typography variant="h6">Notifications</Typography>
					{unreadCount > 0 ? <Chip label={unreadCount} size="small" color="error" /> : null}
				</Stack>
				{unreadCount > 0 ? (
					<Tooltip title="Mark all as read">
						<IconButton edge="end" onClick={onMarkAllAsRead} size="small">
							<EnvelopeSimpleIcon />
						</IconButton>
					</Tooltip>
				) : null}
			</Stack>
			<Divider />
			{notifications.length === 0 ? (
				<Box sx={{ py: 4, textAlign: "center" }}>
					<Typography variant="body2" color="text.secondary">
						No notifications
					</Typography>
				</Box>
			) : (
				<Box sx={{ maxHeight: "360px", overflowY: "auto" }}>
					<List disablePadding>
						{notifications.map((notification, index) => {
							const config = typeConfig[notification.cux_Type__c] || typeConfig.Info;
							const Icon = config.icon;
							const color = config.color;

							return (
								<React.Fragment key={notification.Id}>
									{index > 0 ? <Divider /> : null}
									<ListItem
										disablePadding
										secondaryAction={
											<Tooltip title="Remove">
												<IconButton
													edge="end"
													onClick={(e) => {
														e.stopPropagation();
														onRemoveOne(notification.Id);
													}}
													size="small"
												>
													<TrashIcon fontSize="var(--icon-fontSize-sm)" />
												</IconButton>
											</Tooltip>
										}
									>
										<ListItemButton
											onClick={() => handleClick(notification)}
											sx={{
												py: 1.5,
												px: 2,
												bgcolor: notification.cux_Is_Read__c ? "transparent" : "var(--mui-palette-action-hover)",
											}}
										>
											<Avatar
												sx={{
													bgcolor: `var(--mui-palette-${color}-50)`,
													color: `var(--mui-palette-${color}-main)`,
													width: 36,
													height: 36,
													mr: 1.5,
												}}
											>
												<Icon fontSize="var(--icon-fontSize-md)" />
											</Avatar>
											<ListItemText
												primary={notification.cux_Title__c}
												secondary={
													<React.Fragment>
														{notification.cux_Message__c ? (
															<Typography variant="caption" component="span" display="block" color="text.secondary">
																{notification.cux_Message__c}
															</Typography>
														) : null}
														<Typography variant="caption" component="span" color="text.disabled">
															{dayjs(notification.CreatedDate).fromNow()}
														</Typography>
													</React.Fragment>
												}
												primaryTypographyProps={{
													variant: "subtitle2",
													sx: { fontWeight: notification.cux_Is_Read__c ? 400 : 600 },
												}}
											/>
										</ListItemButton>
									</ListItem>
								</React.Fragment>
							);
						})}
					</List>
				</Box>
			)}
		</Popover>
	);
}
