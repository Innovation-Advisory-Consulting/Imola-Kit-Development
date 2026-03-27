"use client";

import * as React from "react";
import { useParams } from "react-router-dom";

import { fetchEmails } from "@/lib/dataverse/client";
import { MailProvider } from "@/components/dashboard/mail/mail-context";
import { MailView } from "@/components/dashboard/mail/mail-view";

const labels = [
	{ id: "inbox", type: "system", name: "Inbox", unreadCount: 0, totalCount: 0 },
	{ id: "sent", type: "system", name: "Sent", unreadCount: 0, totalCount: 0 },
	{ id: "drafts", type: "system", name: "Drafts", unreadCount: 0, totalCount: 0 },
	{ id: "trash", type: "system", name: "Trash", unreadCount: 0, totalCount: 0 },
];

function mapEmailToThread(email) {
	const fromParty = email.email_activity_parties?.find((p) => p.participationtypemask === 1);
	const toParties = email.email_activity_parties?.filter((p) => p.participationtypemask === 2) || [];

	return {
		id: email.activityid,
		from: {
			name: fromParty?.addressused || "Unknown",
			email: fromParty?.addressused || "",
		},
		to: toParties.map((p) => ({
			name: p.addressused || "Unknown",
			email: p.addressused || "",
		})),
		subject: email.subject || "(No subject)",
		message: email.description || "",
		folder: email.directioncode ? "sent" : "inbox",
		labels: [],
		isImportant: false,
		isStarred: false,
		isUnread: email.statuscode === 4,
		createdAt: new Date(email.createdon),
	};
}

export function Layout({ children }) {
	const { labelId } = useParams();
	const [threads, setThreads] = React.useState([]);

	React.useEffect(() => {
		async function loadEmails() {
			try {
				const [inbox, sent] = await Promise.all([
					fetchEmails({ folder: "inbox" }),
					fetchEmails({ folder: "sent" }),
				]);
				const allThreads = [
					...inbox.map(mapEmailToThread),
					...sent.map(mapEmailToThread),
				];
				setThreads(allThreads);
			} catch (error) {
				console.error("[Mail] Failed to load emails:", error);
			}
		}

		loadEmails();
	}, []);

	const filteredThreads = threads.filter((thread) => {
		if (["inbox", "sent", "drafts", "trash"].includes(labelId)) {
			return thread.folder === labelId;
		}
		return false;
	});

	return (
		<MailProvider currentLabelId={labelId} labels={labels} threads={filteredThreads}>
			<MailView>{children}</MailView>
		</MailProvider>
	);
}
