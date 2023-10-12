import { zodResolver } from "@hookform/resolvers/zod";
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from "@remix-run/node";
import {
	Form,
	useLoaderData,
	useNavigation,
	useSubmit,
} from "@remix-run/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { RemixFormProvider, useRemixForm } from "remix-hook-form";
import { type z } from "zod";

import { Button } from "~/components/common/UI/Button";
import { Input } from "~/components/common/UI/Input";
import { LoginSchema } from "~/schemas/login.schema";
import { auth } from "~/utils/auth.server";
import { sessionStorage } from "~/utils/session.server";

type FormData = z.infer<typeof LoginSchema>;
const resolver = zodResolver(LoginSchema);

export const loader = async ({ request }: LoaderFunctionArgs) => {
	await auth.isAuthenticated(request, {
		successRedirect: "/settings",
	});

	const session = await sessionStorage.getSession(
		request.headers.get("Cookie")
	);

	return json({
		authError: session.get("auth:error"),
		magicLinkSent: session.has("auth:magiclink"),
		magicLinkEmail: session.get("auth:email"),
	});
};

export const action = async ({ request }: ActionFunctionArgs) => {
	await auth.authenticate("email-link", request, {
		successRedirect: "/login",
		failureRedirect: "/login",
	});
};

export default function LoginRoute() {
	const { authError, magicLinkSent, magicLinkEmail } =
		useLoaderData<typeof loader>();

	const { t } = useTranslation();
	const navigation = useNavigation();
	const submit = useSubmit();

	const { state, formData } = navigation;
	const isSubmitting = state === "submitting";

	const form = useRemixForm<FormData>({
		resolver,
		submitHandlers: {
			onValid: (data) => submit(data, { method: "post" }),
		},
	});

	const {
		handleSubmit,
		formState: { isDirty },
	} = form;

	return (
		<div>
			{magicLinkSent || isSubmitting ? (
				<p className={clsx(isSubmitting && "animate-pulse")}>
					{t("login.success", {
						email: isSubmitting ? formData?.get("email") : magicLinkEmail,
					})}
				</p>
			) : (
				<RemixFormProvider {...form}>
					<Form
						preventScrollReset
						className="flex flex-col gap-2"
						method="post"
						onSubmit={handleSubmit}
					>
						<Input
							isRequired
							autoComplete="email"
							label={t("user.fields.email")}
							name="email"
							type="email"
						/>

						{authError && <p>{authError.message}</p>}

						<Button isDisabled={isSubmitting || !isDirty} type="submit">
							{t("common.submit")}
						</Button>
					</Form>
				</RemixFormProvider>
			)}
		</div>
	);
}
