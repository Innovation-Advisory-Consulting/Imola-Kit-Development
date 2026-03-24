import { logger } from "@/lib/default-logger";

/**
 * Store settings in client's localStorage.
 * This should be used in Client Components.
 *
 * To remove a specific key, set its value to `null`.
 */
export function setSettings(settings) {
	globalThis.localStorage.setItem("settings", JSON.stringify(settings));
}

/*
 * Retrieve the settings from client's localStorage.
 * This should be used in Client Components.
 */
export function getSettings() {
	const settingsStr = globalThis.localStorage.getItem("settings");
	let settings;

	if (settingsStr) {
		try {
			settings = JSON.parse(settingsStr);
		} catch {
			logger.error("Unable to parse the settings");
		}
	}

	settings ||= {};

	return settings;
}
