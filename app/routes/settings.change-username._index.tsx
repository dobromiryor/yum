import { zodResolver } from "@hookform/resolvers/zod";
import { DisplayName } from "@prisma/client";
import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import {
	Form,
	useActionData,
	useLoaderData,
	useLocation,
	useNavigation,
} from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	RemixFormProvider,
	getValidatedFormData,
	useRemixForm,
} from "remix-hook-form";
import { type z } from "zod";

import { Modal } from "~/components/common/Modal";
import { FormError } from "~/components/common/UI/FormError";
import { Input } from "~/components/common/UI/Input";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import i18next from "~/modules/i18next.server";
import { UsernameSchema } from "~/schemas/settings.schema";
import { auth } from "~/utils/auth.server";
import { errorCatcher } from "~/utils/helpers/error-catcher.server";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { prisma } from "~/utils/prisma.server";
import { sessionStorage } from "~/utils/session.server";

type FormData = z.infer<typeof UsernameSchema>;
const resolver = zodResolver(UsernameSchema);

export const sitemap = () => ({
	exclude: true,
});

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/401",
	});

	const foundUser = await prisma.user.findFirst({
		where: { id: authData.id },
	});

	if (!foundUser) {
		return redirect("/404");
	}

	if (foundUser.id !== authData.id) {
		return redirect("/403");
	}

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("common.editSomething", {
			something: `${t("settings.field.username")}`.toLowerCase(),
		}),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		authData,
		foundUser,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}/settings/change-username`,
		},
	});
};

const EditUsernameModal = () => {
	const [isOpen, setIsOpen] = useState<boolean>(true);

	const { foundUser } = useLoaderData<typeof loader>();

	const actionData = useActionData<typeof action>();

	const { t } = useTranslation();
	const { state } = useNavigation();

	const { pathname } = useLocation();
	const prevPath = pathname.split("/").slice(0, -1).join("/");

	const { username, prefersDisplayName } = foundUser;

	const form = useRemixForm<FormData>({
		resolver,
		defaultValues: {
			username: username ?? undefined,
			prefersDisplayName,
		},
		submitConfig: {
			method: "patch",
		},
	});

	const {
		formState: { isDirty },
		handleSubmit,
		reset,
	} = form;

	return (
		<Modal
			CTAFn={handleSubmit}
			dismissFn={reset}
			isCTADisabled={!isDirty}
			isLoading={state !== "idle"}
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			success={actionData?.success}
			title={t("settings.modal.changeUsername.title")}
		>
			<RemixFormProvider {...form}>
				<Form
					preventScrollReset
					className="flex flex-col gap-2"
					onSubmit={handleSubmit}
				>
					<Input
						autoFocus
						autoComplete="username"
						label={t("settings.field.username")}
						name="username"
					/>
					<input
						hidden
						readOnly
						name="prefersDisplayName"
						value={prefersDisplayName}
					/>
					<FormError error={actionData?.formError} />
				</Form>
			</RemixFormProvider>
		</Modal>
	);
};

export const action = async ({ request }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/401",
	});

	const session = await sessionStorage.getSession(
		request.clone().headers.get("Cookie")
	);

	const t = await i18next.getFixedT(request.clone());

	const { errors, data } = await getValidatedFormData<FormData>(
		request.clone(),
		resolver
	);

	if (errors) {
		console.error(errors);

		return json({ success: false, errors, formError: undefined });
	}

	const { username, prefersDisplayName } = data;

	const existingUser = await prisma.user.findUnique({
		where: { username },
	});

	if (existingUser) {
		return json({
			success: false,
			formError: t("translation:settings.errors.usernameExists"),
		});
	}

	const updatedUser = await prisma.user
		.update({
			data: {
				username,
				prefersDisplayName:
					prefersDisplayName === DisplayName.email
						? DisplayName.username
						: undefined,
			},
			where: {
				id: authData.id,
			},
		})
		.catch((formError) => errorCatcher(request, formError));

	session.set(auth.sessionKey, updatedUser);

	return json(
		{
			success: true,
			formError: undefined as string | undefined,
		},
		{ headers: { "Set-Cookie": await sessionStorage.commitSession(session) } }
	);
};

export default EditUsernameModal;
