import { zodResolver } from "@hookform/resolvers/zod";
import { DisplayName } from "@prisma/client";
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
	useNavigation,
} from "@remix-run/react";
import { useState } from "react";
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
import { PARSED_ENV } from "~/consts/parsed-env.const";
import i18next from "~/modules/i18next.server";
import { NamesSchema } from "~/schemas/settings.schema";
import { auth } from "~/utils/auth.server";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { prisma } from "~/utils/prisma.server";
import { sessionStorage } from "~/utils/session.server";

type FormData = z.infer<typeof NamesSchema>;
const resolver = zodResolver(NamesSchema);

export const sitemap = () => ({
	exclude: true,
});

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

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
			something: `${t("settings.field.names")}`.toLowerCase(),
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
			url: `${PARSED_ENV.DOMAIN_URL}/settings/change-names`,
		},
	});
};

const EditUserNamesModal = () => {
	const [isOpen, setIsOpen] = useState<boolean>(true);

	const { foundUser } = useLoaderData<typeof loader>();

	const actionData = useActionData<typeof action>();

	const { t } = useTranslation();
	const { state } = useNavigation();

	const { pathname } = useLocation();
	const prevPath = pathname.split("/").slice(0, -1).join("/");

	const { firstName, lastName, prefersDisplayName } = foundUser;

	const form = useRemixForm<FormData>({
		resolver,
		defaultValues: {
			firstName: firstName ?? undefined,
			lastName: lastName ?? undefined,
			prefersDisplayName,
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

	return (
		<Modal
			CTAFn={handleSubmit}
			dismissFn={reset}
			isCTADisabled={!Object.keys(dirtyFields).length}
			isLoading={state !== "idle"}
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			success={actionData?.success}
			title={t("settings.modal.changeNames.title")}
		>
			<RemixFormProvider {...form}>
				<Form
					preventScrollReset
					autoComplete="off"
					className="flex flex-col gap-2"
					onSubmit={handleSubmit}
				>
					<Input
						autoFocus
						autoComplete="given-name"
						explanation={t("explanation.names")}
						explanationIcon="regular_expression"
						label={t("settings.field.firstName")}
						name="firstName"
					/>
					<Input
						autoComplete="family-name"
						explanation={t("explanation.names")}
						explanationIcon="regular_expression"
						label={t("settings.field.lastName")}
						name="lastName"
					/>
					<input
						hidden
						readOnly
						name="prefersDisplayName"
						value={prefersDisplayName}
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

	const session = await sessionStorage.getSession(
		request.clone().headers.get("Cookie")
	);

	const data = await parseFormData<FormData>(request.clone());

	const { firstName, lastName, prefersDisplayName } = data;

	let success = true;

	return await prisma.user
		.update({
			data: {
				firstName,
				lastName,
				prefersDisplayName:
					prefersDisplayName === DisplayName.email
						? DisplayName.names
						: undefined,
			},
			where: {
				id: authData.id,
			},
		})
		.catch(() => (success = false))
		.then(async (data) => {
			if (success) {
				session.set(auth.sessionKey, data);

				return json(
					{
						success,
					},
					{
						headers: {
							"Set-Cookie": await sessionStorage.commitSession(session),
						},
					}
				);
			}
		});
};

export default EditUserNamesModal;
