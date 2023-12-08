import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

import { Message } from "~/enums/message.enum";
import { auth } from "~/utils/auth.server";
import { prisma } from "~/utils/prisma.server";
import { sessionStorage } from "~/utils/session.server";

export const sitemap = () => ({
	exclude: true,
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authData = await auth.authenticate("email-link", request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const url = new URL(request.clone().url);
	const from = url.searchParams.get("from");

	const session = await sessionStorage.getSession(
		request.clone().headers.get("Cookie")
	);

	if (authData.isVerified === false) {
		const updatedUser = await prisma.user.update({
			data: { isVerified: true, lastLogin: new Date() },
			where: { id: authData.id },
		});

		session.set(auth.sessionKey, updatedUser);

		return redirect(
			from ?? `/settings?success=true&message=${Message.USER_VERIFIED}`,
			{
				headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
			}
		);
	} else {
		const updatedUser = await prisma.user.update({
			data: { lastLogin: new Date() },
			where: { id: authData.id },
		});

		session.set(auth.sessionKey, updatedUser);

		return redirect(from ?? "/settings", {
			headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
		});
	}
};

export { ErrorBoundary } from "~/components/common/ErrorBoundary";
