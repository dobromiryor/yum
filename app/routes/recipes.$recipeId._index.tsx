import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

import i18next from "~/modules/i18next.server";
import { LanguageSchema } from "~/schemas/common";
import { RecipeParamsSchema } from "~/schemas/params.schema";

export const sitemap = () => ({
	exclude: true,
});

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const { recipeId } = RecipeParamsSchema.parse(p);
	const locale = LanguageSchema.parse(await i18next.getLocale(request.clone()));

	return redirect(`/recipes/${recipeId}/${locale}`);
};
