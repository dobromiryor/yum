import { Role } from "@prisma/client";
import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import { useLoaderData, useNavigate, useRevalidator } from "@remix-run/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { type SitemapFunction } from "remix-sitemap";

import { ErrorCount } from "~/components/common/ErrorCount";
import { Button } from "~/components/common/UI/Button";
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
import {
	recipesOverview,
	unpublishedRecipesCount,
} from "~/utils/recipe.server";

export const sitemap: SitemapFunction = async () => {
	const users = await prisma.user.findMany();

	return users.map((user) => ({
		loc: `/users/${user.id}`,
		lastmod: user.updatedAt.toISOString(),
		exclude: !user.isVerified,
		...(user.photo && {
			images: [
				{
					loc: CloudinaryUploadApiResponseWithBlurHashSchema.parse(user.photo)
						.secure_url,
				},
			],
		}),
	}));
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);

	const { userId } = UserRecipesParamsSchema.parse(p);

	const locale = LanguageSchema.parse(await i18next.getLocale(request));

	const foundUser = await prisma.user.findFirst({ where: { id: userId } });

	if (!foundUser) {
		throw new Response(null, { status: 404 });
	}

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: getDisplayName(foundUser),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	let foundUnpublishedRecipesCount = undefined;

	if (userId === authData?.id || authData?.role === Role.ADMIN) {
		foundUnpublishedRecipesCount = await unpublishedRecipesCount({ userId });
	}

	const foundPublishedRecipes = await recipesOverview({
		pagination: setPagination(request),
		userId,
		request,
	});

	return json({
		foundUser,
		foundPublishedRecipes,
		foundUnpublishedRecipesCount,
		locale,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}/users/${userId}`,
			image: CloudinaryUploadApiResponseWithBlurHashSchema.nullable().parse(
				foundUser.photo
			)?.secure_url,
		},
	});
};

export const UserRecipesRoute = () => {
	const {
		foundUser,
		foundPublishedRecipes,
		foundUnpublishedRecipesCount,
		locale,
	} = useLoaderData<typeof loader>();

	const {
		t,
		i18n: { language },
	} = useTranslation();
	const revalidator = useRevalidator();
	const navigate = useNavigate();
	const [pagination, set] = usePagination(foundPublishedRecipes.pagination);

	const lang = LanguageSchema.parse(language);

	useEffect(() => {
		if (locale !== lang) {
			revalidator.revalidate();
		}
	}, [lang, locale, revalidator]);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex justify-between gap-2 flex-wrap">
				<h1 className="text-2xl typography-bold">
					{t("user.profile.heading.userRecipes", {
						user: getDisplayName(foundUser),
					})}
				</h1>
				{!!foundUnpublishedRecipesCount && (
					<Button
						className="sm:ml-auto items-center gap-1"
						onClick={() => navigate("unpublished")}
					>
						<ErrorCount errorCount={foundUnpublishedRecipesCount} />
						<span>{t("recipe.field.unpublished")}</span>
					</Button>
				)}
			</div>
			<div className="flex flex-col gap-4">
				{foundPublishedRecipes.items.length ? (
					<>
						<OverviewContainer>
							{foundPublishedRecipes.items.map((recipe) => (
								<OverviewCard
									key={`Recipe__${recipe.id}`}
									lang={lang}
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

export default UserRecipesRoute;

export { ErrorBoundaryContent as ErrorBoundary } from "~/components/common/ErrorBoundary";
