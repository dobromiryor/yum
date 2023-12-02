import { zodResolver } from "@hookform/resolvers/zod";
import { Prisma, Unit } from "@prisma/client";
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
import { Input } from "~/components/common/UI/Input";
import { Select } from "~/components/common/UI/Select";
import { Textarea } from "~/components/common/UI/Textarea";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { useFilteredValues } from "~/hooks/useFilteredValues";
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
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { parseQuantity } from "~/utils/helpers/parse-quantity.server";
import {
	nullishTranslatedContent,
	translatedContent,
} from "~/utils/helpers/translated-content.server";
import { prisma } from "~/utils/prisma.server";

type FormData = z.infer<typeof IngredientDTOSchema>;
const resolver = zodResolver(IngredientDTOSchema);

export const sitemap = () => ({
	exclude: true,
});

const options = OptionsSchema.parse(
	Object.values(Unit).map((item) => ({
		label: item.replace("_", " "),
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

	const t = await i18next.getFixedT(request.clone());

	const { recipeId, lang, ingredientId } =
		EditRecipeIngredientParamsSchema.parse(p);

	const foundIngredient = await prisma.ingredient.findFirst({
		where: { id: ingredientId },
	});

	if (!foundIngredient) {
		throw new Response(null, { status: 404 });
	}

	if (foundIngredient.userId !== authData.id && authData.role !== "ADMIN") {
		throw new Response(null, { status: 403 });
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
				`[ ${t("error.translationMissing")} ]`,
			value: item.id,
		}))
	);

	const { name, note } = foundIngredient;
	const { setData, commit } = await getDataSession(request);

	setData({ name, note });

	const validation = ingredientLanguageValidation({ name, note });

	const title = generateMetaTitle({
		title: t("common.editSomething", {
			something: `${t("recipe.field.ingredient")}`.toLowerCase(),
		}),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json(
		{
			authData,
			foundIngredient,
			lang,
			validation,
			subRecipeOptions,
			meta: {
				title,
				description,
				url: `${PARSED_ENV.DOMAIN_URL}/recipes/edit/${recipeId}/${lang}/ingredient/${ingredientId}/edit`,
			},
		},
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

	const { onValid } = useFilteredValues<FormData>({
		submitOptions: { method: "PATCH" },
	});
	const form = useRemixForm<FormData>({
		resolver,
		defaultValues: {
			name: name?.[lang as keyof typeof name] ?? "",
			note: note?.[lang as keyof typeof note] ?? "",
			quantity: quantity ?? undefined,
			unit: unit ?? undefined,
		},
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
						isRequired={!validation[lang]?.note}
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

	const { lang, ingredientId } = EditRecipeIngredientParamsSchema.parse(p);

	const data = await parseFormData<FormData>(request.clone());

	const foundIngredient = await prisma.ingredient.findUnique({
		where: {
			id: ingredientId,
		},
	});

	if (!foundIngredient) {
		throw new Response(null, { status: 404 });
	}

	const parsedNote = OptionalTranslatedContentSchema.parse(
		foundIngredient.note
	);

	const { name, note: n, quantity, unit, subRecipeId } = data;

	const note = async () => {
		//  this is painful 🥴

		if (n) {
			// note field filled -> replace note

			const content = await nullishTranslatedContent({
				request,
				key: "note",
				lang,
				value: n,
			});

			return content?.note;
		} else {
			// note field empty

			if (parsedNote) {
				// foundRecipe has notes

				const keys = Object.keys(parsedNote);

				if (keys.includes(lang)) {
					// parsed note includes current lang

					const values = Object.values(parsedNote).filter((item) => item);

					if (values.length > 1) {
						// both langs have values -> null only current lang

						const content = await nullishTranslatedContent({
							request,
							key: "note",
							lang,
							value: null,
						});

						return content?.note;
					} else {
						// only one lang has value

						if (!parsedNote[lang]) {
							// current lang is nullish -> undefined

							return undefined;
						} else {
							// current lang has value -> prisma null

							return Prisma.JsonNull;
						}
					}
				} else {
					// parsed note doesn't include lang -> undefined

					return undefined;
				}
			} else {
				// foundRecipe doesn't have notes

				return undefined;
			}
		}
	};

	let success = true;

	return await prisma.ingredient
		.update({
			data: {
				...(await translatedContent({
					request,
					key: "name",
					lang,
					value: name,
				})),
				note: await note(),
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
		})
		.catch(() => (success = false))
		.then(() => json({ success }));
};

export default EditIngredientModal;
