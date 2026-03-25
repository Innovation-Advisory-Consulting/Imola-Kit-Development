"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";

import { Tip } from "@/components/core/tip";

export function SearchDialog({ onClose, open = false }) {
	const [value, setValue] = React.useState("");

	React.useEffect(() => {
		if (!open) {
			setValue("");
		}
	}, [open]);

	const handleSubmit = React.useCallback(
		(event) => {
			event.preventDefault();
			const term = value.trim();
			if (!term || term.length < 2) return;
			// TODO: Implement search against your backend
			console.log("Search for:", term);
		},
		[value]
	);

	return (
		<Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
			<Stack direction="row" spacing={3} sx={{ alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
				<Typography variant="h6">Search</Typography>
				<IconButton onClick={onClose}>
					<XIcon />
				</IconButton>
			</Stack>
			<DialogContent sx={{ pt: 0 }}>
				<Stack spacing={2}>
					<form onSubmit={handleSubmit}>
						<OutlinedInput
							autoFocus
							fullWidth
							onChange={(event) => setValue(event.target.value)}
							placeholder="Search..."
							startAdornment={
								<InputAdornment position="start">
									<MagnifyingGlassIcon />
								</InputAdornment>
							}
							value={value}
						/>
					</form>

					<Box sx={{ py: 3, textAlign: "center" }}>
						<Tip message="Connect your backend to enable search. Enter a keyword and press Enter." />
					</Box>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}
