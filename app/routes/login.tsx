import { json, type ActionArgs, type LoaderArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/Button";

import { Input } from "~/components/Input";

import { auth } from "~/utils/auth.server";
import { sessionStorage } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
	await auth.isAuthenticated(request, { successRedirect: "/settings" });

	const session = await sessionStorage.getSession(
		request.headers.get("Cookie")
	);

	return json({
		magicLinkSent: session.has("auth:magiclink"),
		magicLinkEmail: session.get("auth:email"),
	});
};

export const action = async ({ request }: ActionArgs) => {
	await auth.authenticate("email-link", request, {
		successRedirect: "/login",
		failureRedirect: "/login",
	});
};

export default function LoginRoute() {
	const { magicLinkSent, magicLinkEmail } = useLoaderData<typeof loader>();
	const { t } = useTranslation();

	return (
		<div>
			{magicLinkSent ? (
				<p>{`Successfully sent to ${magicLinkEmail}`}</p>
			) : (
				<Form action="/login" method="post">
					<Input
						required
						label={t("common.labels.email")}
						name="email"
						type="email"
					/>

					<Button>{t("common.labels.submit")}</Button>
				</Form>
			)}
		</div>
	);
}
