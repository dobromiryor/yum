import { zodResolver } from "@hookform/resolvers/zod";
import { SubRecipeAction, TemperatureScale } from "@prisma/client";
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
import { Multiselect } from "~/components/common/UI/Multiselect";
import { Select } from "~/components/common/UI/Select";
import { Textarea } from "~/components/common/UI/Textarea";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { useFilteredValues } from "~/hooks/useFilteredValues";
import i18next from "~/modules/i18next.server";
import { OptionsSchema } from "~/schemas/option.schema";
import { EditRecipeWithLangParamsSchema } from "~/schemas/params.schema";
import { StepDTOSchema } from "~/schemas/step.schema";
import { auth } from "~/utils/auth.server";
import { getInvertedLang } from "~/utils/helpers/get-inverted-lang";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { translatedContent } from "~/utils/helpers/translated-content.server";
import { prisma } from "~/utils/prisma.server";

type FormData = z.infer<typeof StepDTOSchema>;
const resolver = zodResolver(StepDTOSchema);

export const sitemap = () => ({
	exclude: true,
});

const temperatureScaleOptions = OptionsSchema.parse(
	Object.values(TemperatureScale).map((item) => ({
		label: `°${item}`,
		value: item,
	}))
);

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const { recipeId, lang } = EditRecipeWithLangParamsSchema.parse(p);

	const foundRecipe = await prisma.recipe.findUnique({
		where: { id: recipeId },
	});

	if (!foundRecipe) {
		throw new Response(null, { status: 404 });
	}

	if (foundRecipe.userId !== authData.id && authData.role !== "ADMIN") {
		throw new Response(null, { status: 403 });
	}

	const foundIngredients = await prisma.ingredient.findMany({
		where: { recipeId },
		orderBy: { position: "asc" },
	});
	const foundSubRecipes = await prisma.subRecipe.findMany({
		where: { recipeId },
		orderBy: { position: "asc" },
	});
	const foundEquipment = await prisma.equipment.findMany({
		where: { recipeId },
		orderBy: { position: "asc" },
	});

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("common.addSomething", {
			something: `${t("recipe.field.step")}`.toLowerCase(),
		}),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		authData,
		foundEquipment,
		foundIngredients,
		foundSubRecipes,
		lang,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}/recipes/edit/${recipeId}/${lang}/step`,
		},
	});
};

export const CreateStepModal = () => {
	const { foundEquipment, foundIngredients, foundSubRecipes, lang } =
		useLoaderData<typeof loader>();

	const actionData = useActionData<typeof action>();

	const [isOpen, setIsOpen] = useState(true);
	const { t } = useTranslation();
	const { pathname } = useLocation();

	const prevPath = pathname.split("/").slice(0, -1).join("/");

	const { onValid } = useFilteredValues<FormData>();
	const form = useRemixForm<FormData>({
		resolver,
		submitHandlers: {
			onValid,
		},
	});
	const {
		reset,
		handleSubmit,
		control,
		formState: { dirtyFields },
	} = form;

	const invertedLang = getInvertedLang(lang);

	const subRecipeActionOptions = useMemo(
		() =>
			Object.keys(SubRecipeAction).map((item) => {
				const action = z.nativeEnum(SubRecipeAction).parse(item);

				return {
					label: t(`recipe.subRecipeAction.${action}`),
					value: item,
				};
			}),
		[t]
	);
	const ingredientOptions = useMemo(
		() =>
			foundIngredients.map((item) => {
				return {
					label:
						item.name?.[lang as keyof typeof item.name] ??
						item.name?.[invertedLang as keyof typeof item.name] ??
						`[ ${t("error.translationMissing")} ]`,
					value: item.id,
				};
			}),
		[foundIngredients, invertedLang, lang, t]
	);
	const subRecipeOptions = useMemo(
		() =>
			foundSubRecipes.map((item) => {
				return {
					label:
						item.name?.[lang as keyof typeof item.name] ??
						item.name?.[invertedLang as keyof typeof item.name] ??
						`[ ${t("error.translationMissing")} ]`,
					value: item.id,
				};
			}),
		[foundSubRecipes, invertedLang, lang, t]
	);
	const equipmentOptions = useMemo(
		() =>
			foundEquipment.map((item) => {
				return {
					label:
						item.name?.[lang as keyof typeof item.name] ??
						item.name?.[invertedLang as keyof typeof item.name] ??
						`[ ${t("error.translationMissing")} ]`,
					value: item.id,
				};
			}),
		[foundEquipment, invertedLang, lang, t]
	);

	return (
		<Modal
			CTAFn={handleSubmit}
			dismissFn={reset}
			isCTADisabled={!Object.keys(dirtyFields).length}
			isOpen={isOpen}
			prevPath={prevPath}
			setIsOpen={setIsOpen}
			success={actionData?.success}
			title={t("recipe.modal.create.step.title")}
		>
			<RemixFormProvider {...form}>
				<Form
					preventScrollReset
					autoComplete="off"
					className="flex flex-col gap-2"
					onSubmit={handleSubmit}
				>
					<Textarea
						autoFocus
						isRequired
						label={t("recipe.field.description")}
						name="content"
					/>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
						<Input
							label={t("recipe.field.prepTime")}
							name="prepTime"
							type="number"
						/>
						<Input
							label={t("recipe.field.cookTime")}
							name="cookTime"
							type="number"
						/>
						<Input
							label={t("recipe.field.bakeTime")}
							name="bakeTime"
							type="number"
						/>
						<Input
							label={t("recipe.field.restTime")}
							name="restTime"
							type="number"
						/>
					</div>
					<Input
						label={t("recipe.field.temperature")}
						name="temperature"
						type="number"
					/>
					<Controller
						control={control}
						name="temperatureScale"
						render={({ field: { onChange, value, name } }) => (
							<Select
								label={t("recipe.field.temperatureScale")}
								name={name}
								options={temperatureScaleOptions}
								selected={value}
								onChange={onChange}
							/>
						)}
					/>
					<Controller
						control={control}
						name="subRecipeAction"
						render={({ field: { onChange, value, name } }) => (
							<Select
								label={t("recipe.field.subRecipeAction")}
								name={name}
								options={subRecipeActionOptions}
								selected={value}
								onChange={onChange}
							/>
						)}
					/>
					<Controller
						control={control}
						name="subRecipes"
						render={({ field: { onChange, value, name } }) => (
							<Multiselect
								label={t("recipe.field.subRecipes")}
								name={name}
								options={subRecipeOptions}
								selected={value}
								onChange={onChange}
							/>
						)}
					/>
					<Controller
						control={control}
						name="ingredients"
						render={({ field: { onChange, value, name } }) => (
							<Multiselect
								label={t("recipe.field.ingredients")}
								name={name}
								options={ingredientOptions}
								selected={value}
								onChange={onChange}
							/>
						)}
					/>
					<Controller
						control={control}
						name="equipment"
						render={({ field: { onChange, value, name } }) => (
							<Multiselect
								label={t("recipe.field.equipment")}
								name={name}
								options={equipmentOptions}
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

	const { recipeId, lang } = EditRecipeWithLangParamsSchema.parse(p);

	const data = await parseFormData<FormData>(request.clone());

	let success = true;
	const { ingredients, equipment, subRecipes, subRecipeAction, ...rest } = data;

	return await prisma.step
		.create({
			data: {
				...rest,
				...(await translatedContent({
					request,
					key: "content",
					lang,
					value: rest.content,
				})),
				subRecipeAction,
				...(ingredients && {
					ingredients: {
						connect: ingredients.map((item) => ({
							id: item,
						})),
					},
				}),
				...(subRecipes && {
					subRecipes: {
						connect: subRecipes.map((item) => ({
							id: item,
						})),
					},
				}),
				...(equipment && {
					equipment: {
						connect: equipment.map((item) => ({
							id: item,
						})),
					},
				}),
				recipeId,
				userId: authData.id,
			},
		})
		.catch(() => (success = false))
		.then(() => json({ success }));
};

export default CreateStepModal;
