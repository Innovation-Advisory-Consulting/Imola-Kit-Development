import { AuthStrategy } from "@/lib/auth-strategy";
import { LogLevel } from "@/lib/logger";

export const appConfig = {
	name: "Imola Kit",
	description: "",
	direction: "ltr",
	language: "en",
	theme: "light",
	themeColor: "#2669b3",
	primaryColor: "cloud",
	logLevel: import.meta.env.VITE_LOG_LEVEL || LogLevel.ALL,
	authStrategy: import.meta.env.VITE_AUTH_STRATEGY || AuthStrategy.NONE,
};
