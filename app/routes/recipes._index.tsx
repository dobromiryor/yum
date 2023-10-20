import { Status } from "@prisma/client";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { NoRecipes, OverviewCard } from "~/components/recipes/overview/Card";
import { OverviewContainer } from "~/components/recipes/overview/Container";
import i18next from "~/modules/i18next.server";
import { LanguageSchema } from "~/schemas/common";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const locale = LanguageSchema.parse(await i18next.getLocale(request));

	const foundRecipes = await prisma.recipe.findMany({
		where: {
			status: Status.PUBLISHED,
			languages: {
				has: locale,
			},
		},
	});

	return json({ foundRecipes, locale });
};

export default function RecipesRoute() {
	const { foundRecipes, locale } = useLoaderData<typeof loader>();
	const {
		t,
		i18n: { language },
	} = useTranslation();
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
			{foundRecipes.length ? (
				<OverviewContainer>
					{foundRecipes.map((recipe) => (
						<OverviewCard
							key={`Recipe__${recipe.id}`}
							lang={lang}
							recipe={recipe}
						/>
					))}
				</OverviewContainer>
			) : (
				<NoRecipes />
			)}
		</div>
	);
}
