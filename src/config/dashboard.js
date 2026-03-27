import { paths } from "@/paths";

export const dashboardConfig = {
	layout: "vertical",
	navColor: "evident",
	navItems: [
		{
			key: "dashboards",
			title: "Dashboards",
			items: [
				{ key: "overview", title: "Overview", href: paths.dashboard.overview, icon: "house" },
				{ key: "analytics", title: "Analytics", href: paths.dashboard.analytics, icon: "chart-pie" },
				{ key: "e-commerce", title: "E-Commerce", href: paths.dashboard.eCommerce, icon: "shopping-cart-simple" },
				{ key: "logistics", title: "Logistics", href: paths.dashboard.logistics.metrics, icon: "truck" },
				{ key: "crypto", title: "Crypto", href: paths.dashboard.crypto, icon: "currency-btc" },
			],
		},
		{
			key: "general",
			title: "General",
			items: [
				{
					key: "customers",
					title: "Customers",
					icon: "users",
					items: [
						{ key: "customers:list", title: "List", href: paths.dashboard.customers.list },
						{ key: "customers:create", title: "Create", href: paths.dashboard.customers.create },
					],
				},
				{
					key: "products",
					title: "Products",
					icon: "package",
					items: [
						{ key: "products:list", title: "List", href: paths.dashboard.products.list },
						{ key: "products:create", title: "Create", href: paths.dashboard.products.create },
					],
				},
				{
					key: "orders",
					title: "Orders",
					icon: "clipboard-text",
					items: [
						{ key: "orders:list", title: "List", href: paths.dashboard.orders.list },
						{ key: "orders:create", title: "Create", href: paths.dashboard.orders.create },
					],
				},
				{
					key: "invoices",
					title: "Invoices",
					icon: "receipt",
					items: [
						{ key: "invoices:list", title: "List", href: paths.dashboard.invoices.list },
						{ key: "invoices:create", title: "Create", href: paths.dashboard.invoices.create },
					],
				},
				{
					key: "blog",
					title: "Blog",
					icon: "newspaper-clipping",
					items: [
						{ key: "blog:list", title: "List", href: paths.dashboard.blog.list },
						{ key: "blog:create", title: "Create", href: paths.dashboard.blog.create },
					],
				},
				{
					key: "jobs",
					title: "Jobs",
					icon: "read-cv-logo",
					items: [
						{ key: "jobs:browse", title: "Browse", href: paths.dashboard.jobs.browse },
						{ key: "jobs:create", title: "Create", href: paths.dashboard.jobs.create },
					],
				},
				{ key: "academy", title: "Academy", href: paths.dashboard.academy.browse, icon: "graduation-cap" },
				{ key: "tasks", title: "Tasks", href: paths.dashboard.tasks, icon: "kanban" },
				{ key: "calendar", title: "Calendar", href: paths.dashboard.calendar, icon: "calendar-check" },
				{ key: "file-storage", title: "Document Studio", href: paths.dashboard.fileStorage, icon: "upload-simple" },
			],
		},
		{
			key: "communication",
			title: "Communication",
			items: [
				{
					key: "chat",
					title: "Chat",
					href: paths.dashboard.chat.base,
					icon: "chats-circle",
					matcher: { type: "startsWith", href: "/dashboard/chat" },
				},
				{
					key: "mail",
					title: "Mail",
					href: paths.dashboard.mail.list("inbox"),
					icon: "envelope-simple",
					matcher: { type: "startsWith", href: "/dashboard/mail" },
				},
			],
		},
		{
			key: "settings",
			title: "Settings",
			items: [
				{
					key: "settings",
					title: "Settings",
					href: paths.dashboard.settings.account,
					icon: "gear",
					matcher: { type: "startsWith", href: "/dashboard/settings" },
				},
			],
		},
	],
};
