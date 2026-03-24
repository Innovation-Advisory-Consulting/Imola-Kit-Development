import * as React from "react";
import { Outlet } from "react-router-dom";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Layout as ChatLayout } from "@/components/dashboard/chat/layout";
import { Layout as JobCompanyLayout } from "@/components/dashboard/jobs/company-layout";
import { Layout as DashboardLayout } from "@/components/dashboard/layout/layout";
import { Layout as MailLayout } from "@/components/dashboard/mail/layout";
import { Layout as SettingsLayout } from "@/components/dashboard/settings/layout";
import { Layout as SocialProfileLayout } from "@/components/dashboard/social/profile-layout";

export const route = {
	path: "dashboard",
	element: (
		<AuthGuard>
			<DashboardLayout>
				<Outlet />
			</DashboardLayout>
		</AuthGuard>
	),
	children: [
		{
			index: true,
			lazy: async () => {
				const { Page } = await import("@/pages/dashboard/overview");
				return { Component: Page };
			},
		},
		{
			path: "my-day",
			lazy: async () => {
				const { Page } = await import("@/pages/dashboard/my-day");
				return { Component: Page };
			},
		},
		{
			path: "work-queue",
			lazy: async () => {
				const { Page } = await import("@/pages/dashboard/work-queue");
				return { Component: Page };
			},
		},
		{
			path: "team-monitor",
			lazy: async () => {
				const { Page } = await import("@/pages/dashboard/team-monitor");
				return { Component: Page };
			},
		},
		{
			path: "academy",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/academy/browse");
						return { Component: Page };
					},
				},
				{
					path: "courses/:courseId",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/academy/courses/details");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "analytics",
			lazy: async () => {
				const { Page } = await import("@/pages/dashboard/analytics");
				return { Component: Page };
			},
		},
		{
			path: "blank",
			lazy: async () => {
				const { Page } = await import("@/pages/dashboard/blank");
				return { Component: Page };
			},
		},
		{
			path: "blog",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/blog/list");
						return { Component: Page };
					},
				},
				{
					path: "create",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/blog/create");
						return { Component: Page };
					},
				},
				{
					path: ":postId",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/blog/details");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "calendar",
			lazy: async () => {
				const { Page } = await import("@/pages/dashboard/calendar");
				return { Component: Page };
			},
		},
		{
			path: "chat",
			element: (
				<ChatLayout>
					<Outlet />
				</ChatLayout>
			),
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/chat/blank");
						return { Component: Page };
					},
				},
				{
					path: "compose",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/chat/compose");
						return { Component: Page };
					},
				},
				{
					path: ":threadType/:threadId",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/chat/thread");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "crypto",
			lazy: async () => {
				const { Page } = await import("@/pages/dashboard/crypto");
				return { Component: Page };
			},
		},
		{
			path: "contracts",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/contracts/list");
						return { Component: Page };
					},
				},
				{
					path: "create",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/contracts/create");
						return { Component: Page };
					},
				},
				{
					path: ":contractId",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/contracts/details");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "funding",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/funding/list");
						return { Component: Page };
					},
				},
				{
					path: ":fundId",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/funding/details");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "reports",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/reports/overview");
						return { Component: Page };
					},
				},
				{
					path: "funding-by-period",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/reports/funding-by-period");
						return { Component: Page };
					},
				},
				{
					path: "contract-portfolio",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/reports/contract-portfolio");
						return { Component: Page };
					},
				},
				{
					path: "task-order-execution",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/reports/task-order-execution");
						return { Component: Page };
					},
				},
				{
					path: "invoice-tracking",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/reports/invoice-tracking");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "reference-data",
			children: [
				{
					path: "business-units",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/reference-data/business-units");
						return { Component: Page };
					},
				},
				{
					path: "funding-codes",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/reference-data/funding-codes");
						return { Component: Page };
					},
				},
				{
					path: "amendment-reasons",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/reference-data/amendment-reasons");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "validations",
			children: [
				{
					path: "profiles",
					children: [
						{
							index: true,
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/validations/profiles/list");
								return { Component: Page };
							},
						},
						{
							path: "create",
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/validations/profiles/create");
								return { Component: Page };
							},
						},
						{
							path: ":profileId",
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/validations/profiles/details");
								return { Component: Page };
							},
						},
					],
				},
				{
					path: "task-sets",
					children: [
						{
							index: true,
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/validations/task-sets/list");
								return { Component: Page };
							},
						},
						{
							path: "create",
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/validations/task-sets/create");
								return { Component: Page };
							},
						},
						{
							path: ":taskSetId",
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/validations/task-sets/details");
								return { Component: Page };
							},
						},
					],
				},
				{
					path: "rule-sets",
					children: [
						{
							index: true,
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/validations/rule-sets/list");
								return { Component: Page };
							},
						},
						{
							path: "create",
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/validations/rule-sets/create");
								return { Component: Page };
							},
						},
						{
							path: ":ruleSetId",
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/validations/rule-sets/details");
								return { Component: Page };
							},
						},
					],
				},
				{
					path: "requests",
					children: [
						{
							index: true,
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/validations/requests/list");
								return { Component: Page };
							},
						},
						{
							path: ":requestId",
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/validations/requests/details");
								return { Component: Page };
							},
						},
					],
				},
			],
		},
		{
			path: "task-orders",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/task-orders/list");
						return { Component: Page };
					},
				},
				{
					path: "create",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/task-orders/create");
						return { Component: Page };
					},
				},
				{
					path: ":taskOrderId",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/task-orders/details");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "cases",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/cases/list");
						return { Component: Page };
					},
				},
				{
					path: "create",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/cases/create");
						return { Component: Page };
					},
				},
				{
					path: ":caseId",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/cases/details");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "timesheets",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/timesheets/list");
						return { Component: Page };
					},
				},
				{
					path: "create",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/timesheets/create");
						return { Component: Page };
					},
				},
				{
					path: ":timesheetId",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/timesheets/details");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "customers",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/customers/list");
						return { Component: Page };
					},
				},
				{
					path: "create",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/customers/create");
						return { Component: Page };
					},
				},
				{
					path: ":customerId",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/customers/details");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "e-commerce",
			lazy: async () => {
				const { Page } = await import("@/pages/dashboard/e-commerce");
				return { Component: Page };
			},
		},
		{
			path: "file-storage",
			lazy: async () => {
				const { Page } = await import("@/pages/dashboard/file-storage");
				return { Component: Page };
			},
		},
		{
			path: "i18n",
			lazy: async () => {
				const { Page } = await import("@/pages/dashboard/i18n");
				return { Component: Page };
			},
		},
		{
			path: "invoices",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/invoices/list");
						return { Component: Page };
					},
				},
				{
					path: "create",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/invoices/create");
						return { Component: Page };
					},
				},
				{
					path: ":invoiceId",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/invoices/details");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "amendments",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/amendments/list");
						return { Component: Page };
					},
				},
				{
					path: ":amendmentId",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/amendments/details");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "supplements",
			children: [
				{
					path: ":supplementId",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/supplements/details");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "terminations",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/terminations/list");
						return { Component: Page };
					},
				},
				{
					path: ":terminationId",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/terminations/details");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "settlements",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/settlements/list");
						return { Component: Page };
					},
				},
				{
					path: ":settlementId",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/settlements/details");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "jobs",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/jobs/browse");
						return { Component: Page };
					},
				},
				{
					path: "create",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/jobs/create");
						return { Component: Page };
					},
				},
				{
					path: "companies/:companyId",
					element: (
						<JobCompanyLayout>
							<Outlet />
						</JobCompanyLayout>
					),
					children: [
						{
							index: true,
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/jobs/company/details");
								return { Component: Page };
							},
						},
						{
							path: "activity",
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/jobs/company/activity");
								return { Component: Page };
							},
						},
						{
							path: "assets",
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/jobs/company/assets");
								return { Component: Page };
							},
						},
						{
							path: "reviews",
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/jobs/company/reviews");
								return { Component: Page };
							},
						},
						{
							path: "team",
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/jobs/company/team");
								return { Component: Page };
							},
						},
					],
				},
			],
		},
		{
			path: "logistics",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/logistics/metrics");
						return { Component: Page };
					},
				},
				{
					path: "fleet",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/logistics/fleet");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "mail",
			element: (
				<MailLayout>
					<Outlet />
				</MailLayout>
			),
			children: [
				{
					path: ":labelId",
					children: [
						{
							index: true,
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/mail/threads");
								return { Component: Page };
							},
						},
						{
							path: ":threadId",
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/mail/thread");
								return { Component: Page };
							},
						},
					],
				},
			],
		},
		{
			path: "orders",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/orders/list");
						return { Component: Page };
					},
				},
				{
					path: "create",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/orders/create");
						return { Component: Page };
					},
				},
				{
					path: ":orderId",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/orders/details");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "products",
			children: [
				{
					index: true,
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/products/list");
						return { Component: Page };
					},
				},
				{
					path: "create",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/products/create");
						return { Component: Page };
					},
				},
				{
					path: ":productId",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/products/details");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "settings",
			element: (
				<SettingsLayout>
					<Outlet />
				</SettingsLayout>
			),
			children: [
				{
					path: "account",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/settings/account");
						return { Component: Page };
					},
				},
				{
					path: "notifications",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/settings/notifications");
						return { Component: Page };
					},
				},
				{
					path: "preferences",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/settings/preferences");
						return { Component: Page };
					},
				},
				{
					path: "security",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/settings/security");
						return { Component: Page };
					},
				},
				{
					path: "team",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/settings/team");
						return { Component: Page };
					},
				},
				{
					path: "integrations",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/settings/integrations");
						return { Component: Page };
					},
				},
			],
		},
		{
			path: "social",
			children: [
				{
					path: "feed",
					lazy: async () => {
						const { Page } = await import("@/pages/dashboard/social/feed");
						return { Component: Page };
					},
				},
				{
					path: "profile",
					element: (
						<SocialProfileLayout>
							<Outlet />
						</SocialProfileLayout>
					),
					children: [
						{
							index: true,
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/social/timeline");
								return { Component: Page };
							},
						},
						{
							path: "connections",
							lazy: async () => {
								const { Page } = await import("@/pages/dashboard/social/connections");
								return { Component: Page };
							},
						},
					],
				},
			],
		},
		{
			path: "tasks",
			lazy: async () => {
				const { Page } = await import("@/pages/dashboard/tasks");
				return { Component: Page };
			},
		},
	],
};
