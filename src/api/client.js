import axios from "axios";

/**
 * Generic API client factory.
 * Configure this for your backend (REST API, GraphQL, Firebase, Supabase, etc.)
 *
 * Usage:
 *   const client = createApiClient("https://api.example.com", token);
 *   const users = await client.get("/users", { page: 1 });
 *   await client.post("/users", { name: "John" });
 */
export function createApiClient(baseURL, token) {
	const instance = axios.create({
		baseURL,
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});

	return {
		get: (url, params) => instance.get(url, { params }).then((r) => r.data),
		post: (url, data) => instance.post(url, data).then((r) => r.data),
		patch: (url, data) => instance.patch(url, data).then((r) => r.data),
		put: (url, data) => instance.put(url, data).then((r) => r.data),
		delete: (url) => instance.delete(url).then((r) => r.data),
	};
}
