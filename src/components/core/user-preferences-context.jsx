"use client";

import * as React from "react";

const STORAGE_KEY = "ik-user-preferences";

export const DASHBOARD_WIDGETS = [
	{ id: "summaryStrip", label: "Summary Strip", description: "Key metrics overview" },
	{ id: "recentActivity", label: "Recent Activity", description: "Latest activity feed" },
	{ id: "statusBreakdown", label: "Status Breakdown", description: "Chart of item statuses" },
	{ id: "performance", label: "Performance", description: "Performance metrics and trends" },
];

const defaultPreferences = {
	fontSize: "medium",
	translationLanguages: ["es", "fr"],
	density: "standard",
	animationsEnabled: true,
	aiTone: "formal",
	dashboardWidgetOrder: DASHBOARD_WIDGETS.map((w) => w.id),
	dashboardHiddenWidgets: [],
};

const fontSizeScales = {
	small: 0.875,
	medium: 1,
	large: 1.125,
	"extra-large": 1.25,
};

function loadPreferences() {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return { ...defaultPreferences, ...JSON.parse(stored) };
		}
	} catch {
		// ignore
	}
	return defaultPreferences;
}

function savePreferences(prefs) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
	} catch {
		// ignore
	}
}

const UserPreferencesContext = React.createContext({
	preferences: defaultPreferences,
	setPreference: () => {},
	fontSizeScale: 1,
});

export function UserPreferencesProvider({ children }) {
	const [preferences, setPreferences] = React.useState(loadPreferences);

	React.useEffect(() => {
		savePreferences(preferences);
	}, [preferences]);

	React.useEffect(() => {
		const scale = fontSizeScales[preferences.fontSize] || 1;
		document.documentElement.style.fontSize = `${scale * 16}px`;
		return () => {
			document.documentElement.style.fontSize = "";
		};
	}, [preferences.fontSize]);

	React.useEffect(() => {
		const densityScales = { compact: 0.75, standard: 1, comfortable: 1.35 };
		const scale = densityScales[preferences.density] || 1;
		document.documentElement.style.setProperty("--cc-density-scale", scale);
		document.documentElement.style.setProperty("--Content-padding", `${24 * scale}px ${24 * scale}px`);
		return () => {
			document.documentElement.style.removeProperty("--cc-density-scale");
			document.documentElement.style.removeProperty("--Content-padding");
		};
	}, [preferences.density]);

	const setPreference = React.useCallback((key, value) => {
		setPreferences((prev) => ({ ...prev, [key]: value }));
	}, []);

	const fontSizeScale = fontSizeScales[preferences.fontSize] || 1;

	const value = React.useMemo(
		() => ({ preferences, setPreference, fontSizeScale }),
		[preferences, setPreference, fontSizeScale]
	);

	return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>;
}

export function useUserPreferences() {
	return React.useContext(UserPreferencesContext);
}

export { fontSizeScales, defaultPreferences };

export const AVAILABLE_LANGUAGES = [
	{ code: "es", label: "Spanish", flag: "🇪🇸" },
	{ code: "fr", label: "French", flag: "🇫🇷" },
	{ code: "pt", label: "Portuguese", flag: "🇧🇷" },
	{ code: "de", label: "German", flag: "🇩🇪" },
	{ code: "it", label: "Italian", flag: "🇮🇹" },
	{ code: "zh", label: "Chinese", flag: "🇨🇳" },
	{ code: "ja", label: "Japanese", flag: "🇯🇵" },
	{ code: "ko", label: "Korean", flag: "🇰🇷" },
	{ code: "ar", label: "Arabic", flag: "🇸🇦" },
	{ code: "hi", label: "Hindi", flag: "🇮🇳" },
];
