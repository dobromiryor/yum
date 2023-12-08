import { zodResolver } from "@hookform/resolvers/zod";
import { Length, Volume } from "@prisma/client";
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import {
	Form,
	useActionData,
	useLocation,
	useNavigation,
} from "@remix-run/react";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
	RemixFormProvider,
	parseFormData,
	useRemixForm,
} from "remix-hook-form";
import { z } from "zod";

import { Modal } from "~/components/common/Modal";
import { FormError } from "~/components/common/UI/FormError";
import { Input } from "~/components/common/UI/Input";
import { Select } from "~/components/common/UI/Select";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { useFilteredValues } from "~/hooks/useFilteredValues";
import i18next from "~/modules/i18next.server";
import { EquipmentDTOSchema } from "~/schemas/equipment.schema";
import { EditRecipeWithLangParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { translatedContent } from "~/utils/helpers/translated-content.server";
import { prisma } from "~/utils/prisma.server";

type FormData = z.infer<typeof EquipmentDTOSchema>;
const resolver = zodResolver(EquipmentDTOSchema);

export const sitemap = () => ({
	exclude: true,
});

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const { lang, recipeId } = EditRecipeWithLangParamsSchema.parse(p);

	const foundRecipe = await prisma.recipe.findUnique({
		where: { id: recipeId },
	});

	if (!foundRecipe) {
		throw new Response(null, { status: 404 });
	}

	if (foundRecipe.userId !== authData.id && authData.role !== "ADMIN") {
		throw new Response(null, { status: 403 });
	}

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("common.addSomething", {
			something: `${t("recipe.field.equipment")}`.toLowerCase(),
		}),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}/recipes/edit/${recipeId}/${lang}/equipment`,
		},
	});
};

const CreateEquipmentModal = () => {
	const [isOpen, setIsOpen] = useState<boolean>(true);

	const actionData = useActionData<typeof action>();

	const { t } = useTranslation();
	const { pathname } = useLocation();
	const { state } = useNavigation();

	const prevPath = pathname.split("/").slice(0, -1).join("/");

	const { onValid } = useFilteredValues<FormData>();
	const form = useRemixForm<FormData>({
		resolver,
		submitHandlers: {
			onValid,
		},
	});
	const {
		control,
		reset,
		handleSubmit,
		formState: { dirtyFields },
	} = form;

	const dimensionUnitOptions = useMemo(
		() =>
			Object.keys(Length).map((item) => {
				const lengthItem = z.nativeEnum(Length).parse(item);

				return {
					label: t(`recipe.units.${lengthItem}`, {
						count: 0,
					}),
					value: item,
				};
			}),
		[t]
	);
	const volumeUnitOptions = useMemo(
		() =>
			Object.keys(Volume).map((item) => {
				const volumeItem = z.nativeEnum(Volume).parse(item);

				return {
					label: t(`recipe.units.${volumeItem}`, {
						count: 0,
					}),
					value: item,
				};
			}),
		[t]
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
			title={t("recipe.modal.create.equipment.title")}
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
						isRequired
						label={t("recipe.field.name")}
						name="name"
					/>
					<Input label={t("recipe.field.length")} name="length" type="number" />
					<Input label={t("recipe.field.width")} name="width" type="number" />
					<Input label={t("recipe.field.height")} name="height" type="number" />
					<Controller
						control={control}
						name="dimensionUnit"
						render={({ field: { onChange, value, name } }) => (
							<Select
								label={t("recipe.field.dimensionUnit")}
								name={name}
								options={dimensionUnitOptions}
								selected={value}
								onChange={onChange}
							/>
						)}
					/>
					<Input label={t("recipe.field.volume")} name="volume" type="number" />
					<Controller
						control={control}
						name="volumeUnit"
						render={({ field: { onChange, value, name } }) => (
							<Select
								label={t("recipe.field.volumeUnit")}
								name={name}
								options={volumeUnitOptions}
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

export const action = async ({ request, params: p }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const { lang, recipeId } = EditRecipeWithLangParamsSchema.parse(p);

	const data = await parseFormData<FormData>(request.clone());
	let success = true;

	return await prisma.equipment
		.create({
			data: {
				...data,
				...(await translatedContent({
					request,
					key: "name",
					lang,
					value: data.name,
				})),
				recipeId,
				userId: authData.id,
			},
		})
		.catch(() => (success = false))
		.then(() => json({ success }));
};

export default CreateEquipmentModal;
