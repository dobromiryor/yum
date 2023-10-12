import { Role } from "@prisma/client";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { auth } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const user = await auth.isAuthenticated(request);

	return json({ isAuthenticated: !!user, isAdmin: user?.role === Role.ADMIN });
};

export default function IndexRoute() {
	const { t } = useTranslation();
	const { isAuthenticated, isAdmin } = useLoaderData<typeof loader>();

	return (
		<div className="flex flex-col items-start gap-2">
			<span>{t("nav.home")}</span>
		</div>
	);
}
