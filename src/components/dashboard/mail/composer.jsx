"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Input from "@mui/material/Input";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ArrowsInSimpleIcon } from "@phosphor-icons/react/dist/ssr/ArrowsInSimple";
import { ArrowsOutSimpleIcon } from "@phosphor-icons/react/dist/ssr/ArrowsOutSimple";
import { ImageIcon } from "@phosphor-icons/react/dist/ssr/Image";
import { PaperclipIcon } from "@phosphor-icons/react/dist/ssr/Paperclip";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";

import { sendEmail } from "@/lib/dataverse/client";
import { toast } from "@/components/core/toaster";
import { TextEditor } from "@/components/core/text-editor/text-editor";

export function Composer({ onClose, open }) {
	const [isMaximized, setIsMaximized] = React.useState(false);
	const [message, setMessage] = React.useState("");
	const [subject, setSubject] = React.useState("");
	const [to, setTo] = React.useState("");
	const [sending, setSending] = React.useState(false);

	const handleSubjectChange = React.useCallback((event) => {
		setSubject(event.target.value);
	}, []);

	const handleMessageChange = React.useCallback(({ editor }) => {
		setMessage(editor.getHTML());
	}, []);

	const handleToChange = React.useCallback((event) => {
		setTo(event.target.value);
	}, []);

	const handleSend = React.useCallback(async () => {
		if (!to.trim() || !subject.trim()) {
			toast.error("Please fill in the To and Subject fields");
			return;
		}

		setSending(true);

		try {
			const recipients = to
				.split(/[,;]/)
				.map((email) => email.trim())
				.filter(Boolean)
				.map((email) => ({ email, name: email.split("@")[0] }));

			await sendEmail({
				to: recipients,
				subject: subject.trim(),
				body: message,
			});

			toast.success("Email sent successfully");
			setTo("");
			setSubject("");
			setMessage("");
			onClose?.();
		} catch (error) {
			console.error("[Mail] Send error:", error);
			toast.error(error.message || "Failed to send email");
		} finally {
			setSending(false);
		}
	}, [to, subject, message, onClose]);

	if (!open) {
		return null;
	}

	return (
		<Paper
			sx={{
				border: "1px solid var(--mui-palette-divider)",
				bottom: 0,
				boxShadow: "var(--mui-shadows-16)",
				height: "600px",
				m: 2,
				maxWidth: "100%",
				position: "fixed",
				right: 0,
				width: "600px",
				zIndex: "var(--mui-zIndex-modal)",
				...(isMaximized && { borderRadius: 0, height: "100%", left: 0, m: 0, top: 0, width: "100%" }),
			}}
		>
			<Stack direction="row" spacing={1} sx={{ alignItems: "center", display: "flex", p: 2 }}>
				<Box sx={{ flex: "1 1 auto" }}>
					<Typography variant="h6">New message</Typography>
				</Box>
				{isMaximized ? (
					<IconButton onClick={() => setIsMaximized(false)}>
						<ArrowsInSimpleIcon />
					</IconButton>
				) : (
					<IconButton onClick={() => setIsMaximized(true)}>
						<ArrowsOutSimpleIcon />
					</IconButton>
				)}
				<IconButton onClick={onClose}>
					<XIcon />
				</IconButton>
			</Stack>
			<div>
				<Input onChange={handleToChange} placeholder="To (separate multiple with commas)" value={to} />
				<Divider />
				<Input onChange={handleSubjectChange} placeholder="Subject" value={subject} />
				<Divider />
				<Box sx={{ "& .tiptap-root": { border: "none", borderRadius: 0 }, "& .tiptap-container": { height: "300px" } }}>
					<TextEditor content={message} onUpdate={handleMessageChange} placeholder="Write your message..." />
				</Box>
				<Divider />
				<Stack direction="row" spacing={3} sx={{ alignItems: "center", justifyContent: "space-between", p: 2 }}>
					<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
						<Tooltip title="Attach image">
							<IconButton>
								<ImageIcon />
							</IconButton>
						</Tooltip>
						<Tooltip title="Attach file">
							<IconButton>
								<PaperclipIcon />
							</IconButton>
						</Tooltip>
					</Stack>
					<div>
						<Button
							variant="contained"
							onClick={handleSend}
							disabled={sending || !to.trim()}
							startIcon={sending ? <CircularProgress size={16} color="inherit" /> : null}
						>
							{sending ? "Sending..." : "Send"}
						</Button>
					</div>
				</Stack>
			</div>
		</Paper>
	);
}
