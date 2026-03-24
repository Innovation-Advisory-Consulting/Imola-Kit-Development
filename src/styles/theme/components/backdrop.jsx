import { backdropClasses } from "@mui/material/Backdrop";

export const MuiBackdrop = {
	styleOverrides: {
		root: {
			[`&:not(.${backdropClasses.invisible})`]: {
				backgroundColor: "rgba(0, 0, 0, 0.4)",
				backdropFilter: "blur(8px)",
			},
		},
	},
};
