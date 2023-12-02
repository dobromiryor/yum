import { zodResolver } from "@hookform/resolvers/zod";
import { DisplayName, TemperatureScale, UnitSystem } from "@prisma/client";
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
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
    RemixFormProvider,
    parseFormData,
    useRemixForm,
} from "remix-hook-form";
import { type z } from "zod";

import { Modal } from "~/components/common/Modal";
import { FormError } from "~/components/common/UI/FormError";
import { Select } from "~/components/common/UI/Select";
import { Switch } from "~/components/common/UI/Switch";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import i18next from "~/modules/i18next.server";
import { OptionsSchema } from "~/schemas/option.schema";
import { PreferencesSchema } from "~/schemas/settings.schema";
import { auth } from "~/utils/auth.server";
import {
    generateMetaDescription,
    generateMetaProps,
    generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { prisma } from "~/utils/prisma.server";
import { sessionStorage } from "~/utils/session.server";

type FormData = z.infer<typeof PreferencesSchema>;
const resolver = zodResolver(PreferencesSchema);

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
			something: `${t("settings.field.preferences")}`.toLowerCase(),
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
			url: `${PARSED_ENV.DOMAIN_URL}/settings/change-preferences`,
		},
	});
};

const EditUserPreferencesModal = () => {
	const [isOpen, setIsOpen] = useState<boolean>(true);

	const { foundUser } = useLoaderData<typeof loader>();

	const actionData = useActionData<typeof action>();

	const { t } = useTranslation();
	const { state } = useNavigation();

	const { pathname } = useLocation();
	const prevPath = pathname.split("/").slice(0, -1).join("/");

	const {
		username,
		firstName,
		lastName,
		prefersTemperatureScale,
		prefersUnitSystem,
		autoConvert,
		prefersDisplayName,
	} = foundUser;

	const form = useRemixForm<FormData>({
		resolver,
		defaultValues: {
			prefersTemperatureScale,
			prefersUnitSystem,
			autoConvert,
			displayNameToggle:
				prefersDisplayName !== DisplayName.email
					? prefersDisplayName === DisplayName.names
					: undefined,
		},
		submitConfig: {
			method: "patch",
		},
	});

	const {
		control,
		formState: { dirtyFields },
		handleSubmit,
		reset,
	} = form;

	const temperatureScales = OptionsSchema.parse(
		Object.values(TemperatureScale).map((item) => ({
			label: `°${item}`,
			value: item,
		}))
	);

	const unitSystems = OptionsSchema.parse(
		Object.values(UnitSystem).map((item) => ({
			label: t(`common.units.${item}`),
			value: item,
		}))
	);

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
			title={t("settings.modal.changePreferences.title")}
		>
			<RemixFormProvider {...form}>
				<Form
					preventScrollReset
					autoComplete="off"
					className="flex flex-col gap-2"
					onSubmit={handleSubmit}
				>
					{prefersDisplayName !== DisplayName.email &&
						username &&
						firstName &&
						lastName && (
							<Controller
								control={control}
								name="displayNameToggle"
								render={({ field: { onChange, value, name } }) => (
									<Switch
										label={`${t("settings.field.publicName")}: `}
										labelPosition="left"
										name={name}
										offLabel={t("settings.field.username")}
										value={value}
										onChange={onChange}
										onLabel={t("settings.field.names")}
									/>
								)}
							/>
						)}
					<Controller
						control={control}
						name="autoConvert"
						render={({ field: { onChange, value, name } }) => (
							<Switch
								label={t("settings.field.autoConvert")}
								labelPosition="left"
								name={name}
								value={value}
								onChange={onChange}
							/>
						)}
					/>
					<Controller
						control={control}
						name="prefersUnitSystem"
						render={({ field: { onChange, value, name } }) => (
							<Select
								isRequired
								label={t("settings.field.prefersUnitSystem")}
								name={name}
								options={unitSystems}
								selected={value}
								onChange={onChange}
							/>
						)}
					/>
					<Controller
						control={control}
						name="prefersTemperatureScale"
						render={({ field: { onChange, value, name } }) => (
							<Select
								isRequired
								label={t("settings.field.prefersTemperatureScale")}
								name={name}
								options={temperatureScales}
								selected={value}
								onChange={onChange}
							/>
						)}
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

	const { displayNameToggle, ...rest } = data;

	let success = true;

	return await prisma.user
		.update({
			data: {
				...(displayNameToggle && {
					prefersDisplayName: displayNameToggle
						? DisplayName.names
						: DisplayName.username,
				}),
				...rest,
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

export default EditUserPreferencesModal;
