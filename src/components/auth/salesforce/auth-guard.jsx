"use client";

import * as React from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";

export function AuthGuard({ children }) {
	const { auth } = useAuth();

	if (!auth?.accessToken) {
		return <Navigate to="/login" replace />;
	}

	return <React.Fragment>{children}</React.Fragment>;
}
