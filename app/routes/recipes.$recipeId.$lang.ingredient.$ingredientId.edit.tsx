import { zodResolver } from "@hookform/resolvers/zod";
import { Prisma, Unit } from "@prisma/client";
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
import { Input } from "~/components/common/UI/Input";
import { Select } from "~/components/common/UI/Select";
import { Textarea } from "~/components/common/UI/Textarea";
import i18next from "~/modules/i18next.server";
import {
	OptionalTranslatedContentSchema,
	TranslatedContentSchema,
} from "~/schemas/common";
import { IngredientDTOSchema } from "~/schemas/ingredient.schema";
import { OptionsSchema } from "~/schemas/option.schema";
import { EditRecipeIngredientParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import { getDataSession } from "~/utils/dataStorage.server";
import { getInvertedLang } from "~/utils/helpers/get-inverted-lang";
import { ingredientLanguageValidation } from "~/utils/helpers/language-validation.server";
import { parseQuantity } from "~/utils/helpers/parse-quantity.server";
import {
	nullishTranslatedContent,
	translatedContent,
} from "~/utils/helpers/translated-content.server";
import { prisma } from "~/utils/prisma.server";

type FormData = z.infer<typeof IngredientDTOSchema>;
const resolver = zodResolver(IngredientDTOSchema);

const options = OptionsSchema.parse(
	Object.values(Unit).map((item) => ({
		label: item.replace("_", " "),
		value: item,
	}))
);

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});
	const t = await i18next.getFixedT(request.clone());

	const { recipeId, lang, ingredientId } =
		EditRecipeIngredientParamsSchema.parse(p);

	const foundIngredient = await prisma.ingredient.findFirst({
		where: { id: ingredientId },
	});

	if (!foundIngredient) {
		return redirect(`/recipes/${recipeId}/${lang}`);
	}

	if (
		!foundIngredient ||
		(foundIngredient.userId !== authData.id && authData.role !== "ADMIN")
	) {
		return redirect("/recipes");
	}

	const invertedLang = getInvertedLang(lang);

	const foundSubRecipes = await prisma.subRecipe.findMany({
		where: { recipeId },
	});
	const subRecipeOptions = OptionsSchema.parse(
		foundSubRecipes.map((item) => ({
			label:
				item.name?.[lang as keyof typeof item.name] ??
				item.name?.[invertedLang as keyof typeof item.name] ??
				t("error.translationMissing"),
			value: item.id,
		}))
	);

	const { name, note } = foundIngredient;
	const { setData, commit } = await getDataSession(request);

	setData({ name, note });

	const validation = ingredientLanguageValidation({ name, note });

	return json(
		{ authData, foundIngredient, lang, validation, subRecipeOptions },
		{ headers: { "Set-Cookie": await commit() } }
	);
};

export const EditIngredientModal = () => {
	const [isOpen, setIsOpen] = useState(true);

	const { foundIngredient, lang, validation, subRecipeOptions } =
		useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();

	const { t } = useTranslation();
	const { state } = useNavigation();
	const { pathname } = useLocation();

	const prevPath = pathname.split("/").slice(0, -3).join("/");

	const { name, note, quantity, unit } = foundIngredient;

	const parsedName = TranslatedContentSchema.parse(name);
	const parsedNote = OptionalTranslatedContentSchema.parse(note);
	const invertedLang = getInvertedLang(lang);

	const form = useRemixForm<FormData>({
		resolver,
		defaultValues: {
			name: name?.[lang as keyof typeof name] ?? "",
			note: note?.[lang as keyof typeof note] ?? "",
			quantity: quantity ?? undefined,
			unit: unit ?? undefined,
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
			title={t("recipe.modal.update.ingredient.title")}
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
					<Controller
						control={control}
						name="unit"
						render={({ field: { onChange, value, name } }) => (
							<Select
								label={t("recipe.field.unit")}
								name={name}
								options={options}
								selected={value}
								onChange={onChange}
							/>
						)}
					/>
					<Input label={t("recipe.field.quantity")} name="quantity" />
					<Textarea
						label={t("recipe.field.note")}
						name="note"
						translationContent={parsedNote?.[invertedLang]}
						translationValidation={validation[lang]?.note}
					/>
					<Controller
						control={control}
						name="subRecipeId"
						render={({ field: { onChange, value, name } }) => (
							<Select
								label={t("recipe.field.subRecipe")}
								name={name}
								options={subRecipeOptions}
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

	const { lang, ingredientId } = EditRecipeIngredientParamsSchema.parse(p);

	const { errors, data } = await getValidatedFormData<FormData>(
		request.clone(),
		resolver
	);

	if (errors) {
		return json({ success: false, errors });
	}

	try {
		const { name, note, quantity, unit, subRecipeId } = data;

		await prisma.ingredient.update({
			data: {
				...(await translatedContent({
					request,
					key: "name",
					lang,
					value: name,
				})),
				...(await nullishTranslatedContent({
					request,
					lang,
					key: "note",
					value: note,
				})),
				quantity:
					quantity === null
						? null
						: quantity === undefined
						? undefined
						: new Prisma.Decimal(parseQuantity(quantity)),
				unit,
				subRecipeId,
			},
			where: {
				id: ingredientId,
			},
		});
	} catch (error) {
		console.error(error);

		return json({ success: false, error });
	}

	return json({ success: true });
};

export default EditIngredientModal;
