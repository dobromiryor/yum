import { zodResolver } from "@hookform/resolvers/zod";
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import { Form, useLoaderData, useSubmit } from "@remix-run/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { RemixFormProvider, useRemixForm } from "remix-hook-form";
import { type z } from "zod";

import { Button } from "~/components/common/UI/Button";
import { FormError } from "~/components/common/UI/FormError";
import { Input } from "~/components/common/UI/Input";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { useIsLoading } from "~/hooks/useIsLoading";
import i18next from "~/modules/i18next.server";
import { LanguageSchema } from "~/schemas/common";
import { LoginDTOSchema, LoginIntentSchema } from "~/schemas/login.schema";
import { auth } from "~/utils/auth.server";
import { getFrom } from "~/utils/helpers/get-from.server";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { sessionStorage } from "~/utils/session.server";
import { getThemeSession } from "~/utils/theme.server";

type FormData = z.infer<typeof LoginDTOSchema>;
const resolver = zodResolver(LoginDTOSchema);

export const sitemap = () => ({
	exclude: true,
});

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	await auth.isAuthenticated(request, {
		successRedirect: "/settings",
	});

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("seo.login.title"),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	const session = await sessionStorage.getSession(
		request.headers.get("Cookie")
	);

	return json({
		authError: session.get("auth:error"),
		magicLinkSent: session.has("auth:magiclink"),
		magicLinkEmail: session.get("auth:email"),
		from: getFrom(request),
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}`,
			path: `/login`,
			theme: (await getThemeSession(request)).getTheme(),
		},
	});
};

export const action = async ({ request }: ActionFunctionArgs) => {
	const formData = await request.clone().formData();
	const intent = LoginIntentSchema.parse(formData.get("intent")?.toString());

	switch (intent) {
		case "login":
			await auth.authenticate("email-link", request, {
				successRedirect: "/login",
				failureRedirect: "/login",
			});
		case "reset":
			await auth.logout(request, { redirectTo: "/login" });
		default:
			return null;
	}
};

export default function LoginRoute() {
	const { authError, magicLinkSent, magicLinkEmail, from } =
		useLoaderData<typeof loader>();

	const { t, i18n } = useTranslation();
	const submit = useSubmit();

	const [isLoginLoading] = useIsLoading();
	const [isResetLoading] = useIsLoading();

	const form = useRemixForm<FormData>({
		resolver,
		submitHandlers: {
			onValid: (data) => submit(data, { method: "post" }),
		},
		defaultValues: {
			email: undefined,
			intent: "login",
			from,
		},
	});

	const {
		handleSubmit,
		formState: { dirtyFields },
		setValue,
	} = form;

	const handleResetSubmit = () => {
		submit({ intent: "reset" }, { method: "post" });
	};

	useEffect(() => {
		setValue("language", LanguageSchema.parse(i18n.language));
	}, [i18n.language, setValue]);

	return (
		<div className="self-center flex flex-col gap-6 p-6 bg-secondary dark:bg-primary transition-colors rounded-2xl shadow-lg w-full max-w-lg">
			<h1 className="text-xl typography-semibold">{t("login.heading")}</h1>
			{magicLinkSent ? (
				<>
					<p>
						{t("login.success", {
							email: magicLinkEmail,
						})}
					</p>
					<p>{t("login.successNote")}</p>

					<div className="self-start flex items-center mt-4">
						<p>{t("login.wrongAddress")}</p>
						<Button
							isLoading={isResetLoading}
							variant="text"
							onClick={handleResetSubmit}
						>
							{t("login.tryAgain")}
						</Button>
					</div>
				</>
			) : (
				<>
					<p>{t("login.message")}</p>
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
								label={t("settings.field.email")}
								name="email"
								type="email"
							/>

							<input hidden readOnly name="intent" />

							{authError && <FormError error={authError.message} />}

							<Button
								className="self-end mt-4"
								isDisabled={!Object.keys(dirtyFields).length}
								isLoading={isLoginLoading}
								type="submit"
								variant="normal"
							>
								{t("common.submit")}
							</Button>
						</Form>
					</RemixFormProvider>
				</>
			)}
		</div>
	);
}

export { ErrorBoundaryContent as ErrorBoundary } from "~/components/common/ErrorBoundary";
