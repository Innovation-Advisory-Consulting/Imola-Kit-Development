"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import { useColorScheme } from "@mui/material/styles";

import { NoSsr } from "@/components/core/no-ssr";

const HEIGHT = 80;
const WIDTH = 200;

export function Logo({ color = "dark", emblem, height = HEIGHT, width = WIDTH }) {
	let url;

	if (emblem) {
		url = "/assets/favicon.png";
	} else {
		url = color === "light" ? "/assets/Reinier-White.svg" : "/assets/Reinier-Black.svg";
	}

	return <Box alt="CloudCoro" component="img" src={url} sx={{ height, width: "auto", maxWidth: width }} />;
}

export function DynamicLogo({ colorDark = "light", colorLight = "dark", height = HEIGHT, width = WIDTH, ...props }) {
	const { colorScheme } = useColorScheme();
	const color = colorScheme === "dark" ? colorDark : colorLight;

	return (
		<NoSsr fallback={<Box sx={{ height: `${height}px`, width: `${width}px` }} />}>
			<Logo color={color} height={height} width={width} {...props} />
		</NoSsr>
	);
}
