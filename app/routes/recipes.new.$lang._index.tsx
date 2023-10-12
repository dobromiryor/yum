import { zodResolver } from "@hookform/resolvers/zod";
import { Difficulty } from "@prisma/client";
import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, Link, useNavigation, useParams } from "@remix-run/react";
import clsx from "clsx";
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
import { Language } from "~/enums/language.enum";
import i18next, { detectLanguage } from "~/i18next.server";
import { DifficultySchema, LanguageSchema } from "~/schemas/common";
import { NewRecipeSchema } from "~/schemas/new-recipe.schema";
import { OptionsSchema } from "~/schemas/option.schema";
import { auth } from "~/utils/auth.server";
import { prisma } from "~/utils/prisma.server";

type FormData = z.infer<typeof NewRecipeSchema>;
const resolver = zodResolver(NewRecipeSchema);

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request, {
		failureRedirect: "/login",
	});

	return json({ authData });
};

const NewRecipeRoute = () => {
	const { t } = useTranslation();
	const { state } = useNavigation();
	const params = useParams();
	const lang = LanguageSchema.parse(params.lang);
	const invertedLang = lang === Language.EN ? Language.BG : Language.EN;

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
					className={clsx(
						"flex flex-col gap-2",
						state === "submitting" && "animate-pulse"
					)}
					onSubmit={handleSubmit}
				>
					<Input isRequired label={t("recipe.field.name")} name="name" />
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
						label={t("recipe.field.servings")}
						name="servings"
						type="number"
					/>
					<div className="flex justify-end pt-4">
						<Button type="submit">{t("common.create")}</Button>
					</div>
				</Form>
			</RemixFormProvider>
		</Section>
	);
};

export const action = async ({ request }: ActionFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const lang = detectLanguage(request.clone());

	const t = await i18next.getFixedT(request.clone());

	const { errors, data } = await getValidatedFormData<FormData>(
		request,
		resolver
	);

	if (errors) {
		return json({ ok: false, errors });
	}

	let newRecipe;

	if (data) {
		try {
			newRecipe = await prisma.recipe.create({
				data: {
					...data,
					name: { [String(lang)]: data.name },
					description: { [String(lang)]: data.description },
					userId: authData.id,
				},
			});
		} catch (e) {
			throw new Error(t("error.somethingWentWrong", errors));
		}
	}

	return redirect(`/recipes/${newRecipe?.id}/${lang}`);
};

export default NewRecipeRoute;
