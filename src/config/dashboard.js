import { paths } from "@/paths";

export const dashboardConfig = {
	layout: "vertical",
	navColor: "evident",
	navItems: [
		{
			key: "work",
			title: "Work",
			items: [
				{ key: "my-day", title: "My Day", href: paths.dashboard.myDay, icon: "calendar-check" },
				{ key: "work-queue", title: "Work Queue", href: paths.dashboard.workQueue, icon: "kanban" },
				{ key: "team-monitor", title: "Team Monitor", href: paths.dashboard.teamMonitor, icon: "users" },
			],
		},
		{
			key: "dashboards",
			title: "Dashboards",
			items: [
				{ key: "overview", title: "Overview", href: paths.dashboard.overview, icon: "house" },
			],
		},
		{
			key: "contract-management",
			title: "Contract Management",
			items: [
				{
					key: "contracts",
					title: "Contracts",
					icon: "file-text",
					items: [
						{ key: "contracts:list", title: "All contracts", href: paths.dashboard.contracts.list },
						{ key: "contracts:create", title: "New contract", href: paths.dashboard.contracts.create },
					],
				},
				{
					key: "task-orders",
					title: "Task Orders",
					icon: "clipboard-text",
					items: [
						{ key: "task-orders:list", title: "All task orders", href: paths.dashboard.taskOrders.list },
					],
				},
				{
					key: "amendments",
					title: "Amendments",
					icon: "note-pencil",
					items: [
						{ key: "amendments:list", title: "All amendments", href: paths.dashboard.amendments.list },
					],
				},
				{
					key: "invoices",
					title: "Invoices",
					icon: "receipt",
					items: [
						{ key: "invoices:list", title: "All invoices", href: paths.dashboard.invoices.list },
					],
				},
				{
					key: "terminations",
					title: "Terminations",
					icon: "prohibit",
					items: [
						{ key: "terminations:list", title: "All terminations", href: paths.dashboard.terminations.list },
					],
				},
				{
					key: "settlements",
					title: "Settlements",
					icon: "scales",
					items: [
						{ key: "settlements:list", title: "All settlements", href: paths.dashboard.settlements.list },
					],
				},
				{
					key: "vendors",
					title: "Vendors",
					icon: "buildings",
					items: [
						{ key: "vendors:list", title: "All vendors", href: paths.dashboard.customers.list },
						{ key: "vendors:create", title: "New vendor", href: paths.dashboard.customers.create },
					],
				},
				{
					key: "funding",
					title: "Funds",
					href: paths.dashboard.funding.list,
					icon: "currency-dollar",
				},
			],
		},
		{
			key: "reports",
			title: "Reports",
			items: [
				{
					key: "reports",
					title: "Reports",
					icon: "chart-bar",
					items: [
						{ key: "reports:overview", title: "Overview", href: paths.dashboard.reports.overview },
						{ key: "reports:funding-by-period", title: "Funding by Period", href: paths.dashboard.reports.fundingByPeriod },
					],
				},
			],
		},
		{
			key: "administration",
			title: "Administration",
			items: [
				{
					key: "validations",
					title: "Validations",
					icon: "shield-check",
					items: [
						{ key: "validations:profiles", title: "Profiles", href: paths.dashboard.validations.profiles.list },
						{ key: "validations:task-sets", title: "Task Sets", href: paths.dashboard.validations.taskSets.list },
						{ key: "validations:rule-sets", title: "Rule Sets", href: paths.dashboard.validations.ruleSets.list },
						{ key: "validations:requests", title: "Requests", href: paths.dashboard.validations.requests.list },
					],
				},
				{
					key: "reference-data",
					title: "Reference Data",
					icon: "database",
					items: [
						{ key: "ref:business-units", title: "Business Units", href: paths.dashboard.referenceData.businessUnits },
						{ key: "ref:funding-codes", title: "Funding Codes", href: paths.dashboard.referenceData.fundingCodes },
						{ key: "ref:amendment-reasons", title: "Amendment Reasons", href: paths.dashboard.referenceData.amendmentReasons },
					],
				},
				{
					key: "settings",
					title: "Settings",
					href: paths.dashboard.settings.account,
					icon: "gear",
					matcher: { type: "startsWith", href: "/dashboard/settings" },
				},
			],
		},
		{
			key: "communication",
			title: "Communication",
			items: [
				{
					key: "chat",
					title: "RainierAI Chat",
					href: paths.dashboard.chat.base,
					icon: "chats-circle",
					matcher: { type: "startsWith", href: "/dashboard/chat" },
				},
			],
		},
	],
};
