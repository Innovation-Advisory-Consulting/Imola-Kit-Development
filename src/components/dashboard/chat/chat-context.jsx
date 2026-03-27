"use client";

import * as React from "react";


const AI_USER_ID = "USR-AI";
const AI_SYSTEM_PROMPT = `You are the Imola Kit AI Assistant, built into the Imola Kit platform.
You are friendly, concise, and professional. Keep responses short and actionable.

About Imola Kit:
- Imola Kit is a complete government technology platform designed for federal, state, and local government agencies.
- It features self-service portals, back-office management, and mobile applications for modern government teams.
- Key solutions include:
  - Citizen Self-Service Portal: 24/7 online access to government services, applications, and case status tracking.
  - Grants Management: End-to-end grant lifecycle management from application intake through compliance monitoring.
  - Licensing & Permits: Streamlined permit applications with automated review workflows and real-time status updates.
  - Mobile Field Apps: Native mobile apps for field staff with offline capabilities and real-time synchronization.
- The platform includes a Citizen Portal, Back Office System, and Mobile Field Apps as an integrated ecosystem.
- Imola Kit is trusted by government agencies nationwide with a 4.8/5 satisfaction rating.
- It includes comprehensive onboarding with role-based training, a self-service knowledge base, video tutorials, and dedicated support channels.

When users ask about Imola Kit, its features, or the platform, answer based on this information. For other questions, assist as a general helpful AI.`;

function noop() {
	// No operation
}

export const ChatContext = React.createContext({
	contacts: [],
	threads: [],
	messages: new Map(),
	createThread: noop,
	markAsRead: noop,
	createMessage: noop,
	openDesktopSidebar: true,
	setOpenDesktopSidebar: noop,
	openMobileSidebar: true,
	setOpenMobileSidebar: noop,
});

function isAiThread(threads, threadId) {
	const thread = threads.find((t) => t.id === threadId);
	if (!thread) return false;
	return thread.participants.some((p) => p.id === AI_USER_ID);
}

export function ChatProvider({
	children,
	contacts: initialContacts = [],
	threads: initialLabels = [],
	messages: initialMessages = [],
}) {
	const [contacts, setContacts] = React.useState([]);
	const [threads, setThreads] = React.useState([]);
	const [messages, setMessages] = React.useState(new Map());
	const [openDesktopSidebar, setOpenDesktopSidebar] = React.useState(true);
	const [openMobileSidebar, setOpenMobileSidebar] = React.useState(false);
	const currentUser = React.useMemo(
		() => ({
			id: "USR-000",
			name: "Sofia Rivers",
			avatar: "/assets/avatar.png",
		}),
		[]
	);

	React.useEffect(() => {
		setContacts(initialContacts);
	}, [initialContacts]);

	React.useEffect(() => {
		setThreads(initialLabels);
	}, [initialLabels]);

	React.useEffect(() => {
		setMessages(
			initialMessages.reduce((acc, curr) => {
				const byThread = acc.get(curr.threadId) ?? [];
				// We unshift the message to ensure the messages are sorted by date
				byThread.unshift(curr);
				acc.set(curr.threadId, byThread);
				return acc;
			}, new Map())
		);
	}, [initialMessages]);

	const handleCreateThread = React.useCallback(
		(params) => {
			// Check if the thread already exists
			let thread = threads.find((thread) => {
				if (params.type === "direct") {
					if (thread.type !== "direct") {
						return false;
					}

					return thread.participants
						.filter((participant) => participant.id !== currentUser.id)
						.find((participant) => participant.id === params.recipientId);
				}

				if (thread.type !== "group") {
					return false;
				}

				const recipientIds = thread.participants
					.filter((participant) => participant.id !== currentUser.id)
					.map((participant) => participant.id);

				if (params.recipientIds.length !== recipientIds.length) {
					return false;
				}

				return params.recipientIds.every((recipientId) => recipientIds.includes(recipientId));
			});

			if (thread) {
				return thread.id;
			}

			// Create a new thread

			const participants = [currentUser];

			if (params.type === "direct") {
				const contact = contacts.find((contact) => contact.id === params.recipientId);

				if (!contact) {
					throw new Error(`Contact with id "${params.recipientId}" not found`);
				}

				participants.push({ id: contact.id, name: contact.name, avatar: contact.avatar });
			} else {
				for (const recipientId of params.recipientIds) {
					const contact = contacts.find((contact) => contact.id === recipientId);

					if (!contact) {
						throw new Error(`Contact with id "${recipientId}" not found`);
					}

					participants.push({ id: contact.id, name: contact.name, avatar: contact.avatar });
				}
			}

			thread = { id: `TRD-${Date.now()}`, type: params.type, participants, unreadCount: 0 };

			// Add it to the threads
			const updatedThreads = [thread, ...threads];

			// Dispatch threads update
			setThreads(updatedThreads);

			return thread.id;
		},
		[contacts, threads, currentUser]
	);

	const handleMarkAsRead = React.useCallback(
		(threadId) => {
			const thread = threads.find((thread) => thread.id === threadId);

			if (!thread) {
				// Thread might no longer exist
				return;
			}

			const updatedThreads = threads.map((threadToUpdate) => {
				if (threadToUpdate.id !== threadId) {
					return threadToUpdate;
				}

				return { ...threadToUpdate, unreadCount: 0 };
			});

			// Dispatch threads update
			setThreads(updatedThreads);
		},
		[threads]
	);

	const addAiResponse = React.useCallback(
		async (threadId, userContent, currentMessages) => {
			// Build conversation history for context
			const threadMessages = currentMessages.get(threadId) ?? [];
			const history = threadMessages.slice(-10).map((m) => ({
				role: m.author.id === AI_USER_ID ? "assistant" : "user",
				content: m.content,
			}));

			// Add a typing indicator message
			const typingMsg = {
				id: `MSG-AI-TYPING`,
				threadId,
				type: "text",
				author: { id: AI_USER_ID, name: "AI Assistant", avatar: "/assets/avatar-ai.svg" },
				content: "Thinking...",
				createdAt: new Date(),
			};

			setMessages((prev) => {
				const updated = new Map(prev);
				const existing = updated.get(threadId) ?? [];
				updated.set(threadId, [...existing, typingMsg]);
				return updated;
			});

			try {
				const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
				const apiKey = import.meta.env.VITE_AZURE_OPENAI_KEY;
				const deployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || "gpt-4o";

				const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-06-01`;

				const response = await fetch(url, {
					method: "POST",
					headers: { "api-key": apiKey, "Content-Type": "application/json" },
					body: JSON.stringify({
						messages: [{ role: "system", content: AI_SYSTEM_PROMPT }, ...history],
						max_tokens: 1000,
						temperature: 0.7,
					}),
				});

				const data = await response.json();
				const aiContent = data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't process that request.";

				const aiMessage = {
					id: `MSG-AI-${Date.now()}`,
					threadId,
					type: "text",
					author: { id: AI_USER_ID, name: "AI Assistant", avatar: "/assets/avatar-ai.svg" },
					content: aiContent,
					createdAt: new Date(),
				};

				// Replace the typing indicator with the actual response
				setMessages((prev) => {
					const updated = new Map(prev);
					const existing = (updated.get(threadId) ?? []).filter((m) => m.id !== "MSG-AI-TYPING");
					updated.set(threadId, [...existing, aiMessage]);
					return updated;
				});
			} catch {
				const errorMessage = {
					id: `MSG-AI-ERR-${Date.now()}`,
					threadId,
					type: "text",
					author: { id: AI_USER_ID, name: "AI Assistant", avatar: "/assets/avatar-ai.svg" },
					content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
					createdAt: new Date(),
				};

				setMessages((prev) => {
					const updated = new Map(prev);
					const existing = (updated.get(threadId) ?? []).filter((m) => m.id !== "MSG-AI-TYPING");
					updated.set(threadId, [...existing, errorMessage]);
					return updated;
				});
			}
		},
		[]
	);

	const handleCreateMessage = React.useCallback(
		(params) => {
			const message = {
				id: `MSG-${Date.now()}`,
				threadId: params.threadId,
				type: params.type,
				author: currentUser,
				content: params.content,
				createdAt: new Date(),
			};

			const updatedMessages = new Map(messages);

			// Add it to the messages
			if (updatedMessages.has(params.threadId)) {
				updatedMessages.set(params.threadId, [...updatedMessages.get(params.threadId), message]);
			} else {
				updatedMessages.set(params.threadId, [message]);
			}

			// Dispatch messages update
			setMessages(updatedMessages);

			// If this is an AI thread, generate an AI response
			if (params.type === "text" && isAiThread(threads, params.threadId)) {
				addAiResponse(params.threadId, params.content, updatedMessages);
			}
		},
		[messages, threads, addAiResponse, currentUser]
	);

	return (
		<ChatContext.Provider
			value={{
				contacts,
				threads,
				messages,
				createThread: handleCreateThread,
				markAsRead: handleMarkAsRead,
				createMessage: handleCreateMessage,
				openDesktopSidebar,
				setOpenDesktopSidebar,
				openMobileSidebar,
				setOpenMobileSidebar,
			}}
		>
			{children}
		</ChatContext.Provider>
	);
}
