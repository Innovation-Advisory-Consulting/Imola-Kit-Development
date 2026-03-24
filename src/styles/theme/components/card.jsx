import { paperClasses } from "@mui/material/Paper";

export const MuiCard = {
	styleOverrides: {
		root: ({ theme }) => {
			return {
				borderRadius: "20px",
				transition: "box-shadow var(--cc-transition-normal), transform var(--cc-transition-normal)",
				[`&.${paperClasses.elevation1}`]: {
					boxShadow:
						theme.palette.mode === "dark"
							? "0 5px 22px 0 rgba(0, 0, 0, 0.24), 0 0 0 1px rgba(255, 255, 255, 0.12)"
							: "0 5px 22px 0 rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.06)",
				},
				"&:hover": {
					boxShadow:
						theme.palette.mode === "dark"
							? "0 8px 32px 0 rgba(0, 0, 0, 0.32), 0 0 0 1px rgba(255, 255, 255, 0.1)"
							: "0 8px 32px 0 rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)",
					transform: "translateY(-2px)",
				},
			};
		},
	},
};
