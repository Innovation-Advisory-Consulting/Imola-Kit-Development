import { tableCellClasses } from "@mui/material/TableCell";
import { tableRowClasses } from "@mui/material/TableRow";

export const MuiTableBody = {
	styleOverrides: {
		root: {
			[`& .${tableRowClasses.root}`]: {
				transition: "background-color var(--cc-transition-fast)",
				"&:hover": { backgroundColor: "var(--mui-palette-action-hover)" },
			},
			[`& .${tableRowClasses.root}:last-child`]: { [`& .${tableCellClasses.root}`]: { "--TableCell-borderWidth": 0 } },
		},
	},
};
