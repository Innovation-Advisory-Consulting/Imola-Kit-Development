import * as React from "react";
import Box from "@mui/material/Box";

export function Message({ content }) {
	// Check if content is HTML (from Dataverse emails)
	const isHtml = /<[a-z][\s\S]*>/i.test(content || "");

	return (
		<Box
			sx={{
				"& h2": { fontWeight: 500, fontSize: "1.5rem", lineHeight: 1.2, mb: 3 },
				"& h3": { fontWeight: 500, fontSize: "1.25rem", lineHeight: 1.2, mb: 3 },
				"& p": { fontWeight: 400, fontSize: "1rem", lineHeight: 1.5, mb: 2, mt: 0 },
				"& a": { color: "var(--mui-palette-primary-main)" },
			}}
		>
			{isHtml ? (
				<div dangerouslySetInnerHTML={{ __html: content }} />
			) : (
				<p style={{ whiteSpace: "pre-wrap" }}>{content}</p>
			)}
		</Box>
	);
}
