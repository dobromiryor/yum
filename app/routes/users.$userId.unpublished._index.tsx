import { Role, Status } from "@prisma/client";
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { ErrorCount } from "~/components/common/ErrorCount";
import {
	NoRecipes,
	OverviewCard,
} from "~/components/recipes/overview/OverviewCard";
import { OverviewContainer } from "~/components/recipes/overview/OverviewContainer";
import { OverviewPagination } from "~/components/recipes/overview/OverviewPagination";
import { usePagination } from "~/hooks/usePagination";
import i18next from "~/modules/i18next.server";
import { LanguageSchema } from "~/schemas/common";
import { UserRecipesParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import { getDisplayName } from "~/utils/helpers/get-display-name";
import { setPagination } from "~/utils/helpers/set-pagination.server";
import { prisma } from "~/utils/prisma.server";
import { recipesOverview } from "~/utils/recipe.server";

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);

	const { userId } = UserRecipesParamsSchema.parse(p);

	const locale = LanguageSchema.parse(await i18next.getLocale(request));

	const foundUser = await prisma.user.findFirst({ where: { id: userId } });

	const referer = request.clone().headers.get("Referer");
	const from = referer && new URL(referer).pathname;

	if (!foundUser) {
		return redirect(from ?? "/recipes"); // TODO: Maybe change this to /users (TBD)
	}

	if (userId !== authData?.id || authData?.role !== Role.ADMIN) {
		return redirect(from ?? `/users/${userId}`);
	}

	const foundRecipes = await recipesOverview({
		pagination: setPagination(request),
		status: Status.UNPUBLISHED,
		unlockLocale: true,
		userId,
		request,
	});

	return json({
		foundUser,
		foundRecipes,
		locale,
	});
};

export const UnpublishedUserRecipesRoute = () => {
	const { foundUser, foundRecipes, locale } = useLoaderData<typeof loader>();

	const {
		t,
		i18n: { language },
	} = useTranslation();
	const revalidator = useRevalidator();
	const [pagination, set] = usePagination(foundRecipes.pagination);

	const lang = LanguageSchema.parse(language);

	useEffect(() => {
		if (locale !== lang) {
			revalidator.revalidate();
		}
	}, [lang, locale, revalidator]);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-2 flex-wrap">
				<h1 className="text-2xl typography-bold">
					{t("user.profile.heading.userUnpublishedRecipes", {
						user: getDisplayName(foundUser),
					})}
				</h1>
				<ErrorCount errorCount={foundRecipes.pagination.count} />
			</div>
			<div className="flex flex-col gap-4">
				{foundRecipes.items.length ? (
					<>
						<OverviewContainer>
							{foundRecipes.items.map((recipe) => (
								<OverviewCard
									key={`Unpublished__Recipe__${recipe.id}`}
									isUnrestricted
									lang={lang}
									linkTo="edit"
									recipe={recipe}
								/>
							))}
						</OverviewContainer>
						<OverviewPagination pagination={pagination} set={set} />
					</>
				) : (
					<NoRecipes />
				)}
			</div>
		</div>
	);
};

export default UnpublishedUserRecipesRoute;
