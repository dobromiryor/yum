import { zodResolver } from "@hookform/resolvers/zod";
import { DisplayName, TemperatureScale, UnitSystem } from "@prisma/client";
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
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
	RemixFormProvider,
	getValidatedFormData,
	useRemixForm,
} from "remix-hook-form";
import { type z } from "zod";

import { Modal } from "~/components/common/Modal";
import { Select } from "~/components/common/UI/Select";
import { Switch } from "~/components/common/UI/Switch";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import i18next from "~/modules/i18next.server";
import { OptionsSchema } from "~/schemas/option.schema";
import { PreferencesSchema } from "~/schemas/settings.schema";
import { auth } from "~/utils/auth.server";
import { errorCatcher } from "~/utils/helpers/error-catcher.server";
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
		formState: { isDirty },
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
			isCTADisabled={!isDirty}
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

	const { errors, data } = await getValidatedFormData<FormData>(
		request.clone(),
		resolver
	);

	if (errors) {
		console.error(errors);

		return json({ success: false, errors });
	}

	const { displayNameToggle, ...rest } = data;

	const updatedUser = await prisma.user
		.update({
			data: {
				prefersDisplayName: displayNameToggle
					? DisplayName.names
					: DisplayName.username,
				...rest,
			},
			where: {
				id: authData.id,
			},
		})
		.catch((error) => errorCatcher(request, error));

	session.set(auth.sessionKey, updatedUser);

	return json(
		{ success: true },
		{ headers: { "Set-Cookie": await sessionStorage.commitSession(session) } }
	);
};

export default EditUserPreferencesModal;
