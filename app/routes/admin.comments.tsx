import { DisplayName, Role, type Prisma } from "@prisma/client";
import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
	type SerializeFrom,
} from "@remix-run/node";
import {
	Link,
	NavLink,
	useLoaderData,
	useSearchParams,
} from "@remix-run/react";
import { type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { Avatar } from "~/components/common/Avatar";
import { Table } from "~/components/common/Table";
import { TooltipWrapper } from "~/components/common/Tooltip";
import { Button } from "~/components/common/UI/Button";
import { REPORTED_QUERY } from "~/consts/only-reported.const";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { useHydrated } from "~/hooks/useHydrated";
import { usePagination } from "~/hooks/usePagination";
import i18next from "~/modules/i18next.server";
import { ADMIN_DASHBOARD_BUTTON_PORTAL_KEY } from "~/routes/admin";
import { LanguageSchema, TranslatedContentSchema } from "~/schemas/common";
import { auth } from "~/utils/auth.server";
import {
	adminDashboardComments,
	type AdminDashboardCommentsInclude,
} from "~/utils/comment.server";
import { getCommentId } from "~/utils/helpers/get-comment-id";
import { getDisplayName } from "~/utils/helpers/get-display-name";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { setPagination } from "~/utils/helpers/set-pagination.server";
import { getThemeSession } from "~/utils/theme.server";

export const sitemap = () => ({
	exclude: true,
});

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	if (authData.role !== Role.ADMIN) {
		throw new Response(null, { status: 403 });
	}

	const pagination = setPagination(request);

	const foundComments = await adminDashboardComments({ pagination, request });

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("seo.admin.comments.title"),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		foundComments,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}`,
			path: `/admin/comments`,
			theme: (await getThemeSession(request)).getTheme(),
		},
	});
};

const AdminDashboardCommentsRoute = () => {
	const { foundComments } = useLoaderData<typeof loader>();

	const {
		t,
		i18n: { language },
	} = useTranslation();
	const isHydrated = useHydrated();
	const [searchParams, setSearchParams] = useSearchParams();

	const lang = LanguageSchema.parse(language);

	const [pagination, setPagination] = usePagination(foundComments.pagination);

	const deletedUserFallback = useMemo(
		() => ({
			email: "deleted@user.com",
			firstName: t("recipe.section.reviews.comments.deletedUser.firstName"),
			lastName: t("recipe.section.reviews.comments.deletedUser.lastName"),
			username: "deleted_user",
			prefersDisplayName: DisplayName.names,
		}),
		[t]
	);

	const columns = useMemo<
		ColumnDef<
			SerializeFrom<
				Prisma.CommentGetPayload<{
					include: typeof AdminDashboardCommentsInclude;
				}>
			>
		>[]
	>(
		() => [
			{
				header: `${t("admin.comments.table.content")} (${t(
					"admin.comments.table.replies"
				)})`,
				cell: ({ row }) => (
					<Link
						tabIndex={-1}
						to={`/recipes/${row.original.recipe.slug}#${getCommentId(
							row.original.id
						)}`}
					>
						<TooltipWrapper className="gap-1" content={row.original.content}>
							<span className="truncate max-w-48">{row.original.content}</span>
							{row.original._count.Children > 0 && (
								<span>({row.original._count.Children})</span>
							)}
						</TooltipWrapper>
					</Link>
				),
			},
			{
				header: t("admin.comments.table.user"),
				cell: ({ row }) => (
					<Link
						className="flex gap-2 items-center"
						to={`/users/${row.original.userId}`}
					>
						<Avatar layout="fixed" size="32" user={row.original.user} />
						<span>
							{getDisplayName(row.original.user ?? deletedUserFallback)}
						</span>
					</Link>
				),
			},
			{
				header: t("admin.comments.table.createdAt"),
				cell: ({ row }) => (
					<TooltipWrapper
						content={new Date(row.original.createdAt).toLocaleString(language)}
					>
						{new Date(row.original.createdAt).toLocaleDateString(language)}
					</TooltipWrapper>
				),
				accessorKey: "createdAt",
			},
			{
				header: t("admin.comments.table.updatedAt"),
				cell: ({ row }) => (
					<TooltipWrapper
						content={new Date(row.original.updatedAt).toLocaleString(language)}
					>
						{new Date(row.original.updatedAt).toLocaleDateString(language)}
					</TooltipWrapper>
				),
				accessorKey: "updatedAt",
			},
			{
				header: t("admin.comments.table.recipe"),
				cell: ({ row }) => {
					const name = TranslatedContentSchema.parse(row.original.recipe.name);

					return (
						<NavLink to={`/recipes/${row.original.recipe.slug}`}>
							<TooltipWrapper content={name[lang] ?? undefined}>
								<span className="truncate max-w-32">{name[lang]}</span>
							</TooltipWrapper>
						</NavLink>
					);
				},
			},
			{
				header: t("admin.comments.table.reported"),
				cell: ({ row }) =>
					row.original.commentReports.length > 0 ? (
						<Link
							className="flex gap-2 items-center"
							to={`/users/${row.original.commentReports[0].userId}`}
						>
							<Avatar
								layout="fixed"
								size="32"
								user={row.original.commentReports[0].user}
							/>
							<span>{getDisplayName(row.original.commentReports[0].user)}</span>
						</Link>
					) : null,
			},
		],
		[deletedUserFallback, lang, language, t]
	);

	const handleSearchParams = () => {
		const onlyReported =
			searchParams.has(REPORTED_QUERY) &&
			searchParams.get(REPORTED_QUERY) === "true";

		if (onlyReported) {
			setSearchParams(
				(prev) => {
					prev.set(REPORTED_QUERY, "false");

					return prev;
				},
				{ preventScrollReset: true }
			);
		} else {
			setSearchParams(
				(prev) => {
					prev.set(REPORTED_QUERY, "true");

					return prev;
				},
				{ preventScrollReset: true }
			);
		}
	};

	let portal = null;

	if (typeof document !== "undefined") {
		portal = document.getElementById(ADMIN_DASHBOARD_BUTTON_PORTAL_KEY);
	}

	return (
		<>
			<Table
				columns={columns}
				data={foundComments.items}
				pagination={pagination}
				set={setPagination}
			/>
			{portal && isHydrated
				? createPortal(
						<Button
							rounded="large"
							variant="normal"
							onClick={handleSearchParams}
						>
							{t(
								searchParams.has(REPORTED_QUERY) &&
									searchParams.get(REPORTED_QUERY) === "true"
									? "admin.comments.actions.allComments"
									: "admin.comments.actions.onlyReported"
							)}
						</Button>,
						portal
				  )
				: null}
		</>
	);
};

export default AdminDashboardCommentsRoute;

export { ErrorBoundaryContent as ErrorBoundary } from "~/components/common/ErrorBoundary";
