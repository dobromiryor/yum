import { type LoaderArgs } from "@remix-run/node";

import { auth } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderArgs) => {
	await auth.logout(request, { redirectTo: "/login" });
};
