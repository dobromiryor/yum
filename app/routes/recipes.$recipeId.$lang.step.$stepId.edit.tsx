import { zodResolver } from "@hookform/resolvers/zod";
import { TemperatureScale } from "@prisma/client";
import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from "@remix-run/node";
import {
	Form,
	useActionData,
	useLoaderData,
	useLocation,
	useNavigation,
} from "@remix-run/react";
import { useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
	RemixFormProvider,
	getValidatedFormData,
	useRemixForm,
} from "remix-hook-form";
import { type z } from "zod";

import { Modal } from "~/components/common/Modal";
import { Input } from "~/components/common/UI/Input";
import { Multiselect } from "~/components/common/UI/Multiselect";
import { Select } from "~/components/common/UI/Select";
import { Textarea } from "~/components/common/UI/Textarea";
import { Language } from "~/enums/language.enum";
import { TranslatedContentSchema } from "~/schemas/common";
import { OptionsSchema } from "~/schemas/option.schema";
import { EditRecipeStepParamsSchema } from "~/schemas/params.schema";
import { StepDTOSchema } from "~/schemas/step.schema";
import { auth } from "~/utils/auth.server";
import { getDataSession } from "~/utils/dataStorage.server";
import { stepLanguageValidation } from "~/utils/helpers/language-validation.server";
import { translatedContent } from "~/utils/helpers/translated-content.server";
import { prisma } from "~/utils/prisma.server";

type FormData = z.infer<typeof StepDTOSchema>;
const resolver = zodResolver(StepDTOSchema);

const temperatureScaleOptions = OptionsSchema.parse(
	Object.values(TemperatureScale).map((item) => ({
		label: `°${item}`,
		value: item,
	}))
);

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const { recipeId, lang, stepId } = EditRecipeStepParamsSchema.parse(p);

	const foundStep = await prisma.step.findFirst({
		where: { id: stepId },
		include: { ingredients: { orderBy: { position: "asc" } } },
	});

	if (!foundStep) {
		return redirect(`/recipes/${recipeId}/${lang}`);
	}

	if (foundStep.userId !== authData.id && authData.role !== "ADMIN") {
		return redirect("/recipes");
	}

	const { content } = foundStep;
	const { setData, commit } = await getDataSession(request);

	setData({ content });

	const validation = stepLanguageValidation({ content });

	const ingredients = await prisma.ingredient.findMany({
		where: { recipeId },
		orderBy: { position: "asc" },
	});

	return json(
		{ authData, foundStep, ingredients, lang, validation },
		{ headers: { "Set-Cookie": await commit() } }
	);
};

export const EditStepModal = () => {
	const [isOpen, setIsOpen] = useState(true);

	const { foundStep, ingredients, lang, validation } =
		useLoaderData<typeof loader>();

	const actionData = useActionData<typeof action>();

	const { t } = useTranslation();
	const { state } = useNavigation();

	const { pathname } = useLocation();
	const prevPath = pathname.split("/").slice(0, -3).join("/");

	const {
		content,
		temperature,
		temperatureScale,
		ingredients: stepIngredients,
	} = foundStep;

	const parsedContent = TranslatedContentSchema.parse(content);
	const invertedLang = lang === Language.EN ? Language.BG : Language.EN;

	const ingredientOptions = useMemo(
		() =>
			ingredients.map((item) => {
				return {
					label:
						item.name?.[lang as keyof typeof item.name] ??
						item.name?.[invertedLang as keyof typeof item.name] ??
						t("error.translationMissing"),
					value: item.id,
				};
			}),
		[ingredients, invertedLang, lang, t]
	);

	const form = useRemixForm<FormData>({
		resolver,
		defaultValues: {
			content: parsedContent?.[lang] ?? undefined,
			temperature: temperature ?? undefined,
			temperatureScale: temperatureScale ?? undefined,
			ingredients: stepIngredients.map((item) => item.id) ?? undefined,
		},
		submitConfig: {
			method: "patch",
		},
	});
	const {
		reset,
		handleSubmit,
		control,
		formState: { isDirty },
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
			title={t("recipe.modal.update.step.title")}
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
						translationContent={parsedContent[invertedLang]}
						translationValidation={validation[lang]?.content}
					/>
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
				</Form>
			</RemixFormProvider>
		</Modal>
	);
};

export const action = async ({ request, params: p }: ActionFunctionArgs) => {
	await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const { lang, stepId } = EditRecipeStepParamsSchema.parse(p);

	const { errors, data } = await getValidatedFormData<FormData>(
		request.clone(),
		resolver
	);

	if (errors) {
		console.error(errors);

		return json({ success: false, errors });
	}

	try {
		const { content, ingredients, temperature, temperatureScale } = data;
		const updatedStep = await prisma.step.update({
			data: {
				...(await translatedContent({
					request,
					key: "content",
					lang,
					value: content,
				})),
				temperature,
				temperatureScale,
			},
			where: {
				id: stepId,
			},
		});

		if (ingredients) {
			await prisma.$transaction(
				ingredients.map((item, index) =>
					prisma.ingredient.update({
						data: {
							stepId: updatedStep.id,
							stepPosition: index + 1,
						},
						where: { id: item },
					})
				)
			);
		}
	} catch (error) {
		console.error(error);

		return json({ success: false, error });
	}

	return json({ success: true });
};

export default EditStepModal;
