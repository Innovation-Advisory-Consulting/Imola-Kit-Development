import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";

export function StatStripSkeleton({ count = 4 }) {
	return (
		<Grid container spacing={3}>
			{Array.from({ length: count }).map((_, i) => (
				<Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
					<Card>
						<CardContent>
							<Skeleton variant="text" width="40%" height={20} />
							<Skeleton variant="text" width="60%" height={36} sx={{ mt: 1 }} />
							<Skeleton variant="text" width="30%" height={16} sx={{ mt: 0.5 }} />
						</CardContent>
					</Card>
				</Grid>
			))}
		</Grid>
	);
}

export function ChartCardSkeleton() {
	return (
		<Card>
			<CardContent>
				<Skeleton variant="text" width="30%" height={24} />
				<Skeleton variant="rectangular" height={240} sx={{ mt: 2, borderRadius: 2 }} />
			</CardContent>
		</Card>
	);
}

export function DashboardSkeleton() {
	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
			<StatStripSkeleton />
			<Grid container spacing={3}>
				<Grid size={{ xs: 12, md: 8 }}>
					<ChartCardSkeleton />
				</Grid>
				<Grid size={{ xs: 12, md: 4 }}>
					<ChartCardSkeleton />
				</Grid>
			</Grid>
			<Grid container spacing={3}>
				<Grid size={{ xs: 12, md: 6 }}>
					<ChartCardSkeleton />
				</Grid>
				<Grid size={{ xs: 12, md: 6 }}>
					<ChartCardSkeleton />
				</Grid>
			</Grid>
		</Box>
	);
}
