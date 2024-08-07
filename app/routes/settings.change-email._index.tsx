import { zodResolver } from "@hookform/resolvers/zod";
import {
	json,
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
	parseFormData,
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
import { type RemixHookFormSubmit } from "~/types/remix-hook-form-submit.type";
import { auth } from "~/utils/auth.server";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { prisma } from "~/utils/prisma.server";
import { sendChangeEmail } from "~/utils/sendgrid.server";
import { getThemeSession } from "~/utils/theme.server";

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
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const foundUser = await prisma.user.findFirst({
		where: { id: authData.id },
	});

	if (!foundUser) {
		throw new Response(null, { status: 404 });
	}

	if (foundUser.id !== authData.id) {
		throw new Response(null, { status: 403 });
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
			url: `${PARSED_ENV.DOMAIN_URL}`,
			path: `/settings/change-email`,
			theme: (await getThemeSession(request)).getTheme(),
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
		formState: { dirtyFields },
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
			CTAFn={handleSubmit as RemixHookFormSubmit}
			dismissFn={reset}
			isCTADisabled={!Object.keys(dirtyFields).length}
			isLoading={state !== "idle"}
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			title={t("settings.modal.changeEmail.title")}
		>
			<RemixFormProvider {...form}>
				<Form
					preventScrollReset
					className="flex flex-col gap-2"
					onSubmit={handleSubmit as RemixHookFormSubmit}
				>
					<Input
						autoFocus
						autoComplete="email"
						label={t("settings.field.email")}
						name="email"
					/>
				</Form>
			</RemixFormProvider>
			<FormError
				error={
					typeof actionData?.success === "boolean" && !actionData?.success
						? t("error.somethingWentWrong")
						: undefined
				}
			/>
		</Modal>
	);
};

export const action = async ({ request }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const t = await i18next.getFixedT(request);

	const data = await parseFormData<FormData>(request.clone());

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

	let success = true;

	return await sendChangeEmail(request, createdToken.id, email)
		.catch(() => (success = false))
		.then(() => json({ success }));
};

export default EditUsernameModal;
