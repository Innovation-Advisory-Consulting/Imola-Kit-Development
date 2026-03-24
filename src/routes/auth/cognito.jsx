import * as React from "react";
import { Outlet } from "react-router-dom";

export const route = {
	path: "cognito",
	element: <Outlet />,
	children: [
		{
			path: "callback",
			lazy: async () => {
				const { Page } = await import("@/pages/auth/cognito/callback");
				return { Component: Page };
			},
		},
	],
};
