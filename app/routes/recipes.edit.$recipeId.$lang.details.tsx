import { zodResolver } from "@hookform/resolvers/zod";
import { Difficulty, Status } from "@prisma/client";
import {
	json,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
	type TypedResponse,
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
	parseFormData,
	useRemixForm,
} from "remix-hook-form";
import { type z } from "zod";

import { Modal } from "~/components/common/Modal";
import { FormError } from "~/components/common/UI/FormError";
import { Input } from "~/components/common/UI/Input";
import { Multiselect } from "~/components/common/UI/Multiselect";
import { Select } from "~/components/common/UI/Select";
import { Textarea } from "~/components/common/UI/Textarea";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { useFilteredValues } from "~/hooks/useFilteredValues";
import i18next from "~/modules/i18next.server";
import {
	DifficultySchema,
	NonNullTranslatedContentSchema,
	TranslatedContentSchema,
} from "~/schemas/common";
import { OptionsSchema } from "~/schemas/option.schema";
import { EditRecipeWithLangParamsSchema } from "~/schemas/params.schema";
import { EditRecipeSchema } from "~/schemas/recipe.schema";
import { auth } from "~/utils/auth.server";
import { getDataSession } from "~/utils/dataStorage.server";
import { getInvertedLang } from "~/utils/helpers/get-inverted-lang";
import { recipeLanguageValidation } from "~/utils/helpers/language-validation.server";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { translatedContent } from "~/utils/helpers/translated-content.server";
import { prisma } from "~/utils/prisma.server";
import { getThemeSession } from "~/utils/theme.server";

type FormData = z.infer<typeof EditRecipeSchema>;
const resolver = zodResolver(EditRecipeSchema);

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

	const { recipeId, lang } = EditRecipeWithLangParamsSchema.parse(p);

	const foundRecipe = await prisma.recipe.findFirst({
		where: { id: recipeId },
		include: { categories: true },
	});

	if (!foundRecipe) {
		throw new Response(null, { status: 404 });
	}

	if (foundRecipe.userId !== authData.id && authData.role !== "ADMIN") {
		throw new Response(null, { status: 403 });
	}

	const foundCategories = await prisma.category.findMany({
		where: { status: Status.PUBLISHED },
	});

	const { name, description, languages } = foundRecipe;
	const { setData, commit } = await getDataSession(request);

	setData({ name, description, languages });

	const validation = recipeLanguageValidation({ name, description });

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("common.editSomething", {
			something: `${t("recipe.section.details")}`.toLowerCase(),
		}),
		postfix: PARSED_ENV.APP_NAME,
	});
	const metaDescription = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json(
		{
			authData,
			foundRecipe,
			foundCategories,
			lang,
			validation,
			meta: {
				title,
				description: metaDescription,
				url: `${PARSED_ENV.DOMAIN_URL}`,
				path: `/recipes/edit/${recipeId}/${lang}/details`,
				theme: (await getThemeSession(request)).getTheme(),
			},
		},
		{ headers: { "Set-Cookie": await commit() } }
	);
};

export const EditRecipeDetailsModal = () => {
	const [isOpen, setIsOpen] = useState(true);

	const { foundRecipe, foundCategories, lang, validation } =
		useLoaderData<typeof loader>();
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

	const categoryOptions = useMemo(
		() =>
			OptionsSchema.parse(
				foundCategories.map((category) => {
					const name = NonNullTranslatedContentSchema.parse(category.name);

					return {
						label: name[lang],
						value: category.id,
					};
				})
			),
		[foundCategories, lang]
	);

	const {
		name,
		slug,
		description,
		difficulty,
		servings,
		categories,
		// tags, // TODO
	} = foundRecipe;

	const parsedName = TranslatedContentSchema.parse(name);
	const parsedDescription = TranslatedContentSchema.parse(description);
	const invertedLang = getInvertedLang(lang);

	const { onValid } = useFilteredValues<FormData>({
		submitOptions: { method: "PATCH" },
	});
	const form = useRemixForm<FormData>({
		resolver,
		defaultValues: {
			name: name?.[lang as keyof typeof name],
			slug: slug ?? undefined,
			description: description?.[lang as keyof typeof description],
			difficulty: difficulty,
			servings: servings ?? undefined,
			categories: categories.map(({ id }) => id) ?? undefined,
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
					<Input
						isRequired
						explanation={t("explanation.slug")}
						explanationIcon="regular_expression"
						label={t("recipe.field.slug")}
						name="slug"
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
						isRequired
						label={t("recipe.field.servings")}
						max={20}
						min={1}
						name="servings"
						type="number"
					/>
					<Controller
						control={control}
						name="categories"
						render={({ field: { onChange, value, name } }) => (
							<Multiselect
								label={t("recipe.field.categories")}
								name={name}
								options={categoryOptions}
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
						? typeof actionData?.message === "string"
							? actionData.message
							: t("error.somethingWentWrong")
						: undefined
				}
			/>
		</Modal>
	);
};

export const action = async ({
	request,
	params: p,
}: ActionFunctionArgs): Promise<
	TypedResponse<{
		success: boolean;
		message?: string;
	}>
> => {
	const authData = await auth.isAuthenticated(request.clone());

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const { recipeId, lang } = EditRecipeWithLangParamsSchema.parse(p);

	const { name, description, categories, ...rest } =
		await parseFormData<FormData>(request.clone());

	let success = true;

	const foundRecipes = await prisma.recipe.findMany({
		select: { slug: true },
	});

	if (foundRecipes.find((item) => item.slug === rest.slug)) {
		const t = await i18next.getFixedT(request);

		return json({
			success: false,
			message: t("error.slugExists"),
		});
	}

	await prisma.recipe
		.update({
			data: {
				...(await translatedContent({
					request,
					key: "name",
					lang,
					value: name,
				})),
				...(await translatedContent({
					request,
					key: "description",
					lang,
					value: description,
				})),
				...(categories && {
					categories: {
						set: [],
						connect: categories.map((item) => ({
							id: item,
						})),
					},
				}),
				...rest,
			},
			where: {
				id: recipeId,
			},
		})
		.catch(() => (success = false));

	return json({ success });
};

export default EditRecipeDetailsModal;
