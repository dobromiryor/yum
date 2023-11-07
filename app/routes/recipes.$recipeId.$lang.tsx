import {
	Status,
	type Ingredient as IngredientType,
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

import { ErrorCount } from "~/components/common/ErrorCount";
import { Button } from "~/components/common/UI/Button";
import { ParagraphMap } from "~/components/common/UI/ParagraphMap";
import { Switch } from "~/components/common/UI/Switch";
import { Card } from "~/components/recipes/crud/Card";
import { EmptyCard } from "~/components/recipes/crud/EmptyCard";
import {
	Dimension,
	EquipmentFigure,
	Volume,
} from "~/components/recipes/crud/Equipment";
import { Figure } from "~/components/recipes/crud/Figure";
import {
	Ingredient,
	IngredientsFigure,
} from "~/components/recipes/crud/Ingredient";
import { ReorderCard } from "~/components/recipes/crud/ReorderCard";
import { Section } from "~/components/recipes/crud/Section";
import { SubRecipesFigure } from "~/components/recipes/crud/SubRecipe";
import { TemperatureFigure } from "~/components/recipes/crud/Temperature";
import { useIsLoading } from "~/hooks/useIsLoading";
import i18next from "~/modules/i18next.server";
import {
	OptionalTranslatedContentSchema,
	SessionDataStorageSchema,
	TranslatedContentSchema,
} from "~/schemas/common";
import { EditRecipeParamsSchema } from "~/schemas/params.schema";
import {
	EditRecipeIntentDTOSchema,
	EditRecipeIntentSchema,
} from "~/schemas/recipe.schema";
import { auth } from "~/utils/auth.server";
import { getDataSession } from "~/utils/dataStorage.server";
import { debounce } from "~/utils/helpers/debounce";
import { formatTime } from "~/utils/helpers/format-time";
import { getFrom } from "~/utils/helpers/get-from.server";
import { getInvertedLang } from "~/utils/helpers/get-inverted-lang";
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
		include: {
			subRecipes: {
				orderBy: {
					position: "asc",
				},
			},
			ingredients: {
				orderBy: {
					position: "asc",
				},
				include: {
					subRecipe: true,
				},
			},
			equipment: {
				orderBy: {
					position: "asc",
				},
			},
			steps: {
				orderBy: {
					position: "asc",
				},
				include: {
					ingredients: true,
					subRecipes: true,
					equipment: true,
				},
			},
		},
	});

	if (
		!foundRecipe ||
		(foundRecipe.userId !== authData.id && authData.role !== "ADMIN")
	) {
		return redirect(getFrom(request) ?? `/users/${authData.id}`);
	}

	const { languages } = foundRecipe;
	const { setData, commit } = await getDataSession(request);

	setData({ languages });

	const validation = languageValidation({
		foundEquipment: foundRecipe.equipment.map(({ name }) => ({ name })),
		foundIngredients: foundRecipe.ingredients.map(({ name, note }) => ({
			name,
			note,
		})),
		foundRecipe: {
			name: foundRecipe.name,
			description: foundRecipe.description,
		},
		foundSteps: foundRecipe.steps.map(({ content }) => ({
			content,
		})),
		foundSubRecipes: foundRecipe.subRecipes.map(({ name }) => ({
			name,
		})),
	});

	const invertedLang = getInvertedLang(lang);

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

	if (
		foundRecipe.languages.length === 0 &&
		foundRecipe.status === Status.PUBLISHED
	) {
		await prisma.recipe.update({
			data: {
				status: Status.UNPUBLISHED,
			},
			where: { id: recipeId },
		});
	}

	return json(
		{
			authData,
			foundRecipe,
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

	let updatedIngredients: IngredientType[] | undefined;
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

	const { foundRecipe, validation, lang, invertedLang } =
		useLoaderData<typeof loader>();
	const {
		id,
		name: n,
		description: d,
		difficulty,
		servings,
		languages,
		status,
	} = foundRecipe;
	const name = TranslatedContentSchema.parse(n);
	const description = TranslatedContentSchema.parse(d);

	const languagesIncludesLocale = useMemo(
		() => languages.includes(lang),
		[lang, languages]
	);

	const actionData = useActionData<typeof action>();

	const [isLoadingLanguages] = useIsLoading({
		additionalCondition: intent === "languages",
	});
	const [isLoadingPublishedStatus] = useIsLoading({
		additionalCondition: intent === "publishedStatus",
	});
	const [isLoadingIngredientOrder] = useIsLoading({
		additionalCondition: intent === "ingredientOrder",
	});
	const [isLoadingStepOrder] = useIsLoading({
		additionalCondition: intent === "stepOrder",
	});

	const [isReorderingIngredients, setIsReorderingIngredients] =
		useState<boolean>(false);
	const [isReorderingSteps, setIsReorderingSteps] = useState<boolean>(false);
	const [ingredientsOrder, setIngredientsOrder] = useState(
		foundRecipe.ingredients
	);
	const [stepsOrder, setStepsOrder] = useState(foundRecipe.steps);

	const handleReorder = (target: "ingredients" | "steps") => {
		switch (target) {
			case "ingredients":
				if (isReorderingIngredients) {
					if (
						!isEqual(
							ingredientsOrder,
							actionData?.updatedIngredients ?? foundRecipe.ingredients
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
					if (
						!isEqual(stepsOrder, actionData?.updatedSteps ?? foundRecipe.steps)
					) {
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
				setIngredientsOrder(foundRecipe.ingredients);
				setIsReorderingIngredients(false);
				break;
			case "steps":
				setStepsOrder(foundRecipe.steps);
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
			setIngredientsOrder(foundRecipe.ingredients);
			setStepsOrder(foundRecipe.steps);
		}
	}, [foundRecipe, intent, isIdle]);

	return (
		<>
			<Section
				buttons={
					<Link tabIndex={-1} to={`/recipes/${id}/${invertedLang}`}>
						<Button className="flex items-center gap-1">
							<span>{t(`nav.language.${invertedLang}`)}</span>
							<ErrorCount errorCount={validation[invertedLang]?.count} />
						</Button>
					</Link>
				}
				title={t("recipe.heading.edit", { lang: t(`nav.language.${lang}`) })}
			>
				<Card
					buttons={
						<Switch
							className={clsx(isLoadingPublishedStatus && "animate-pulse")}
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
						<Switch
							isDisabled={
								validation[lang] && validation[lang]!.count > 0 ? true : false
							}
							isLoading={isLoadingLanguages}
							label={t("recipe.field.enableLang", {
								lang: t(`nav.language.${lang}`),
							})}
							labelPosition="hidden"
							name="languages"
							value={languagesIncludesLocale}
							onChange={debounce(handleToggleLanguage, 300)}
						/>
					}
					errorCount={validation[lang]?.count}
					title={t("recipe.field.enableLang", {
						lang: t(`nav.language.${lang}`),
					})}
				/>
				<Card
					buttons={
						<>
							{status === Status.PUBLISHED && languagesIncludesLocale && (
								<Link preventScrollReset tabIndex={-1} to={`/recipes/${id}`}>
									<Button className="flex items-center gap-1">
										<span>{t("common.view")}</span>
									</Button>
								</Link>
							)}
							<Link preventScrollReset tabIndex={-1} to="details">
								<Button className="flex items-center gap-1">
									<span>{t("common.edit")}</span>
									<ErrorCount errorCount={validation[lang]?.recipe?.count} />
								</Button>
							</Link>
							<Link preventScrollReset tabIndex={-1} to="delete">
								<Button>{t("common.delete")}</Button>
							</Link>
						</>
					}
					title={name[lang] ?? t("error.translationMissing")}
				>
					<Figure
						className="flex flex-col gap-2"
						label={t("recipe.field.description")}
					>
						{<ParagraphMap text={description?.[lang]} /> ??
							t("error.translationMissing")}
					</Figure>
					<Figure isInline label={t("recipe.field.difficulty")}>
						<span>{t(`recipe.difficulty.${difficulty}`)}</span>
					</Figure>
					{servings && (
						<Figure isInline label={t("recipe.field.servings")}>
							<span>{servings}</span>
						</Figure>
					)}
				</Card>
			</Section>
			<Section
				buttons={
					<Link preventScrollReset tabIndex={-1} to="sub-recipe">
						<Button>{t("common.add")}</Button>
					</Link>
				}
				errorCount={validation[lang]?.subRecipeErrorCount}
				title={t("recipe.section.subRecipes")}
			>
				{foundRecipe.subRecipes.length ? (
					foundRecipe.subRecipes.map(({ id, name: n }, index) => {
						const name = TranslatedContentSchema.parse(n);

						return (
							<Card
								key={`Sub__Recipe__${id}`}
								buttons={
									<>
										<Link
											preventScrollReset
											tabIndex={-1}
											to={`sub-recipe/${id}/edit`}
										>
											<Button className="flex items-center gap-1">
												<span>{t("common.edit")}</span>
												<ErrorCount
													errorCount={
														validation[lang]?.subRecipes[index]?.count
													}
												/>
											</Button>
										</Link>
										<Link
											preventScrollReset
											tabIndex={-1}
											to={`sub-recipe/${id}/delete`}
										>
											<Button>{t("common.delete")}</Button>
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
									isLoading={isLoadingIngredientOrder}
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
										isLoading={isLoadingIngredientOrder}
										onClick={() => handleReorder("ingredients")}
									>
										{t("common.reorder")}
									</Button>
								)}
								<Link preventScrollReset tabIndex={-1} to="ingredient">
									<Button>{t("common.add")}</Button>
								</Link>
							</>
						)}
					</>
				}
				className={clsx(isLoadingIngredientOrder && "animate-pulse")}
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
							const { note: no, subRecipe } = item;

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
												tabIndex={-1}
												to={`ingredient/${item.id}/edit`}
											>
												<Button className="flex items-center gap-1">
													<span>{t("common.edit")}</span>
													<ErrorCount
														errorCount={
															validation?.[lang]?.ingredients?.[index]?.count
														}
													/>
												</Button>
											</Link>
											<Link
												preventScrollReset
												tabIndex={-1}
												to={`ingredient/${item.id}/delete`}
											>
												<Button>{t("common.delete")}</Button>
											</Link>
										</>
									}
									isReordering={isReorderingIngredients}
									item={item}
									title={<Ingredient as="" ingredient={item} />}
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
					<Link preventScrollReset tabIndex={-1} to="equipment">
						<Button>{t("common.add")}</Button>
					</Link>
				}
				errorCount={validation[lang]?.equipmentErrorCount}
				title={t("recipe.section.equipment")}
			>
				{foundRecipe.equipment.length ? (
					foundRecipe.equipment.map((item, index) => {
						const { id, name: n } = item;
						const name = TranslatedContentSchema.parse(n);

						return (
							<Card
								key={`Equipment__${id}`}
								buttons={
									<>
										<Link
											preventScrollReset
											tabIndex={-1}
											to={`equipment/${id}/edit`}
										>
											<Button className="flex items-center gap-1">
												<span>{t("common.edit")}</span>
												<ErrorCount
													errorCount={validation[lang]?.equipment[index]?.count}
												/>
											</Button>
										</Link>
										<Link
											preventScrollReset
											tabIndex={-1}
											to={`equipment/${id}/delete`}
										>
											<Button>{t("common.delete")}</Button>
										</Link>
									</>
								}
								title={name?.[lang] ?? t("error.translationMissing")}
							>
								<Dimension hasLabel equipment={item} />
								<Volume hasLabel equipment={item} />
							</Card>
						);
					})
				) : (
					<EmptyCard>{t("recipe.card.emptyEquipment")}</EmptyCard>
				)}
			</Section>
			<Section
				buttons={
					<>
						{stepsOrder.length > 1 && isReorderingSteps ? (
							<>
								<Button
									isLoading={isLoadingStepOrder}
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
										isLoading={isLoadingStepOrder}
										onClick={() => handleReorder("steps")}
									>
										{t("common.reorder")}
									</Button>
								)}
								<Link preventScrollReset tabIndex={-1} to="step">
									<Button>{t("common.add")}</Button>
								</Link>
							</>
						)}
					</>
				}
				className={clsx(isLoadingStepOrder && "animate-pulse")}
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
							const {
								content: c,
								bakeTime,
								cookTime,
								prepTime,
								restTime,
							} = item;
							const content = TranslatedContentSchema.parse(c);

							return (
								<ReorderCard
									key={`Step__${item.id}`}
									buttons={
										<>
											<Link
												preventScrollReset
												tabIndex={-1}
												to={`step/${item.id}/edit`}
											>
												<Button className="flex items-center gap-1">
													<span>{t("common.edit")}</span>
													<ErrorCount
														errorCount={validation[lang]?.steps[index]?.count}
													/>
												</Button>
											</Link>
											<Link
												preventScrollReset
												tabIndex={-1}
												to={`step/${item.id}/delete`}
											>
												<Button>{t("common.delete")}</Button>
											</Link>
										</>
									}
									index={index}
									isReordering={isReorderingSteps}
									item={item}
									title={content[lang] ?? t("error.translationMissing")}
								>
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
									{restTime && (
										<Figure isInline label={t("recipe.field.restTime")}>
											<span>{formatTime(restTime, t)}</span>
										</Figure>
									)}
									<TemperatureFigure step={item} />
									<IngredientsFigure step={item} />
									<SubRecipesFigure step={item} />
									<EquipmentFigure step={item} />
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
