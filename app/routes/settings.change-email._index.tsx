import { zodResolver } from "@hookform/resolvers/zod";
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
	useNavigate,
	useNavigation,
} from "@remix-run/react";
import { useEffect, useState } from "react";
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
import { NAMESPACES } from "~/consts/namespaces.const";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { Message } from "~/enums/message.enum";
import i18next from "~/modules/i18next.server";
import { EmailSchema } from "~/schemas/settings.schema";
import { auth } from "~/utils/auth.server";
import { errorCatcher } from "~/utils/helpers/error-catcher.server";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { prisma } from "~/utils/prisma.server";
import { sendChangeEmail } from "~/utils/sendgrid.server";

type FormData = z.infer<typeof EmailSchema>;
const resolver = zodResolver(EmailSchema);

export const sitemap = () => ({
	exclude: true,
});

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const handle = NAMESPACES;

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
			something: `${t("settings.field.email")}`.toLowerCase(),
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
			url: `${PARSED_ENV.DOMAIN_URL}/settings/change-email`,
		},
	});
};

const EditUsernameModal = () => {
	const [isOpen, setIsOpen] = useState<boolean>(true);

	const { foundUser } = useLoaderData<typeof loader>();

	const actionData = useActionData<typeof action>();

	const { t } = useTranslation();
	const { state } = useNavigation();
	const navigate = useNavigate();

	const { pathname } = useLocation();
	const prevPath = pathname.split("/").slice(0, -1).join("/");

	const { email } = foundUser;

	const form = useRemixForm<FormData>({
		resolver,
		defaultValues: {
			email: email ?? undefined,
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

	useEffect(() => {
		if (actionData?.success) {
			navigate(`/settings?success=true&message=${Message.VERIFY_ADDRESS}`);
		}
	}, [actionData?.success, navigate]);

	return (
		<Modal
			CTAFn={handleSubmit}
			dismissFn={reset}
			isCTADisabled={!isDirty}
			isLoading={state !== "idle"}
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			title={t("settings.modal.changeEmail.title")}
		>
			<RemixFormProvider {...form}>
				<Form
					preventScrollReset
					autoComplete="off"
					className="flex flex-col gap-2"
					onSubmit={handleSubmit}
				>
					<Input label={t("settings.field.email")} name="email" />
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

	const t = await i18next.getFixedT(request);

	const { errors, data } = await getValidatedFormData<FormData>(
		request.clone(),
		resolver
	);

	if (errors) {
		console.error(errors);

		return json({ success: false, errors, formError: undefined });
	}

	const { email } = data;

	const existingUser = await prisma.user.findUnique({
		where: { email },
	});

	if (existingUser) {
		return json({
			success: false,
			formError: t("settings.errors.emailExists"),
		});
	}

	const createdToken = await prisma.emailChangeToken.create({
		data: {
			newEmail: email,
			oldEmail: authData.email,
			userId: authData.id,
		},
	});

	await sendChangeEmail(request, createdToken.id, email).catch((error) =>
		errorCatcher(request, error)
	);

	return json({
		success: true,
		formError: undefined as string | undefined,
	});
};

export default EditUsernameModal;
