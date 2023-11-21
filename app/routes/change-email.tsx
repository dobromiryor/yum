import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

import { Message } from "~/enums/message.enum";
import { auth } from "~/utils/auth.server";
import { prisma } from "~/utils/prisma.server";
import { sessionStorage } from "~/utils/session.server";

export const sitemap = () => ({
	exclude: true,
});

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const session = await sessionStorage.getSession(
		request.clone().headers.get("Cookie")
	);

	const token = new URL(request.clone().url).searchParams.get("token");

	if (!token) {
		return redirect("/settings");
	}

	const foundToken = await prisma.emailChangeToken.findUnique({
		where: { id: token },
	});

	if (!foundToken) {
		return redirect(
			`/settings?success=false&message=${Message.TOKEN_NOT_FOUND}`
		);
	}

	const updatedUser = await prisma.user.update({
		data: {
			email: foundToken.newEmail,
		},
		where: {
			id: authData.id,
		},
	});

	if (!updatedUser) {
		return redirect(
			`/settings?success=false&message=${Message.USER_NOT_UPDATED}`
		);
	}

	session.set(auth.sessionKey, updatedUser);

	return redirect(`/settings?success=true&message=${Message.EMAIL_UPDATED}`, {
		headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
	});
};
