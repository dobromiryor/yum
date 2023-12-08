import { Role } from "@prisma/client";
import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

import { auth } from "~/utils/auth.server";

export const sitemap = () => ({
	exclude: true,
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	if (authData.role !== Role.ADMIN) {
		throw new Response(null, { status: 403 });
	}

	return redirect("/admin/users");
};
