import { Role, Status, type Category } from "@prisma/client";
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
	type SerializeFrom,
} from "@remix-run/node";
import {
	Link,
	Outlet,
	useActionData,
	useLoaderData,
	useSubmit,
} from "@remix-run/react";
import { type ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { Table } from "~/components/common/Table";
import { TooltipWrapper } from "~/components/common/Tooltip";
import { Button } from "~/components/common/UI/Button";
import { FormError } from "~/components/common/UI/FormError";
import { Icon } from "~/components/common/UI/Icon";
import { Switch } from "~/components/common/UI/Switch";
import { LIMIT_FALLBACK, PAGE_FALLBACK } from "~/consts/pagination.const";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { useHydrated } from "~/hooks/useHydrated";
import { usePagination } from "~/hooks/usePagination";
import i18next from "~/modules/i18next.server";
import { ADMIN_DASHBOARD_BUTTON_PORTAL_KEY } from "~/routes/admin";
import { UpdateCategoryStatusSchema } from "~/schemas/category.schema";
import {
	LanguageSchema,
	NonNullTranslatedContentSchema,
	OptionalNonNullTranslatedContentSchema,
} from "~/schemas/common";
import { auth } from "~/utils/auth.server";
import { categoriesOverview } from "~/utils/category.server";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { setPagination } from "~/utils/helpers/set-pagination.server";
import { prisma } from "~/utils/prisma.server";
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
	const foundCategories = await categoriesOverview({ request, pagination });

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("seo.admin.categories.title"),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		foundCategories,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}`,
			path: `/admin/categories`,
			theme: (await getThemeSession(request)).getTheme(),
		},
	});
};

const AdminDashboardCategoriesRoute = () => {
	const { foundCategories } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	const [pagination, setPagination] = usePagination(foundCategories.pagination);

	const submit = useSubmit();
	const hydrated = useHydrated();
	const {
		t,
		i18n: { language },
	} = useTranslation();

	const lang = LanguageSchema.parse(language);

	const handlePublishedStatusChange = useCallback(
		(id: string, value: boolean) => {
			submit(
				{
					id,
					status: value ? Status.PUBLISHED : Status.UNPUBLISHED,
				},
				{ method: "PATCH" }
			);
		},
		[submit]
	);

	const columns = useMemo<ColumnDef<SerializeFrom<Category>>[]>(
		() => [
			{
				header: t("admin.category.table.name"),
				cell: ({ row }) => {
					const name = NonNullTranslatedContentSchema.parse(row.original.name);

					return <span>{name[lang]}</span>;
				},
				accessorKey: "name",
			},
			{
				header: t("admin.category.table.description"),
				cell: ({ row }) => {
					const description = OptionalNonNullTranslatedContentSchema.parse(
						row.original.description
					);

					if (!description) {
						return null;
					}

					return <p className="truncate max-w-32">{description[lang]}</p>;
				},
				accessorKey: "description",
			},
			{
				header: t("admin.category.table.slug"),
				cell: ({ renderValue }) => renderValue(),
				accessorKey: "slug",
			},
			{
				header: t("admin.category.table.status"),
				cell: ({ row }) => (
					<TooltipWrapper
						content={
							row.original.status === Status.PUBLISHED
								? t("admin.category.table.published")
								: t("admin.category.table.unpublished")
						}
					>
						<Switch
							label={t("admin.category.table.status")}
							labelPosition="hidden"
							name="status"
							value={row.original.status === Status.PUBLISHED}
							onChange={(value) =>
								handlePublishedStatusChange(row.original.id, value)
							}
						/>
					</TooltipWrapper>
				),
				accessorKey: "status",
			},
			{
				header: t("admin.category.table.recipesCount"),
				cell: ({ renderValue }) => renderValue(),
				accessorKey: "_count.recipes",
			},
			{
				header: t("admin.category.table.visitCount"),
				cell: ({ renderValue }) => renderValue(),
				accessorKey: "visitCount",
			},
			{
				header: t("admin.category.table.createdAt"),
				cell: ({ row }) => (
					<TooltipWrapper
						content={new Date(row.original.createdAt).toLocaleString(lang)}
					>
						{new Date(row.original.createdAt).toLocaleDateString(lang)}
					</TooltipWrapper>
				),
				accessorKey: "createdAt",
			},
			{
				header: t("admin.category.table.updatedAt"),
				cell: ({ row }) => (
					<TooltipWrapper
						content={new Date(row.original.updatedAt).toLocaleString(lang)}
					>
						{new Date(row.original.updatedAt).toLocaleDateString(lang)}
					</TooltipWrapper>
				),
				accessorKey: "updatedAt",
			},
			{
				header: t("admin.category.table.actions"),
				cell: ({ row }) => (
					<div className="flex justify-center items-center gap-2 flex-nowrap">
						<TooltipWrapper content={t("common.open")}>
							<Link
								preventScrollReset
								tabIndex={-1}
								to={`/recipes/c/${row.original.slug}?page=${PAGE_FALLBACK}&limit=${LIMIT_FALLBACK}`}
							>
								<Button rounded="full">
									<Icon name="arrow_outward" size="20" />
								</Button>
							</Link>
						</TooltipWrapper>
						<TooltipWrapper
							content={t("common.editSomething", {
								something: t("admin.category.table.category_one").toLowerCase(),
							})}
						>
							<Link
								preventScrollReset
								tabIndex={-1}
								to={`${row.original.id}/edit`}
							>
								<Button rounded="full">
									<Icon name="edit" size="20" />
								</Button>
							</Link>
						</TooltipWrapper>
						<TooltipWrapper
							content={t("common.deleteSomething", {
								something: t("admin.category.table.category_one").toLowerCase(),
							})}
						>
							<Link
								preventScrollReset
								tabIndex={-1}
								to={`${row.original.id}/delete`}
							>
								<Button rounded="full" variant="danger">
									<Icon name="delete_forever" size="20" />
								</Button>
							</Link>
						</TooltipWrapper>
					</div>
				),
			},
		],
		[handlePublishedStatusChange, lang, t]
	);

	let portal = null;

	if (typeof document !== "undefined") {
		portal = document.getElementById(ADMIN_DASHBOARD_BUTTON_PORTAL_KEY);
	}

	return (
		<>
			<Table
				columns={columns}
				data={foundCategories.items}
				pagination={pagination}
				set={setPagination}
			/>
			<FormError
				error={
					typeof actionData?.success === "boolean" && !actionData?.success
						? t("error.somethingWentWrong")
						: undefined
				}
			/>
			<Outlet />
			{portal && hydrated
				? createPortal(
						<Link tabIndex={-1} to={"add"}>
							<Button rounded="large" variant="normal">
								{t("common.add")}
							</Button>
						</Link>,
						portal
					)
				: null}
		</>
	);
};

export const action = async ({ request }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	if (authData.role !== Role.ADMIN) {
		throw new Response(null, { status: 403 });
	}

	switch (request.method) {
		case "PATCH":
			const { id, status } = UpdateCategoryStatusSchema.parse(
				Object.fromEntries((await request.clone().formData()).entries())
			);

			let success = true;

			await prisma.category
				.update({ data: { status }, where: { id } })
				.catch(() => (success = false))
				.then(() => json({ success }));

			return json({ success });
		default:
			return json({ success: false });
	}
};

export default AdminDashboardCategoriesRoute;

export { ErrorBoundaryContent as ErrorBoundary } from "~/components/common/ErrorBoundary";
