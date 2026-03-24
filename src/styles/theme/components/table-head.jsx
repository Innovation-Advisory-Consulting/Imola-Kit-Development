import { tableCellClasses } from "@mui/material/TableCell";

export const MuiTableHead = {
	styleOverrides: {
		root: {
			[`& .${tableCellClasses.root}`]: {
				backgroundColor: "var(--mui-palette-background-level1)",
				color: "var(--mui-palette-text-secondary)",
				fontSize: "0.75rem",
				fontWeight: 600,
				letterSpacing: "0.05em",
				lineHeight: 1,
				textTransform: "uppercase",
			},
		},
	},
};
