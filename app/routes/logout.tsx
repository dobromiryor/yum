import { type LoaderFunctionArgs } from "@remix-run/node";

import { auth } from "~/utils/auth.server";

export const sitemap = () => ({
	exclude: true,
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
	await auth.logout(request, { redirectTo: "/login" });
};
