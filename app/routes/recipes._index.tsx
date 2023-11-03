import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
	NoRecipes,
	OverviewCard,
} from "~/components/recipes/overview/OverviewCard";
import { OverviewContainer } from "~/components/recipes/overview/OverviewContainer";
import { OverviewPagination } from "~/components/recipes/overview/OverviewPagination";
import { usePagination } from "~/hooks/usePagination";
import i18next from "~/modules/i18next.server";
import { LanguageSchema } from "~/schemas/common";
import { setPagination } from "~/utils/helpers/set-pagination.server";
import { recipesOverview } from "~/utils/recipe.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const locale = LanguageSchema.parse(await i18next.getLocale(request));

	const pagination = setPagination(request);

	// TODO: add missing locale
	const foundRecipes = await recipesOverview({ pagination, request });

	return json({ foundRecipes, locale });
};

export default function RecipesRoute() {
	const { foundRecipes, locale } = useLoaderData<typeof loader>();

	const {
		t,
		i18n: { language },
	} = useTranslation();
	const [pagination, setPaginationState] = usePagination(
		foundRecipes.pagination
	);
	const revalidator = useRevalidator();

	const lang = LanguageSchema.parse(language);

	useEffect(() => {
		if (locale !== lang) {
			revalidator.revalidate();
		}
	}, [lang, locale, revalidator]);

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl typography-bold">
				{t("recipe.heading.allRecipes")}
			</h1>
			{foundRecipes.items.length ? (
				<>
					<OverviewContainer>
						{foundRecipes.items.map((recipe) => (
							<OverviewCard
								key={`Recipe__${recipe.id}`}
								lang={lang}
								recipe={recipe}
							/>
						))}
					</OverviewContainer>
					<OverviewPagination
						pagination={pagination}
						set={setPaginationState}
					/>
				</>
			) : (
				<NoRecipes />
			)}
		</div>
	);
}
