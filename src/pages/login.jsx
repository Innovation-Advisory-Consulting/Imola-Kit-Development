import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Helmet } from "react-helmet-async";

import { appConfig } from "@/config/app";
import { useAuth } from "@/auth/AuthContext";

const metadata = { title: `Sign in | ${appConfig.name}` };

export function Page() {
	const { auth, login } = useAuth();
	const [loading, setLoading] = React.useState(false);

	// If already authenticated, redirect to dashboard
	React.useEffect(() => {
		if (auth?.accessToken) {
			window.location.href = "/dashboard";
		}
	}, [auth]);

	function handleLogin() {
		setLoading(true);
		login();
	}

	return (
		<React.Fragment>
			<Helmet>
				<title>{metadata.title}</title>
			</Helmet>
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "100vh",
					bgcolor: "var(--mui-palette-background-default)",
				}}
			>
				<Card sx={{ maxWidth: 440, width: "100%", mx: 2 }}>
					<CardContent>
						<Stack spacing={3} sx={{ alignItems: "center", py: 2 }}>
							<Typography variant="h4">{appConfig.name}</Typography>
							<Typography color="text.secondary" variant="body1" sx={{ textAlign: "center" }}>
								Sign in with your Salesforce account to continue.
							</Typography>
							<Button
								fullWidth
								onClick={handleLogin}
								size="large"
								variant="contained"
								disabled={loading}
							>
								{loading ? "Redirecting to Salesforce..." : "Sign in with Salesforce"}
							</Button>
						</Stack>
					</CardContent>
				</Card>
			</Box>
		</React.Fragment>
	);
}
