import { Role, type User } from "@prisma/client";
import {
	json,
	type LoaderFunctionArgs,
	type MetaFunction,
	type SerializeFrom,
} from "@remix-run/node";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Avatar } from "~/components/common/Avatar";
import { Table } from "~/components/common/Table";
import { TooltipWrapper } from "~/components/common/Tooltip";
import { Button } from "~/components/common/UI/Button";
import { Icon } from "~/components/common/UI/Icon";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { usePagination } from "~/hooks/usePagination";
import i18next from "~/modules/i18next.server";
import { auth } from "~/utils/auth.server";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { setPagination } from "~/utils/helpers/set-pagination.server";
import { usersOverview } from "~/utils/user.server";

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

	const foundUsers = await usersOverview({ pagination, request });

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("seo.admin.users.title"),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		foundUsers,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}/admin/users`,
		},
	});
};

const AdminDashboardUsersRoute = () => {
	const { foundUsers } = useLoaderData<typeof loader>();

	const {
		t,
		i18n: { language },
	} = useTranslation();

	const [pagination, setPagination] = usePagination(foundUsers.pagination);

	const columns = useMemo<ColumnDef<SerializeFrom<User>>[]>(
		() => [
			{
				header: t("admin.user.table.email"),
				cell: ({ row }) => (
					<div className="flex items-center gap-1">
						<span>{row.original.email}</span>
						{row.original.isVerified && (
							<TooltipWrapper content={t("admin.user.table.isVerified")}>
								<Icon name="verified" />
							</TooltipWrapper>
						)}
						{row.original.role === Role.ADMIN && (
							<TooltipWrapper content={t("common.admin")}>
								<Icon name="shield_person" />
							</TooltipWrapper>
						)}
					</div>
				),
			},
			{
				header: t("admin.user.table.firstName"),
				cell: ({ renderValue }) => renderValue(),
				accessorKey: "firstName",
			},
			{
				header: t("admin.user.table.lastName"),
				cell: ({ renderValue }) => renderValue(),
				accessorKey: "lastName",
			},
			{
				header: t("admin.user.table.username"),
				cell: ({ renderValue }) => renderValue(),
				accessorKey: "userName",
			},
			{
				header: t("admin.user.table.createdAt"),
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
				header: t("admin.user.table.lastLogin"),
				cell: ({ row }) =>
					row.original.lastLogin && (
						<TooltipWrapper
							content={new Date(row.original.lastLogin).toLocaleString(
								language
							)}
						>
							{new Date(row.original.lastLogin).toLocaleDateString(language)}
						</TooltipWrapper>
					),
				accessorKey: "lastLogin",
			},
			{
				header: t("admin.user.table.recipes"),
				cell: ({ renderValue }) => renderValue(),
				accessorKey: "_count.recipes",
			},
			{
				header: t("admin.user.table.actions"),
				cell: ({ row }) => (
					<div className="flex justify-center items-center gap-2 flex-nowrap">
						<TooltipWrapper content={t("admin.user.table.recipes")}>
							<Link className="rounded-full" to={`/users/${row.original.id}`}>
								<Avatar
									size="32"
									user={foundUsers.items[row.index]}
									variant="circle"
								/>
							</Link>
						</TooltipWrapper>
						<TooltipWrapper
							content={t("common.deleteSomething", {
								something: t("admin.user.table.user").toLowerCase(),
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
		[foundUsers, language, t]
	);

	return (
		<>
			<Table
				columns={columns}
				data={foundUsers.items}
				pagination={pagination}
				set={setPagination}
			/>
			<Outlet />
		</>
	);
};

export default AdminDashboardUsersRoute;

export { ErrorBoundaryContent as ErrorBoundary } from "~/components/common/ErrorBoundary";
