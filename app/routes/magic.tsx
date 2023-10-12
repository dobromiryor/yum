import { type LoaderFunctionArgs } from "@remix-run/node";

import { auth } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	await auth.authenticate("email-link", request, {
		successRedirect: "/settings",
		failureRedirect: "/login",
	});
};
