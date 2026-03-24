import * as React from "react";
import { Outlet } from "react-router-dom";

export const route = {
	path: "custom",
	element: <Outlet />,
	children: [
		{
			path: "reset-password",
			lazy: async () => {
				const { Page } = await import("@/pages/auth/custom/reset-password");
				return { Component: Page };
			},
		},
		{
			path: "sign-in",
			lazy: async () => {
				const { Page } = await import("@/pages/auth/custom/sign-in");
				return { Component: Page };
			},
		},
		{
			path: "sign-up",
			lazy: async () => {
				const { Page } = await import("@/pages/auth/custom/sign-up");
				return { Component: Page };
			},
		},
	],
};
