import * as React from "react";

import { dayjs } from "@/lib/dayjs";
import { ChatProvider } from "@/components/dashboard/chat/chat-context";
import { ChatView } from "@/components/dashboard/chat/chat-view";

const contacts = [
	{
		id: "USR-AI",
		name: "AI Assistant",
		avatar: "/assets/avatar-ai.svg",
		isActive: true,
		lastActivity: dayjs().toDate(),
	},
];

const threads = [
	{
		id: "TRD-AI",
		type: "direct",
		participants: [
			{ id: "USR-000", name: "User" },
			{ id: "USR-AI", name: "AI Assistant", avatar: "/assets/avatar-ai.svg" },
		],
		unreadCount: 1,
	},
];

const messages = [
	{
		id: "MSG-AI-001",
		threadId: "TRD-AI",
		type: "text",
		content: "Hi! I'm your AI Assistant. I can help you with questions about Imola Kit and more. Ask me anything!",
		author: { id: "USR-AI", name: "AI Assistant", avatar: "/assets/avatar-ai.svg" },
		createdAt: dayjs().subtract(1, "minute").toDate(),
	},
];

export function Layout({ children }) {
	return (
		<ChatProvider contacts={contacts} messages={messages} threads={threads}>
			<ChatView>{children}</ChatView>
		</ChatProvider>
	);
}
