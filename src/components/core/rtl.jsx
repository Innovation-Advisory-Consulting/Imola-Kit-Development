"use client";

import * as React from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import stylisRTLPlugin from "stylis-plugin-rtl";

import { appConfig } from "@/config/app";
import { useSettings } from "@/components/core/settings/settings-context";

function styleCache() {
	return createCache({ key: "mui-rtl", prepend: true, stylisPlugins: [stylisRTLPlugin] });
}

export function Rtl({ children }) {
	const { settings } = useSettings();
	const direction = settings.direction ?? appConfig.direction;

	React.useEffect(() => {
		document.dir = direction;
	}, [direction]);

	if (direction === "rtl") {
		return <CacheProvider value={styleCache()}>{children}</CacheProvider>;
	}

	return <React.Fragment>{children}</React.Fragment>;
}
