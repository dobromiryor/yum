import { redirect, type LoaderFunctionArgs } from "@remix-run/node";

import { Message } from "~/enums/message.enum";
import { auth } from "~/utils/auth.server";
import { prisma } from "~/utils/prisma.server";
import { sessionStorage } from "~/utils/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authData = await auth.authenticate("email-link", request.clone(), {
		failureRedirect: "/login",
	});

	const session = await sessionStorage.getSession(
		request.clone().headers.get("Cookie")
	);

	if (authData.isVerified === false) {
		const updatedUser = await prisma.user.update({
			data: { isVerified: true },
			where: { id: authData.id },
		});

		session.set(auth.sessionKey, updatedUser);

		return redirect(`/settings?success=true&message=${Message.USER_VERIFIED}`, {
			headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
		});
	}

	session.set(auth.sessionKey, authData);

	return redirect(`/settings`, {
		headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
	});
};
