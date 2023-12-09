import { json, type LoaderFunctionArgs } from "@remix-run/node";
import {
	useLoaderData,
	useRevalidator,
	type MetaFunction,
} from "@remix-run/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
	NoRecipes,
	OverviewCard,
} from "~/components/recipes/overview/OverviewCard";
import { OverviewContainer } from "~/components/recipes/overview/OverviewContainer";
import { OverviewPagination } from "~/components/recipes/overview/OverviewPagination";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { usePagination } from "~/hooks/usePagination";
import { useSearch } from "~/hooks/useSearch";
import i18next from "~/modules/i18next.server";
import { LanguageSchema } from "~/schemas/common";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { setPagination } from "~/utils/helpers/set-pagination.server";
import { recipesOverview } from "~/utils/recipe.server";
import { getThemeSession } from "~/utils/theme.server";

export const sitemap = () => ({
	priority: 1.0,
});

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const locale = LanguageSchema.parse(await i18next.getLocale(request));

	const result = new URL(request.clone().url).searchParams.get("q");

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: result
			? t("seo.searchRecipes.title", { result })
			: t("seo.recipes.title"),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	const pagination = setPagination(request);

	const foundRecipes = await recipesOverview({ pagination, request });

	return json(
		{
			foundRecipes,
			locale,
			meta: {
				title,
				description,
				url: `${PARSED_ENV.DOMAIN_URL}`,
				path: `/recipes${result ? `?q=${result}` : ""}`,
				theme: (await getThemeSession(request)).getTheme(),
			},
		},
		{
			headers: { "Cache-Control": "private, max-age=10" },
		}
	);
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
	const searchQuery = useSearch();
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
				{searchQuery
					? t("recipe.heading.allRecipesThatContain", {
							query: searchQuery,
					  })
					: t("recipe.heading.allRecipes")}
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

export { ErrorBoundaryContent as ErrorBoundary } from "~/components/common/ErrorBoundary";
