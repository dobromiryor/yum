import { Role, Status } from "@prisma/client";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import {
	useLoaderData,
	useRevalidator,
	type MetaFunction,
} from "@remix-run/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { ErrorCount } from "~/components/common/ErrorCount";
import {
	NoRecipes,
	OverviewCard,
} from "~/components/recipes/overview/OverviewCard";
import { OverviewContainer } from "~/components/recipes/overview/OverviewContainer";
import { OverviewPagination } from "~/components/recipes/overview/OverviewPagination";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { usePagination } from "~/hooks/usePagination";
import i18next from "~/modules/i18next.server";
import { CloudinaryUploadApiResponseWithBlurHashSchema } from "~/schemas/cloudinary.schema";
import { LanguageSchema } from "~/schemas/common";
import { UserRecipesParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import { getDisplayName } from "~/utils/helpers/get-display-name";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { setPagination } from "~/utils/helpers/set-pagination.server";
import { prisma } from "~/utils/prisma.server";
import { recipesOverview } from "~/utils/recipe.server";

export const sitemap = () => ({
	exclude: true,
});

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const { userId } = UserRecipesParamsSchema.parse(p);

	const locale = LanguageSchema.parse(await i18next.getLocale(request));

	const foundUser = await prisma.user.findFirst({ where: { id: userId } });

	if (!foundUser) {
		throw new Response(null, { status: 404 });
	}

	if (userId !== authData?.id || authData?.role !== Role.ADMIN) {
		throw new Response(null, { status: 403 });
	}

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		prefix: t("seo.user.unpublished.prefix"),
		title: getDisplayName(foundUser),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

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
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}/users/${userId}/unpublished`,
			image: CloudinaryUploadApiResponseWithBlurHashSchema.nullable().parse(
				foundUser.photo
			)?.secure_url,
		},
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

export { ErrorBoundaryContent as ErrorBoundary } from "~/components/common/ErrorBoundary";
