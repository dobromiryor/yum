import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

import { detectLanguage } from "~/i18next.server";
import { auth } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const lang = detectLanguage(request.clone());

	return redirect(`${lang}`);
};

export default function NewRecipeRedirect() {
	return null;
}
