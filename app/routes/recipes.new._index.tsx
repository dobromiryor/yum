import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

import i18next from "~/modules/i18next.server";
import { auth } from "~/utils/auth.server";

export const sitemap = () => ({
	exclude: true,
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const lang = await i18next.getLocale(request);

	return redirect(`${lang}`);
};

export default function NewRecipeRedirect() {
	return null;
}

export { ErrorBoundaryContent as ErrorBoundary } from "~/components/common/ErrorBoundary";
