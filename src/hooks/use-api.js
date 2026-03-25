import * as React from "react";

/**
 * Generic API client hook.
 * Replace this with your own implementation once you connect a backend.
 *
 * Example:
 *   const client = useApiClient();
 *   // client is null until you configure it
 */
export function useApiClient() {
	return null;
}

/**
 * Generic data-fetching hook with loading/error states.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApiQuery(
 *     async () => client.get("/users"),
 *     [client]
 *   );
 */
export function useApiQuery(queryFn, deps = []) {
	const [data, setData] = React.useState(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState(null);

	const queryFnRef = React.useRef(queryFn);
	queryFnRef.current = queryFn;

	const refetch = React.useCallback(() => {
		setLoading(true);
		setError(null);
		queryFnRef
			.current()
			.then((result) => {
				setData(result);
				setLoading(false);
			})
			.catch((err) => {
				setError(err);
				setLoading(false);
			});
	}, deps);

	React.useEffect(() => {
		refetch();
	}, [refetch]);

	return { data, loading, error, refetch };
}
