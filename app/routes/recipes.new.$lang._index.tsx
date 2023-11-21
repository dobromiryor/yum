import { zodResolver } from "@hookform/resolvers/zod";
import { Difficulty } from "@prisma/client";
import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	type MetaFunction,
} from "@remix-run/node";
import { Form, Link, useParams } from "@remix-run/react";
import { useMemo } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
	RemixFormProvider,
	getValidatedFormData,
	useRemixForm,
} from "remix-hook-form";
import { type z } from "zod";

import { Button } from "~/components/common/UI/Button";
import { Input } from "~/components/common/UI/Input";
import { Select } from "~/components/common/UI/Select";
import { Textarea } from "~/components/common/UI/Textarea";
import { Section } from "~/components/recipes/crud/Section";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import { useIsLoading } from "~/hooks/useIsLoading";
import i18next from "~/modules/i18next.server";
import { DifficultySchema, LanguageSchema } from "~/schemas/common";
import { NewRecipeSchema } from "~/schemas/new-recipe.schema";
import { OptionsSchema } from "~/schemas/option.schema";
import { CreateRecipeSchema } from "~/schemas/params.schema";
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
	const authData = await auth.isAuthenticated(request, {
		failureRedirect: "/401",
	});

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

	const form = useRemixForm<FormData>({
		resolver,
		submitConfig: {
			method: "post",
		},
	});
	const { control, handleSubmit } = form;

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
					<div className="flex justify-end pt-4">
						<Button isLoading={isLoading} type="submit">
							{t("common.create")}
						</Button>
					</div>
				</Form>
			</RemixFormProvider>
		</Section>
	);
};

export const action = async ({ request, params: p }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/401",
	});

	const { lang } = CreateRecipeSchema.parse(p);

	const { errors, data } = await getValidatedFormData<FormData>(
		request.clone(),
		resolver
	);

	if (errors) {
		return json({ ok: false, errors });
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
