import { Role } from "@prisma/client";
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useRevalidator } from "@remix-run/react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Avatar } from "~/components/common/Avatar";
import { Pill } from "~/components/common/Pill";
import { Button } from "~/components/common/UI/Button";
import { Icon } from "~/components/common/UI/Icon";
import { Image } from "~/components/common/UI/Image";
import { ParagraphMap } from "~/components/common/UI/ParagraphMap";
import { EquipmentCard } from "~/components/recipes/detail/Equipment";
import { IngredientCard } from "~/components/recipes/detail/Ingredient";
import { StepList } from "~/components/recipes/detail/Step";
import { SubRecipeCardList } from "~/components/recipes/detail/SubRecipeCardList";
import i18next from "~/modules/i18next.server";
import { CloudinaryUploadApiResponseWithBlurHashSchema } from "~/schemas/cloudinary.schema";
import { LanguageSchema, TranslatedContentSchema } from "~/schemas/common";
import { RecipeParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import { formatTime } from "~/utils/helpers/format-time";
import { getDisplayName } from "~/utils/helpers/get-display-name";
import { recipeDetails } from "~/utils/recipe.server";

export const loader = async ({ request, params: p }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone());
	const { recipeId } = RecipeParamsSchema.parse(p);
	const locale = LanguageSchema.parse(await i18next.getLocale(request.clone()));

	const foundRecipe = await recipeDetails({ recipeId, locale });

	if (!foundRecipe) {
		return redirect("/recipes");
	}

	return json({ authData, foundRecipe, locale });
};

const RecipeDetailRoute = () => {
	const {
		authData,
		foundRecipe: {
			updatedAt,
			name: n,
			description: d,
			user,
			ingredients,
			steps,
			subRecipes,
			equipment,
			bakeTime,
			cookTime,
			prepTime,
			restTime,
			totalTime,
			difficulty,
			languages,
			servings,
			photo: p,
		},
		locale,
	} = useLoaderData<typeof loader>();
	const {
		t,
		i18n: { language },
	} = useTranslation();
	const revalidator = useRevalidator();

	const [servingsCount, setServingsCount] = useState<number>(servings ?? 1);

	const lang = LanguageSchema.parse(language);

	const name = TranslatedContentSchema.parse(n);
	const description = TranslatedContentSchema.parse(d);
	const photo =
		CloudinaryUploadApiResponseWithBlurHashSchema.nullable().parse(p);

	useEffect(() => {
		if (locale !== lang) {
			revalidator.revalidate();
		}
	}, [lang, locale, revalidator]);

	return (
		<article className="grid grid-cols-2 gap-3">
			{photo && (
				<section
					className={clsx(
						"col-span-2 sm:col-span-1 p-3 bg-secondary dark:bg-primary rounded-2xl shadow-lg transition-colors"
					)}
				>
					<Image className="rounded-xl overflow-hidden" photo={photo} />
				</section>
			)}
			<section
				className={clsx(
					"relative col-span-2 flex flex-col justify-between gap-3 p-3 bg-secondary dark:bg-primary rounded-2xl shadow-lg transition-colors",
					photo ? "items-center sm:col-span-1" : ""
				)}
			>
				<div>{/* placeholder */}</div>
				<div className="flex flex-col sm:items-center gap-3">
					<h1
						className={clsx(
							"flex gap-2 text-2xl md:text-3xl lg:text-4xl typography-bold sm:typography-extrabold",
							photo && "sm:text-center"
						)}
					>
						{name[locale]}
					</h1>
					<Link
						className="inline-flex items-center gap-2"
						to={`/users/${user.id}`}
					>
						<Avatar layout="fixed" size="20" user={user} variant="circle" />
						<span className="text-sm typography-medium">
							{getDisplayName(user)}
						</span>
					</Link>
				</div>
				<div className="flex gap-2 flex-wrap">
					{!!difficulty && (
						<Pill
							icon="readiness_score"
							label={t(`recipe.difficulty.${difficulty}`)}
							tooltip={t("recipe.field.difficulty")}
						/>
					)}
					{!!servings && (
						<div className="flex gap-1">
							<Button
								isDisabled={servingsCount <= 1}
								rounded="full"
								variant="normal"
								onClick={() => setServingsCount((prev) => prev - 1)}
							>
								<Icon label="-" name="remove" />
							</Button>
							<Pill
								icon="group"
								label={servingsCount}
								tooltip={t("recipe.field.servings")}
							/>
							<Button
								isDisabled={servingsCount >= 20}
								rounded="full"
								variant="normal"
								onClick={() => setServingsCount((prev) => prev + 1)}
							>
								<Icon label="+" name="add" />
							</Button>
						</div>
					)}
					{!!totalTime && (
						<Pill
							icon="timer"
							label={formatTime(totalTime, t)}
							tooltip={t("recipe.field.totalTime")}
						/>
					)}
					{!!prepTime && (
						<Pill
							icon="countertops"
							label={formatTime(prepTime, t)}
							tooltip={t("recipe.field.prepTime")}
						/>
					)}
					{!!cookTime && (
						<Pill
							icon="cooking"
							label={formatTime(cookTime, t)}
							tooltip={t("recipe.field.cookTime")}
						/>
					)}
					{!!bakeTime && (
						<Pill
							icon="oven_gen"
							label={formatTime(bakeTime, t)}
							tooltip={t("recipe.field.bakeTime")}
						/>
					)}
					{!!restTime && (
						<Pill
							icon="update"
							label={formatTime(restTime, t)}
							tooltip={t("recipe.field.restTime")}
						/>
					)}
					{languages.length > 0 &&
						languages.map((item) => {
							const parsedLang = LanguageSchema.parse(item);

							return (
								<Pill
									key={`Language__Pill__${item}`}
									icon="translate"
									label={t(`nav.language.${parsedLang}`)}
									tooltip={t("nav.language.label")}
								/>
							);
						})}
					<Pill
						icon="calendar_today"
						label={new Date(updatedAt).toLocaleDateString()}
						tooltip={t("recipe.field.lastUpdate", {
							date: new Date(updatedAt).toLocaleDateString(),
							interpolation: { escapeValue: false },
						})}
					/>
				</div>
				{(authData?.id === user.id || authData?.role === Role.ADMIN) && (
					<Link
						className="absolute right-3 top-3"
						tabIndex={-1}
						to={`${locale}`}
					>
						<Button rounded="full" variant="normal">
							<Icon
								label={t("common.editSomething", {
									something: t("common.recipe").toLowerCase(),
								})}
								name="edit"
							/>
						</Button>
					</Link>
				)}
			</section>
			{/* DESCRIPTION */}
			<section className="col-span-2 flex flex-col gap-3">
				<h2 className="text-xl typography-medium">
					{t("recipe.field.description")}
				</h2>
				<div className="flex flex-col gap-1.5 p-3 bg-secondary dark:bg-primary rounded-2xl shadow-lg transition-colors">
					<ParagraphMap text={description[locale]} />
				</div>
			</section>
			{/* INGREDIENTS + SUBRECIPE INGREDIENTS + EQUIPMENT */}
			{(!!ingredients.length || !!subRecipes.length || !!equipment.length) && (
				<section className="col-span-2 flex flex-col gap-3">
					<h2 className="text-xl typography-medium">
						{equipment.length > 0
							? t("recipe.section.ingredientsAndEquipment")
							: t("recipe.section.ingredients")}
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<IngredientCard
							ingredients={ingredients}
							servings={servings ?? 1}
							servingsCount={servingsCount}
							title={
								subRecipes.length > 0 || equipment.length > 0
									? t("recipe.section.mainIngredients")
									: null
							}
						/>
						<SubRecipeCardList
							servings={servings ?? 1}
							servingsCount={servingsCount}
							subRecipes={subRecipes}
						/>
						<EquipmentCard
							equipment={equipment}
							title={t("recipe.section.equipment")}
						/>
					</div>
				</section>
			)}
			{/* STEPS */}
			{!!steps.length && (
				<section className="col-span-2 flex flex-col gap-3">
					<h2 className="text-xl typography-medium">
						{t("recipe.section.steps")}
					</h2>
					<StepList
						servings={servings ?? 1}
						servingsCount={servingsCount}
						steps={steps}
					/>
				</section>
			)}
		</article>
	);
};

export default RecipeDetailRoute;
