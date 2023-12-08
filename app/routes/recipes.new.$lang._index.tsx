import { zodResolver } from "@hookform/resolvers/zod";
import { Difficulty } from "@prisma/client";
import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
	type TypedResponse,
} from "@remix-run/node";
import { Form, Link, useActionData, useParams } from "@remix-run/react";
import { useMemo } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
	RemixFormProvider,
	parseFormData,
	useRemixForm,
} from "remix-hook-form";
import { type z } from "zod";

import { Button } from "~/components/common/UI/Button";
import { FormError } from "~/components/common/UI/FormError";
import { Input } from "~/components/common/UI/Input";
import { Select } from "~/components/common/UI/Select";
import { Textarea } from "~/components/common/UI/Textarea";
import { Section } from "~/components/recipes/crud/Section";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { useFilteredValues } from "~/hooks/useFilteredValues";
import { useIsLoading } from "~/hooks/useIsLoading";
import i18next from "~/modules/i18next.server";
import { DifficultySchema, LanguageSchema } from "~/schemas/common";
import { OptionsSchema } from "~/schemas/option.schema";
import { CreateRecipeSchema } from "~/schemas/params.schema";
import { NewRecipeSchema } from "~/schemas/recipe.schema";
import { auth } from "~/utils/auth.server";
import { getInvertedLang } from "~/utils/helpers/get-inverted-lang";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import { prisma } from "~/utils/prisma.server";

type FormData = z.infer<typeof NewRecipeSchema>;
const resolver = zodResolver(NewRecipeSchema);

export const sitemap = () => ({
	exclude: true,
});

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request);

	if (!authData) {
		throw new Response(null, { status: 401 });
	}

	const t = await i18next.getFixedT(request);
	const title = generateMetaTitle({
		title: t("seo.newRecipe.title"),
		postfix: PARSED_ENV.APP_NAME,
	});
	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json({
		authData,
		meta: {
			title,
			description,
			url: `${PARSED_ENV.DOMAIN_URL}/recipes/new/${LanguageSchema.parse(
				params.lang
			)}`,
		},
	});
};

const NewRecipeRoute = () => {
	const actionData = useActionData<typeof action>();

	const { t } = useTranslation();
	const [isLoading] = useIsLoading();
	const params = useParams();
	const lang = LanguageSchema.parse(params.lang);
	const invertedLang = getInvertedLang(lang);

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

	const { onValid } = useFilteredValues<FormData>();
	const form = useRemixForm<FormData>({
		resolver,
		submitHandlers: {
			onValid,
		},
	});
	const {
		control,
		handleSubmit,
		formState: { dirtyFields },
	} = form;

	return (
		<Section
			buttons={
				<Link to={`/recipes/new/${invertedLang}`}>
					<Button>{t(`nav.language.${invertedLang}`)}</Button>
				</Link>
			}
			title={t("recipe.heading.new", { lang: t(`nav.language.${lang}`) })}
		>
			<span>{t("recipe.note.translationMessage")}</span>
			<RemixFormProvider {...form}>
				<Form
					preventScrollReset
					autoComplete="off"
					className="flex flex-col gap-2"
					onSubmit={(e) => (isLoading ? e.preventDefault() : handleSubmit(e))}
				>
					<Input
						autoFocus
						isRequired
						label={t("recipe.field.name")}
						name="name"
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
					<FormError
						error={
							typeof actionData?.success === "boolean" && !actionData?.success
								? typeof actionData?.message === "string"
									? actionData.message
									: t("error.somethingWentWrong")
								: undefined
						}
					/>
					<div className="flex justify-end pt-4">
						<Button
							isDisabled={!Object.keys(dirtyFields).length}
							isLoading={isLoading}
							type="submit"
						>
							{t("common.create")}
						</Button>
					</div>
				</Form>
			</RemixFormProvider>
		</Section>
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

	const { lang } = CreateRecipeSchema.parse(p);

	const data = await parseFormData<FormData>(request.clone());

	const foundRecipes = await prisma.recipe.findMany({
		select: { slug: true },
	});

	if (foundRecipes.find((item) => item.slug === data.slug)) {
		const t = await i18next.getFixedT(request);

		return json({
			success: false,
			message: t("error.slugExists"),
		});
	}

	const createdRecipe = await prisma.recipe.create({
		data: {
			...data,
			name: {
				[lang]: data.name,
			},
			description: {
				[lang]: data.description,
			},
			userId: authData.id,
		},
	});

	if (createdRecipe) {
		return redirect(`/recipes/edit/${createdRecipe.id}/${lang}`);
	}

	return json({ success: false });
};

export default NewRecipeRoute;

export { ErrorBoundaryContent as ErrorBoundary } from "~/components/common/ErrorBoundary";
