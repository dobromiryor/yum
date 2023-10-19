import {
	Status,
	type Ingredient,
	type Recipe,
	type Step,
} from "@prisma/client";
import {
	json,
	redirect,
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
} from "@remix-run/node";
import {
	Link,
	Outlet,
	useActionData,
	useLoaderData,
	useNavigation,
	useSubmit,
} from "@remix-run/react";
import clsx from "clsx";
import { Reorder } from "framer-motion";
import isEqual from "lodash.isequal";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/common/UI/Button";
import { Switch } from "~/components/common/UI/Switch";
import { Card } from "~/components/recipes/crud/Card";
import { EmptyCard } from "~/components/recipes/crud/EmptyCard";
import { ErrorCount } from "~/components/recipes/crud/ErrorCount";
import { Figure } from "~/components/recipes/crud/Figure";
import { IngredientString } from "~/components/recipes/crud/Ingredient";
import { ReorderCard } from "~/components/recipes/crud/ReorderCard";
import { Section } from "~/components/recipes/crud/Section";
import { TemperatureString } from "~/components/recipes/crud/Temperature";
import { Language } from "~/enums/language.enum";
import i18next from "~/i18next.server";
import {
	OptionalTranslatedContentSchema,
	SessionDataStorageSchema,
	TranslatedContentSchema,
} from "~/schemas/common";
import {
	EditRecipeIntentDTOSchema,
	EditRecipeIntentSchema,
} from "~/schemas/intent.schema";
import { EditRecipeParamsSchema } from "~/schemas/params.schema";
import { auth } from "~/utils/auth.server";
import { getDataSession } from "~/utils/dataStorage.server";
import { debounce } from "~/utils/helpers/debounce";
import { formatTime } from "~/utils/helpers/format-time";
import { languageValidation } from "~/utils/helpers/language-validation.server";
import { parseWithMessage } from "~/utils/helpers/parse-with-message.server";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ params: p, request }: LoaderFunctionArgs) => {
	const authData = await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});
	const params = EditRecipeParamsSchema.parse(p);
	const { recipeId, lang } = params;

	const foundRecipe = await prisma.recipe.findFirst({
		where: { id: params.recipeId },
	});

	if (
		!foundRecipe ||
		(foundRecipe.userId !== authData.id && authData.role !== "ADMIN")
	) {
		return redirect("/recipes");
	}

	const foundSubRecipes = await prisma.subRecipe.findMany({
		where: { recipeId },
	});

	const foundIngredients = await prisma.ingredient.findMany({
		where: { recipeId },
		orderBy: { position: "asc" },
		include: { subRecipe: true },
	});

	const foundSteps = await prisma.step.findMany({
		where: { recipeId },
		orderBy: { position: "asc" },
		include: {
			ingredients: {
				orderBy: {
					stepPosition: "asc",
				},
			},
		},
	});

	const { languages } = foundRecipe;
	const { setData, commit } = await getDataSession(request);

	setData({ languages });

	const validation = languageValidation({
		foundIngredients: foundIngredients.map(({ name, note }) => ({
			name,
			note,
		})),
		foundRecipe: {
			name: foundRecipe.name,
			description: foundRecipe.description,
		},
		foundSteps: foundSteps.map(({ content }) => ({
			content,
		})),
		foundSubRecipes: foundSubRecipes.map(({ name }) => ({
			name,
		})),
	});

	const invertedLang = lang === Language.EN ? Language.BG : Language.EN;

	if (
		validation &&
		lang &&
		validation[lang]!.count > 0 &&
		foundRecipe.languages.includes(lang)
	) {
		await prisma.recipe.update({
			data: {
				languages: foundRecipe.languages.filter((item) => item !== lang).sort(),
			},
			where: { id: recipeId },
		});
	}

	return json(
		{
			authData,
			foundRecipe,
			foundIngredients,
			foundSteps,
			foundSubRecipes,
			validation,
			lang,
			invertedLang,
		},
		{ headers: { "Set-Cookie": await commit() } }
	);
};

export const action = async ({ request, params: p }: ActionFunctionArgs) => {
	await auth.isAuthenticated(request.clone(), {
		failureRedirect: "/login",
	});

	const params = EditRecipeParamsSchema.parse(p);
	const { recipeId } = params;

	const formData = EditRecipeIntentDTOSchema.parse(
		Object.fromEntries((await request.clone().formData()).entries())
	);

	const { intent, ingredientOrder, stepOrder, publishedStatus, languages } =
		formData;

	const t = await i18next.getFixedT(request.clone());

	const { getData } = await getDataSession(request.clone());

	const translationData = await parseWithMessage(
		SessionDataStorageSchema,
		getData(),
		t("error.dataMissing")
	);

	let updatedIngredients: Ingredient[] | undefined;
	let updatedSteps: Step[] | undefined;
	let updatedRecipe: Recipe | undefined;

	switch (intent) {
		case "ingredientOrder":
			if (ingredientOrder) {
				updatedIngredients = await prisma.$transaction(
					ingredientOrder.map((item, index) =>
						prisma.ingredient.update({
							data: {
								position: index + 1,
							},
							where: { id: item.id },
						})
					)
				);
			}

			break;
		case "stepOrder":
			if (stepOrder) {
				try {
					updatedSteps = await prisma.$transaction(
						stepOrder.map((item, index) =>
							prisma.step.update({
								data: {
									position: index + 1,
								},
								where: { id: item.id },
								include: {
									ingredients: {
										orderBy: {
											stepPosition: "asc",
										},
									},
								},
							})
						)
					);
				} catch (e) {
					console.error(e);
				}
			}

			break;
		case "publishedStatus":
			if (publishedStatus) {
				try {
					await prisma.recipe.update({
						data: {
							status: publishedStatus,
						},
						where: {
							id: recipeId,
						},
					});
				} catch (e) {
					console.error(e);
				}
			}

			break;
		case "languages":
			if (languages) {
				if (translationData.languages) {
					const oldLang = translationData.languages;
					const newLang = oldLang.includes(languages)
						? oldLang.filter((item) => item !== languages).sort()
						: [...oldLang, languages].sort();

					try {
						await prisma.recipe.update({
							data: { languages: newLang },
							where: { id: recipeId },
						});
					} catch (e) {
						console.error(e);
					}
				}
			}

			break;
	}

	return json({ updatedIngredients, updatedSteps, updatedRecipe });
};

export default function EditRecipeRoute() {
	const submit = useSubmit();
	const { t } = useTranslation();
	const { formData, state } = useNavigation();

	const intent = EditRecipeIntentSchema.optional().parse(
		formData?.get("intent")?.toString()
	);
	const isIdle = state === "idle";

	const {
		foundRecipe,
		foundSubRecipes,
		foundIngredients,
		foundSteps,
		validation,
		lang,
		invertedLang,
	} = useLoaderData<typeof loader>();
	const {
		id,
		name: n,
		description: d,
		difficulty,
		prepTime,
		cookTime,
		bakeTime,
		servings,
		languages,
		status,
	} = foundRecipe;
	const name = TranslatedContentSchema.parse(n);
	const description = TranslatedContentSchema.parse(d);

	const enableSwitchValue = useMemo(
		() => languages.includes(lang),
		[lang, languages]
	);

	const actionData = useActionData<typeof action>();

	const [isReorderingIngredients, setIsReorderingIngredients] =
		useState<boolean>(false);
	const [isReorderingSteps, setIsReorderingSteps] = useState<boolean>(false);
	const [ingredientsOrder, setIngredientsOrder] = useState(foundIngredients);
	const [stepsOrder, setStepsOrder] = useState(foundSteps);

	const handleReorder = (target: "ingredients" | "steps") => {
		switch (target) {
			case "ingredients":
				if (isReorderingIngredients) {
					if (
						!isEqual(
							ingredientsOrder,
							actionData?.updatedIngredients ?? foundIngredients
						)
					) {
						submit(
							{
								intent: "ingredientOrder",
								ingredientOrder: JSON.stringify(ingredientsOrder),
							},
							{ method: "patch" }
						);
					}

					setIsReorderingIngredients(false);
				} else {
					setIsReorderingIngredients(true);
				}

				break;
			case "steps":
				if (isReorderingSteps) {
					if (!isEqual(stepsOrder, actionData?.updatedSteps ?? foundSteps)) {
						submit(
							{
								intent: "stepOrder",
								stepOrder: JSON.stringify(stepsOrder),
							},
							{ method: "patch" }
						);
					}

					setIsReorderingSteps(false);
				} else {
					setIsReorderingSteps(true);
				}

				break;
		}
	};

	const handleCancelReorder = (target: "ingredients" | "steps") => {
		switch (target) {
			case "ingredients":
				setIngredientsOrder(foundIngredients);
				setIsReorderingIngredients(false);
				break;
			case "steps":
				setStepsOrder(foundSteps);
				setIsReorderingSteps(false);
				break;
		}
	};

	const handlePublishedStatusChange = (value: boolean) => {
		if ((status === Status.PUBLISHED) !== value) {
			submit(
				{
					intent: "publishedStatus",
					publishedStatus: value ? Status.PUBLISHED : Status.UNPUBLISHED,
				},
				{ method: "patch" }
			);
		}
	};

	const handleToggleLanguage = () => {
		submit(
			{
				intent: "languages",
				languages: lang,
			},
			{ method: "patch" }
		);
	};

	useEffect(() => {
		if (!intent && isIdle) {
			setIngredientsOrder(foundIngredients);
			setStepsOrder(foundSteps);
		}
	}, [foundIngredients, foundSteps, intent, isIdle]);

	return (
		<>
			<Section
				buttons={
					<Link to={`/recipes/${id}/${invertedLang}`}>
						<Button className="flex items-center gap-1" tabIndex={-1}>
							<ErrorCount errorCount={validation[invertedLang]?.count} />
							<span>{t(`nav.language.${invertedLang}`)}</span>
						</Button>
					</Link>
				}
				title={t("recipe.heading.edit", { lang: t(`nav.language.${lang}`) })}
			>
				<Card
					buttons={
						<Switch
							className={clsx(
								!isIdle && intent === "publishedStatus" && "animate-pulse"
							)}
							isDisabled={!foundRecipe.languages.length}
							label={t("recipe.field.published")}
							labelPosition="hidden"
							name="publishedStatus"
							value={foundRecipe.status === "PUBLISHED"}
							onChange={debounce(handlePublishedStatusChange, 300)}
						/>
					}
					title={t("recipe.field.published")}
				/>
				<Card
					buttons={
						<>
							<ErrorCount errorCount={validation[lang]?.count} />
							<Switch
								isDisabled={
									validation[lang] && validation[lang]!.count > 0 ? true : false
								}
								isLoading={!isIdle && intent === "languages"}
								label={t("recipe.field.enableLang", {
									lang: t(`nav.language.${lang}`),
								})}
								labelPosition="hidden"
								name="languages"
								value={enableSwitchValue}
								onChange={debounce(handleToggleLanguage, 300)}
							/>
						</>
					}
					title={t("recipe.field.enableLang", {
						lang: t(`nav.language.${lang}`),
					})}
				/>
				<Card
					buttons={
						<>
							<Link preventScrollReset to="details">
								<Button className="flex items-center gap-1" tabIndex={-1}>
									<ErrorCount errorCount={validation[lang]?.recipe?.count} />
									<span>{t("common.edit")}</span>
								</Button>
							</Link>
							<Link preventScrollReset to="delete">
								<Button tabIndex={-1}>{t("common.delete")}</Button>
							</Link>
						</>
					}
					title={name[lang] ?? t("error.translationMissing")}
				>
					<Figure isInline label={t("recipe.field.description")}>
						<span>{description?.[lang] ?? t("error.translationMissing")}</span>
					</Figure>
					<Figure isInline label={t("recipe.field.difficulty")}>
						<span>{t(`recipe.difficulty.${difficulty}`)}</span>
					</Figure>
					{prepTime && (
						<Figure isInline label={t("recipe.field.prepTime")}>
							<span>{formatTime(prepTime, t)}</span>
						</Figure>
					)}
					{cookTime && (
						<Figure isInline label={t("recipe.field.cookTime")}>
							<span>{formatTime(cookTime, t)}</span>
						</Figure>
					)}
					{bakeTime && (
						<Figure isInline label={t("recipe.field.bakeTime")}>
							<span>{formatTime(bakeTime, t)}</span>
						</Figure>
					)}
					{servings && (
						<Figure isInline label={t("recipe.field.servings")}>
							<span>{servings}</span>
						</Figure>
					)}
				</Card>
			</Section>
			<Section
				buttons={
					<Link preventScrollReset to="sub-recipe">
						<Button tabIndex={-1}>{t("common.add")}</Button>
					</Link>
				}
				errorCount={validation[lang]?.subRecipeErrorCount}
				title={t("recipe.section.subRecipes")}
			>
				{foundSubRecipes.length ? (
					foundSubRecipes.map(({ id, name: n }, index) => {
						const name = TranslatedContentSchema.parse(n);

						return (
							<Card
								key={`Sub__Recipe__${id}`}
								buttons={
									<>
										<Link preventScrollReset to={`sub-recipe/${id}/edit`}>
											<Button className="flex items-center gap-1" tabIndex={-1}>
												<ErrorCount
													errorCount={validation[lang]?.subRecipes[index].count}
												/>
												<span>{t("common.edit")}</span>
											</Button>
										</Link>
										<Link preventScrollReset to={`sub-recipe/${id}/delete`}>
											<Button tabIndex={-1}>{t("common.delete")}</Button>
										</Link>
									</>
								}
								title={name?.[lang] ?? t("error.translationMissing")}
							/>
						);
					})
				) : (
					<EmptyCard>{t("recipe.card.emptySubRecipes")}</EmptyCard>
				)}
			</Section>
			<Section
				buttons={
					<>
						{ingredientsOrder.length > 1 && isReorderingIngredients ? (
							<>
								<Button
									isDisabled={!isIdle && intent === "ingredientOrder"}
									variant="success"
									onClick={() => handleReorder("ingredients")}
								>
									{t("common.save")}
								</Button>
								<Button onClick={() => handleCancelReorder("ingredients")}>
									{t("common.cancel")}
								</Button>
							</>
						) : (
							<>
								{ingredientsOrder.length > 1 && (
									<Button
										isDisabled={!isIdle && intent === "ingredientOrder"}
										onClick={() => handleReorder("ingredients")}
									>
										{t("common.reorder")}
									</Button>
								)}
								<Link preventScrollReset to="ingredient">
									<Button tabIndex={-1}>{t("common.add")}</Button>
								</Link>
							</>
						)}
					</>
				}
				className={clsx(
					!isIdle && intent === "ingredientOrder" && "animate-pulse"
				)}
				errorCount={validation[lang]?.ingredientErrorCount}
				title={t("recipe.section.ingredients")}
			>
				<Reorder.Group
					axis="y"
					className="flex flex-col gap-2"
					values={ingredientsOrder}
					onReorder={setIngredientsOrder}
				>
					{ingredientsOrder?.length ? (
						ingredientsOrder?.map((item, index) => {
							const { name: na, note: no, quantity, unit, subRecipe } = item;

							const name = TranslatedContentSchema.parse(na);
							const note = OptionalTranslatedContentSchema.parse(no);
							const subRecipeName = OptionalTranslatedContentSchema.parse(
								subRecipe?.name
							);

							return (
								<ReorderCard
									key={`Ingredient__${item.id}`}
									buttons={
										<>
											<Link
												preventScrollReset
												to={`ingredient/${item.id}/edit`}
											>
												<Button
													className="flex items-center gap-1"
													tabIndex={-1}
												>
													<ErrorCount
														errorCount={
															validation?.[lang]?.ingredients?.[index]?.count
														}
													/>
													<span>{t("common.edit")}</span>
												</Button>
											</Link>
											<Link
												preventScrollReset
												to={`ingredient/${item.id}/delete`}
											>
												<Button tabIndex={-1}>{t("common.delete")}</Button>
											</Link>
										</>
									}
									isReordering={isReorderingIngredients}
									item={item}
									title={
										<IngredientString
											name={name}
											quantity={quantity}
											unit={unit}
										/>
									}
								>
									{subRecipe && (
										<Figure isInline label={t("recipe.field.subRecipe")}>
											<span>
												{subRecipeName?.[lang] ?? t("error.translationMissing")}
											</span>
										</Figure>
									)}
									{note && (
										<Figure isInline label={t("recipe.field.note")}>
											<span>
												{note?.[lang] ?? t("error.translationMissing")}
											</span>
										</Figure>
									)}
								</ReorderCard>
							);
						})
					) : (
						<EmptyCard>{t("recipe.card.emptyIngredients")}</EmptyCard>
					)}
				</Reorder.Group>
			</Section>
			<Section
				buttons={
					<>
						{stepsOrder.length > 1 && isReorderingSteps ? (
							<>
								<Button
									isDisabled={!isIdle && intent === "stepOrder"}
									variant="success"
									onClick={() => handleReorder("steps")}
								>
									{t("common.save")}
								</Button>
								<Button onClick={() => handleCancelReorder("steps")}>
									{t("common.cancel")}
								</Button>
							</>
						) : (
							<>
								{stepsOrder.length > 1 && (
									<Button
										isDisabled={!isIdle && intent === "stepOrder"}
										onClick={() => handleReorder("steps")}
									>
										{t("common.reorder")}
									</Button>
								)}
								<Link preventScrollReset to="step">
									<Button tabIndex={-1}>{t("common.add")}</Button>
								</Link>
							</>
						)}
					</>
				}
				className={clsx(!isIdle && intent === "stepOrder" && "animate-pulse")}
				errorCount={validation[lang]?.stepErrorCount}
				title={t("recipe.section.steps")}
			>
				{stepsOrder.length ? (
					<Reorder.Group
						axis="y"
						className="flex flex-col gap-2"
						values={stepsOrder}
						onReorder={setStepsOrder}
					>
						{stepsOrder.map((item, index) => {
							const { content: c } = item;
							const content = TranslatedContentSchema.parse(c);

							return (
								<ReorderCard
									key={`Step__${item.id}`}
									buttons={
										<>
											<Link preventScrollReset to={`step/${item.id}/edit`}>
												<Button
													className="flex items-center gap-1"
													tabIndex={-1}
												>
													<ErrorCount
														errorCount={validation[lang]?.steps[index].count}
													/>
													<span>{t("common.edit")}</span>
												</Button>
											</Link>
											<Link preventScrollReset to={`step/${item.id}/delete`}>
												<Button tabIndex={-1}>{t("common.delete")}</Button>
											</Link>
										</>
									}
									index={index}
									isReordering={isReorderingSteps}
									item={item}
									title={content[lang] ?? t("error.translationMissing")}
								>
									{item.temperature && item.temperatureScale && (
										<Figure isInline label={t("recipe.field.temperature")}>
											<span>
												{TemperatureString({
													temperature: item.temperature,
													temperatureScale: item.temperatureScale,
												})}
											</span>
										</Figure>
									)}
									{!!item.ingredients.length && (
										<Figure
											isInline={item.ingredients.length === 1}
											label={t("recipe.field.ingredients")}
										>
											{item.ingredients.length > 1 ? (
												<ul
													className={clsx(
														item.ingredients.length > 1 &&
															"list-disc list-inside"
													)}
												>
													{item.ingredients.map(
														({ id, name, quantity, unit }) => (
															<li key={`Step__Ingredient__${id}`}>
																{IngredientString({
																	name: TranslatedContentSchema.parse(name),
																	quantity,
																	unit,
																})}
															</li>
														)
													)}
												</ul>
											) : (
												<span>
													{IngredientString({
														name: TranslatedContentSchema.parse(
															item.ingredients[0].name
														),
														quantity: item.ingredients[0].quantity,
														unit: item.ingredients[0].unit,
													})}
												</span>
											)}
										</Figure>
									)}
								</ReorderCard>
							);
						})}
					</Reorder.Group>
				) : (
					<EmptyCard>{t("recipe.card.emptySteps")}</EmptyCard>
				)}
			</Section>
			{/* Modal outlet */}
			<Outlet />
		</>
	);
}
