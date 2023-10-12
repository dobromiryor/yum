import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { useAuth } from "~/hooks/useAuth";
import { auth } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request, {
		failureRedirect: "/login",
	});

	return json({
		authData,
	});
};

export default function SettingsRoute() {
	const { authData } = useLoaderData<typeof loader>();
	const { user } = useAuth(authData);
	const { t } = useTranslation();

	return (
		<div>
			<p>
				{user?.firstName} {user?.lastName}
			</p>
			<p>{user?.email}</p>
			<Link to="/logout">{t("nav.authMenu.logout")}</Link>
		</div>
	);
}
