import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";

export function StartBuilding() {
	return (
		<Box sx={{ bgcolor: "var(--mui-palette-background-level1)", pb: "60px" }}>
			<Container>
				<Box
					sx={{
						borderRadius: "20px",
						border: "1px solid transparent",
						color: "var(--mui-palette-common-white)",
						display: "flex",
						flexDirection: { xs: "column", md: "row" },
						overflow: "hidden",
						position: "relative",
					}}
				>
					<Box
						sx={{
							bgcolor: "var(--mui-palette-neutral-950)",
							borderRadius: "20px",
							bottom: "1px",
							left: "-1px",
							position: "absolute",
							right: "1px",
							top: "-1px",
							zIndex: 0,
						}}
					>
						<Box
							sx={{
								alignItems: "center",
								bottom: 0,
								display: "flex",
								justifyContent: "center",
								left: 0,
								position: "absolute",
								right: 0,
								top: 0,
								zIndex: 0,
							}}
						>
							<Box component="img" src="/assets/home-cosmic.svg" sx={{ height: "auto", width: "1600px" }} />
						</Box>
						<Box
							sx={{
								alignItems: "center",
								bottom: 0,
								display: "flex",
								justifyContent: "center",
								left: 0,
								position: "absolute",
								right: 0,
								top: 0,
								zIndex: 1,
							}}
						>
							<Box component="img" src="/assets/home-rectangles.svg" sx={{ height: "auto", width: "1900px" }} />
						</Box>
					</Box>
					<Stack
						spacing={3}
						sx={{
							flex: "1 1 auto",
							position: "relative",
							px: "64px",
							py: "120px",
							zIndex: 1,
							alignItems: "center",
							textAlign: "center",
						}}
					>
						<Stack spacing={2} sx={{ maxWidth: "600px" }}>
							<Typography color="inherit" variant="h3">
								Transform Your Agency Operations
							</Typography>
							<Typography color="neutral.300">
								Ready to modernize how your agency serves constituents? CloudCORO provides the complete
								platform — citizen portal, back-office system, and mobile field apps — to deliver faster,
								more transparent government services.
							</Typography>
						</Stack>
						<div>
							<Button endIcon={<CaretRightIcon />} href="#contact" variant="contained">
								Request a Demo
							</Button>
						</div>
					</Stack>
				</Box>
			</Container>
		</Box>
	);
}
