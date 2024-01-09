import { Status } from "@prisma/client";
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
import i18next from "~/modules/i18next.server";
import {
	LanguageSchema,
	NonNullTranslatedContentSchema,
	OptionalNonNullTranslatedContentSchema,
} from "~/schemas/common";
import { RecipeCategoryParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { setPagination } from "~/utils/helpers/set-pagination.server";
import { prisma } from "~/utils/prisma.server";
import { recipesCategoryOverview } from "~/utils/recipe.server";
import { getThemeSession } from "~/utils/theme.server";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);
	const locale = LanguageSchema.parse(await i18next.getLocale(request));

	const pagination = setPagination(request);

	const { slug } = RecipeCategoryParamsSchema.parse(params);

	const foundCategory = await prisma.category.findUnique({
		where: { slug },
	});

	if (!foundCategory) {
		throw new Response(null, { status: 404 });
	}

	if (foundCategory?.status !== Status.PUBLISHED) {
		throw new Response(null, { status: 404 });
	}

	await prisma.visit.create({
		data: {
			categoryId: foundCategory.id,
			userId: authData?.id,
		},
	});

	const categoryName = NonNullTranslatedContentSchema.parse(foundCategory.name);

	const categoryDescription = OptionalNonNullTranslatedContentSchema.parse(
		foundCategory.description
	);

	const localizedCategoryDescription = categoryDescription?.[locale];

	const foundRecipes = await recipesCategoryOverview({
		pagination,
		request,
		slug,
	});

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		prefix: categoryName[locale],
		title: t("seo.recipes.title"),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description:
			localizedCategoryDescription !== undefined
				? localizedCategoryDescription
				: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json(
		{
			foundCategory,
			foundRecipes,
			locale,
			meta: {
				title,
				description,
				url: `${PARSED_ENV.DOMAIN_URL}`,
				path: `/recipes/c/${slug}`,
				theme: (await getThemeSession(request)).getTheme(),
			},
		},
		{
			headers: { "Cache-Control": "private, max-age=10" },
		}
	);
};

export default function RecipesCategoryRoute() {
	const { foundCategory, foundRecipes, locale } =
		useLoaderData<typeof loader>();

	const {
		i18n: { language },
	} = useTranslation();
	const [pagination, setPaginationState] = usePagination(
		foundRecipes.pagination
	);
	const revalidator = useRevalidator();

	const name = NonNullTranslatedContentSchema.parse(foundCategory.name);
	const lang = LanguageSchema.parse(language);

	useEffect(() => {
		if (locale !== lang) {
			revalidator.revalidate();
		}
	}, [lang, locale, revalidator]);

	return (
		<div className="flex flex-col gap-6">
			<h1 className="text-2xl typography-bold">{name[lang]}</h1>
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
