import * as React from "react";
import { Outlet } from "react-router-dom";

export const route = {
	path: "azure-ad",
	element: <Outlet />,
	children: [
		{
			path: "callback",
			lazy: async () => {
				const { Page } = await import("@/pages/auth/azure-ad/callback");
				return { Component: Page };
			},
		},
	],
};
