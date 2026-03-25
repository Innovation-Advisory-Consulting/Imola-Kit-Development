"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { CameraIcon } from "@phosphor-icons/react/dist/ssr/Camera";
import { PaperclipIcon } from "@phosphor-icons/react/dist/ssr/Paperclip";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr/PaperPlaneTilt";

import { useRecentRecords } from "@/contexts/recent-records-context";

const labelColors = {
	Contract: "primary",
	"Task Order": "info",
	Invoice: "warning",
	Amendment: "secondary",
	Fund: "success",
};

export function MessageAdd({ disabled = false, onSend }) {
	const [content, setContent] = React.useState("");
	const [attachedRecords, setAttachedRecords] = React.useState([]);
	const fileInputRef = React.useRef(null);
	const { records: recentRecords } = useRecentRecords();
	const currentUser = { name: "Sofia Rivers", avatar: "/assets/avatar.png" };

	const handleAttach = React.useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleChange = React.useCallback((event) => {
		setContent(event.target.value);
	}, []);

	const handleSend = React.useCallback(() => {
		if (!content && attachedRecords.length === 0) return;

		let message = content;
		if (attachedRecords.length > 0) {
			const refs = attachedRecords
				.map((r) => `[${r.label}: ${r.name}](${window.location.origin}${r.path})`)
				.join("  \n");
			message = content ? `${content}\n\n${refs}` : refs;
		}

		onSend?.("text", message);
		setContent("");
		setAttachedRecords([]);
	}, [content, attachedRecords, onSend]);

	const handleKeyUp = React.useCallback(
		(event) => {
			if (event.code === "Enter") {
				handleSend();
			}
		},
		[handleSend]
	);

	const handlePinRecord = React.useCallback((record) => {
		setAttachedRecords((prev) => {
			if (prev.find((r) => r.id === record.id)) return prev;
			return [...prev, record];
		});
	}, []);

	const handleRemoveAttached = React.useCallback((id) => {
		setAttachedRecords((prev) => prev.filter((r) => r.id !== id));
	}, []);

	return (
		<Box>
			{/* Recent record shortcuts */}
			{recentRecords.length > 0 && (
				<Box sx={{ px: 3, pt: 1, pb: 0.5 }}>
					<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
						<Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
							Recent:
						</Typography>
						{recentRecords.map((record) => (
							<Chip
								key={record.id}
								label={`${record.label}: ${record.name}`}
								size="small"
								color={labelColors[record.label] || "default"}
								variant="outlined"
								onClick={() => handlePinRecord(record)}
								sx={{ cursor: "pointer" }}
							/>
						))}
					</Stack>
				</Box>
			)}

			{/* Attached records */}
			{attachedRecords.length > 0 && (
				<Box sx={{ px: 3, pb: 0.5 }}>
					<Stack direction="row" spacing={1} flexWrap="wrap">
						{attachedRecords.map((record) => (
							<Chip
								key={record.id}
								label={`${record.label}: ${record.name}`}
								size="small"
								color={labelColors[record.label] || "default"}
								variant="soft"
								onDelete={() => handleRemoveAttached(record.id)}
							/>
						))}
					</Stack>
				</Box>
			)}

			<Stack direction="row" spacing={2} sx={{ alignItems: "center", flex: "0 0 auto", px: 3, py: 1 }}>
				<Avatar src={currentUser?.avatar} sx={{ display: { xs: "none", sm: "inline" } }}>{currentUser?.name?.[0]}</Avatar>
				<OutlinedInput
					disabled={disabled}
					onChange={handleChange}
					onKeyUp={handleKeyUp}
					placeholder="Leave a message"
					sx={{ flex: "1 1 auto" }}
					value={content}
				/>
				<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
					<Tooltip title="Send">
						<span>
							<IconButton
								color="primary"
								disabled={(!content && attachedRecords.length === 0) || disabled}
								onClick={handleSend}
								sx={{
									bgcolor: "var(--mui-palette-primary-main)",
									color: "var(--mui-palette-primary-contrastText)",
									"&:hover": { bgcolor: "var(--mui-palette-primary-dark)" },
								}}
							>
								<PaperPlaneTiltIcon />
							</IconButton>
						</span>
					</Tooltip>
					<Stack direction="row" spacing={1} sx={{ display: { xs: "none", sm: "flex" } }}>
						<Tooltip title="Attach photo">
							<span>
								<IconButton disabled={disabled} edge="end" onClick={handleAttach}>
									<CameraIcon />
								</IconButton>
							</span>
						</Tooltip>
						<Tooltip title="Attach file">
							<span>
								<IconButton disabled={disabled} edge="end" onClick={handleAttach}>
									<PaperclipIcon />
								</IconButton>
							</span>
						</Tooltip>
					</Stack>
				</Stack>
				<input hidden ref={fileInputRef} type="file" />
			</Stack>
		</Box>
	);
}
