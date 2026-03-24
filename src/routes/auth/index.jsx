import { route as auth0Route } from "./auth0";
import { route as cognitoRoute } from "./cognito";
import { route as customRoute } from "./custom";
import { route as samplesRoute } from "./samples";
import { route as supabaseRoute } from "./supabase";

export const route = {
	path: "auth",
	children: [auth0Route, cognitoRoute, customRoute, samplesRoute, supabaseRoute],
};
