import { Role } from "@prisma/client";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { NavigationLink } from "~/components/header/NavigationLink";
import { auth } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	if (authData.role !== Role.ADMIN) {
		throw new Response(null, { status: 403 });
	}

	return json({});
};

const AdminDashboardRoute = () => {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col gap-2 flex-nowrap">
			<aside className="flex gap-3 p-3 bg-secondary dark:bg-primary rounded-2xl shadow-lg transition-colors">
				<nav className="flex gap-2 overflow-x-auto">
					<NavigationLink to="users">{t("admin.nav.users")}</NavigationLink>
				</nav>
			</aside>

			<Outlet />
		</div>
	);
};

export default AdminDashboardRoute;

export { ErrorBoundaryContent as ErrorBoundary } from "~/components/common/ErrorBoundary";
