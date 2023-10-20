import { Role, Status } from "@prisma/client";
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { NoRecipes, OverviewCard } from "~/components/recipes/overview/Card";
import { OverviewContainer } from "~/components/recipes/overview/Container";
import i18next from "~/modules/i18next.server";
import { LanguageSchema } from "~/schemas/common";
import { UserRecipesParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import { getUserName } from "~/utils/helpers/get-user-name";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);

	const { userId } = UserRecipesParamsSchema.parse(p);

	const locale = LanguageSchema.parse(await i18next.getLocale(request));

	const foundUser = await prisma.user.findFirst({ where: { id: userId } });

	if (!foundUser) {
		return redirect("/recipes");
	}

	let foundUnpublishedRecipes = undefined;

	if (userId === authData?.id || authData?.role === Role.ADMIN) {
		foundUnpublishedRecipes = await prisma.recipe.findMany({
			where: {
				status: Status.UNPUBLISHED,
				userId,
			},
		});
	}

	const foundPublishedRecipes = await prisma.recipe.findMany({
		where: {
			status: Status.PUBLISHED,
			languages: {
				has: locale,
			},
			userId,
		},
	});

	return json({
		foundUser,
		foundPublishedRecipes,
		foundUnpublishedRecipes,
		locale,
	});
};

export const UserRecipesRoute = () => {
	const { foundUser, foundPublishedRecipes, foundUnpublishedRecipes, locale } =
		useLoaderData<typeof loader>();

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
				{t("user.profile.heading.userRecipes", {
					user: getUserName(foundUser),
				})}
			</h1>
			{foundUnpublishedRecipes && foundUnpublishedRecipes.length > 0 && (
				<div className="flex flex-col gap-4">
					<h2 className="text-xl typography-semibold">
						{t("recipe.field.unpublished")}
					</h2>
					<OverviewContainer>
						{foundUnpublishedRecipes.map((recipe) => (
							<OverviewCard
								key={`Recipe__${recipe.id}`}
								isUnrestricted
								lang={lang}
								linkTo="edit"
								recipe={recipe}
							/>
						))}
					</OverviewContainer>
				</div>
			)}
			<div className="flex flex-col gap-4">
				{foundUnpublishedRecipes && foundUnpublishedRecipes.length > 0 && (
					<h2 className="text-xl typography-semibold">
						{t("recipe.field.published")}
					</h2>
				)}
				{foundPublishedRecipes.length ? (
					<OverviewContainer>
						{foundPublishedRecipes.map((recipe) => (
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
		</div>
	);
};

export default UserRecipesRoute;
