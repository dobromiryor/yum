import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

import i18next from "~/modules/i18next.server";
import { auth } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const lang = await i18next.getLocale(request);

	return redirect(`${lang}`);
};

export default function NewRecipeRedirect() {
	return null;
}
