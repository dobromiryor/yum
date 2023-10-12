import { zodResolver } from "@hookform/resolvers/zod";
import { Difficulty } from "@prisma/client";
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
import { Select } from "~/components/common/UI/Select";
import { Textarea } from "~/components/common/UI/Textarea";
import { Language } from "~/enums/language.enum";
import { DifficultySchema, TranslatedContentSchema } from "~/schemas/common";
import { NewRecipeSchema } from "~/schemas/new-recipe.schema";
import { OptionsSchema } from "~/schemas/option.schema";
import { EditRecipeParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import { getDataSession } from "~/utils/dataStorage.server";
import { recipeLanguageValidation } from "~/utils/helpers/language-validation.server";
import { translatedContent } from "~/utils/helpers/translated-content.server";
import { prisma } from "~/utils/prisma.server";

type FormData = z.infer<typeof NewRecipeSchema>;
const resolver = zodResolver(NewRecipeSchema);

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const { recipeId, lang } = EditRecipeParamsSchema.parse(p);

	const foundRecipe = await prisma.recipe.findFirst({
		where: { id: recipeId },
	});

	if (
		!foundRecipe ||
		(foundRecipe.userId !== authData.id && authData.role !== "ADMIN")
	) {
		return redirect("/recipes");
	}

	const { name, description, languages } = foundRecipe;
	const { setData, commit } = await getDataSession(request);

	setData({ name, description, languages });

	const validation = recipeLanguageValidation({ name, description });

	return json(
		{ authData, foundRecipe, lang, validation },
		{ headers: { "Set-Cookie": await commit() } }
	);
};

export const EditRecipeDetailsModal = () => {
	const [isOpen, setIsOpen] = useState(true);

	const { foundRecipe, lang, validation } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	const { state } = useNavigation();
	const { t } = useTranslation();

	const { pathname } = useLocation();
	const prevPath = pathname.split("/").slice(0, -1).join("/");

	const options = useMemo(
		() =>
			OptionsSchema.parse(
				Object.values(Difficulty).map((item) => {
					const difficulty = DifficultySchema.parse(item);

					return {
						label: t(`recipe.difficulty.${difficulty}`),
						value: item,
					};
				})
			),
		[t]
	);

	const {
		name,
		description,
		bakeTime,
		prepTime,
		cookTime,
		difficulty,
		servings,
		// categories, // TODO
		// tags, // TODO
	} = foundRecipe;

	const parsedName = TranslatedContentSchema.parse(name);
	const parsedDescription = TranslatedContentSchema.parse(description);
	const invertedLang = lang === Language.EN ? Language.BG : Language.EN;

	const form = useRemixForm<FormData>({
		resolver,
		defaultValues: {
			name: name?.[lang as keyof typeof name],
			description: description?.[lang as keyof typeof description],
			difficulty: difficulty,
			prepTime: prepTime ?? undefined,
			bakeTime: bakeTime ?? undefined,
			cookTime: cookTime ?? undefined,
			servings: servings ?? undefined,
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
			title={t("recipe.modal.update.details.title")}
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
						translationContent={parsedName[invertedLang]}
						translationValidation={validation[lang]?.name}
					/>
					<Textarea
						isRequired
						label={t("recipe.field.description")}
						name="description"
						translationContent={parsedDescription[invertedLang]}
						translationValidation={validation[lang]?.description}
					/>
					<Controller
						control={control}
						name="difficulty"
						render={({ field: { onChange, value, name } }) => (
							<Select
								isRequired
								label={t("recipe.field.difficulty")}
								name={name}
								options={options}
								selected={value}
								onChange={onChange}
							/>
						)}
					/>
					<Input
						label={t("recipe.field.withMinutes", {
							field: t("recipe.field.prepTime"),
						})}
						name="prepTime"
						type="number"
					/>
					<Input
						label={t("recipe.field.withMinutes", {
							field: t("recipe.field.cookTime"),
						})}
						name="cookTime"
						type="number"
					/>
					<Input
						label={t("recipe.field.withMinutes", {
							field: t("recipe.field.bakeTime"),
						})}
						name="bakeTime"
						type="number"
					/>
					<Input
						label={t("recipe.field.servings")}
						name="servings"
						type="number"
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

	const { recipeId, lang } = EditRecipeParamsSchema.parse(p);

	const { errors, data } = await getValidatedFormData<FormData>(
		request.clone(),
		resolver
	);

	if (errors) {
		console.error(errors);

		return json({ success: false, errors });
	}

	try {
		await prisma.recipe.update({
			data: {
				...data,
				...(await translatedContent({
					request,
					key: "name",
					lang,
					value: data.name,
				})),
				...(await translatedContent({
					request,
					key: "description",
					lang,
					value: data.description,
				})),
			},
			where: {
				id: recipeId,
			},
		});
	} catch (error) {
		console.error(error);

		return json({ success: false, error });
	}

	return json({ success: true });
};

export default EditRecipeDetailsModal;
