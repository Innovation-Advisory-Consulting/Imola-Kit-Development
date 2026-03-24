"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import { useColorScheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";

import { paths } from "@/paths";
import { RouterLink } from "@/components/core/link";

export function Hero() {
	const { colorScheme } = useColorScheme();

	const [img, setImg] = React.useState("/assets/home-hero-light.png");

	React.useEffect(() => {
		setImg(colorScheme === "dark" ? "/assets/home-hero-dark.png" : "/assets/home-hero-light.png");
	}, [colorScheme]);

	return (
		<Box
			sx={{
				bgcolor: "var(--mui-palette-neutral-950)",
				color: "var(--mui-palette-common-white)",
				overflow: "hidden",
				position: "relative",
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
			<Container maxWidth="md" sx={{ position: "relative", py: "120px", zIndex: 3 }}>
				<Stack spacing={4}>
					<Box
						sx={{
							bgcolor: "rgba(120, 53, 15, 0.6)",
							border: "1px solid rgba(251, 191, 36, 0.3)",
							borderRadius: 1,
							px: 2,
							py: 0.75,
							textAlign: "center",
						}}
					>
						<Typography sx={{ color: "#fbbf24", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.05em" }}>
							DEMO SYSTEM — For Government Evaluation Purposes Only — Not for Production Use
						</Typography>
					</Box>
					<Stack spacing={2}>
						<Typography sx={{ fontSize: "3.5rem", fontWeight: 600, lineHeight: 1.2, textAlign: "center" }}>
							Modernize government services with{" "}
							<Typography color="primary.main" component="span" variant="inherit">
								CloudCORO
							</Typography>
						</Typography>
						<Typography color="neutral.300" sx={{ fontWeight: 400, textAlign: "center" }} variant="h5">
							Complete government solutions platform featuring citizen self-service portals, back-office case
							management, and mobile applications for field staff. Built with CloudCORO Software for federal, state,
							and local agencies.
						</Typography>
					</Stack>
					<Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
						<Button component={RouterLink} href={paths.dashboard.overview} variant="contained">
							Request a Demo
						</Button>
						<Button
							href="#solutions"
							sx={{
								color: "var(--mui-palette-common-white)",
								"&:hover": { bgcolor: "var(--mui-palette-action-hover)" },
							}}
						>
							View Solutions
						</Button>
					</Stack>
					<Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "center" }}>
						<AvatarGroup sx={{ "& .MuiAvatar-root": { border: "2px solid var(--mui-palette-neutral-950)" } }}>
							<Avatar alt="User 5" src="/assets/avatar-5.png" />
							<Avatar alt="User 1" src="/assets/avatar-1.png" />
							<Avatar alt="User 2" src="/assets/avatar-2.png" />
						</AvatarGroup>
						<Typography color="neutral.300" sx={{ whiteSpace: "nowrap" }} variant="caption">
							<Typography color="inherit" component="span" sx={{ fontWeight: 700 }} variant="inherit">
								4.8/5
							</Typography>{" "}
							satisfaction from government agencies
						</Typography>
					</Stack>
					<Typography color="neutral.500" sx={{ textAlign: "center" }} variant="caption">
						Trusted by government agencies nationwide
					</Typography>
				</Stack>
			</Container>
			<Container maxWidth="lg" sx={{ position: "relative", zIndex: 2 }}>
				<Box sx={{ bottom: 0, left: 0, position: "absolute", px: "24px", right: 0, top: 0, zIndex: 0 }}>
					<Box
						sx={{ bgcolor: "var(--mui-palette-neutral-950)", borderRadius: "28px", height: "100%", width: "100%" }}
					/>
				</Box>
				<Box
					sx={{
						bgcolor: "#84cc16",
						filter: "blur(50px)",
						height: "30px",
						left: "50%",
						position: "absolute",
						top: 0,
						transform: "translateX(-50%)",
						width: "80%",
						zIndex: 1,
					}}
				/>
				<Box
					component="img"
					src={img}
					sx={{ display: "block", height: "auto", position: "relative", width: "100%", zIndex: 2 }}
				/>
			</Container>
		</Box>
	);
}
