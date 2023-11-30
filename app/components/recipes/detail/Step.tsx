import { SubRecipeAction, type Prisma } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Pill } from "~/components/common/Pill";
import { ParagraphMap } from "~/components/common/UI/ParagraphMap";
import { Temperature } from "~/components/recipes/crud/Temperature";
import { EquipmentList } from "~/components/recipes/detail/Equipment";
import { IngredientList } from "~/components/recipes/detail/Ingredient";
import { type loader } from "~/routes/recipes.$recipeId._index";
import {
	OptionalTranslatedContentSchema,
	TranslatedContentSchema,
} from "~/schemas/common";
import { formatTime } from "~/utils/helpers/format-time";

type Step = {} & SerializeFrom<
	Prisma.StepGetPayload<{
		include: {
			equipment: true;
			ingredients: true;
			subRecipes: true;
		};
	}>
>;

interface StepProps {
	step: Step;
	keyPrefix: string;
	index: number;
	length: number;
	servings: number;
	servingsCount: number;
}

interface StepsListProps {
	steps: Step[];
	servings: number;
	servingsCount: number;
}

export const StepCard = ({
	step,
	keyPrefix,
	index,
	length,
	servings,
	servingsCount,
}: StepProps) => {
	const { locale } = useLoaderData<typeof loader>();
	const { t } = useTranslation();

	const {
		content: c,
		temperature,
		temperatureScale,
		ingredients,
		equipment,
		bakeTime,
		cookTime,
		restTime,
		prepTime,
		subRecipes,
		subRecipeAction,
	} = step;

	const content = TranslatedContentSchema.parse(c);
	const subRecipeName =
		subRecipes.length > 0
			? OptionalTranslatedContentSchema.parse(subRecipes[0].name)
			: null;

	return (
		<li className="flex flex-col gap-2 list-decimal p-3 bg-secondary dark:bg-primary rounded-2xl shadow-lg transition-colors">
			<div className="flex flex-wrap items-center gap-3">
				<h3>{`${index + 1}/${length}`}</h3>
				{prepTime && (
					<Pill
						icon="countertops"
						label={formatTime(prepTime, t)}
						tooltip={t("recipe.field.prepTime")}
					/>
				)}
				{cookTime && (
					<Pill
						icon="cooking"
						label={formatTime(cookTime, t)}
						tooltip={t("recipe.field.cookTime")}
					/>
				)}
				{bakeTime && (
					<Pill
						icon="oven_gen"
						label={formatTime(bakeTime, t)}
						tooltip={t("recipe.field.bakeTime")}
					/>
				)}
				{restTime && (
					<Pill
						icon="update"
						label={formatTime(restTime, t)}
						tooltip={t("recipe.field.restTime")}
					/>
				)}
				{temperature && temperatureScale && (
					<Pill
						icon="thermometer"
						label={<Temperature shouldConvert as="" step={step} />}
						tooltip={t("recipe.field.temperature")}
					/>
				)}
				{subRecipes.length > 0 && subRecipeAction && (
					<Pill
						icon={
							subRecipeAction === SubRecipeAction.MAKE
								? "new_window"
								: "approval_delegation"
						}
						label={
							subRecipes.length > 1
								? subRecipes.length
								: subRecipeName?.[locale]
						}
						tooltip={t(`recipe.subRecipeAction.${subRecipeAction}`)}
					/>
				)}
			</div>
			<div className="flex flex-col gap-1.5">
				<ParagraphMap text={content[locale]} />
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
				{ingredients.length > 0 && (
					<div className="flex items-start gap-1.5">
						<Pill icon="egg" tooltip={t("recipe.section.ingredients")} />
						<IngredientList
							ingredients={ingredients}
							keyPrefix={keyPrefix}
							servings={servings}
							servingsCount={servingsCount}
						/>
					</div>
				)}
				{equipment.length > 0 && (
					<div className="flex items-start gap-1.5">
						<Pill icon="soup_kitchen" tooltip={t("recipe.section.equipment")} />
						<EquipmentList equipment={equipment} keyPrefix={keyPrefix} />
					</div>
				)}
			</div>
		</li>
	);
};

export const StepList = ({
	steps,
	servings,
	servingsCount,
}: StepsListProps) => {
	if (!steps.length) {
		return null;
	}

	return (
		<ol className="flex flex-col gap-3">
			{steps.map((step, index) => {
				return (
					<StepCard
						key={`Step__${step.id}__${index}`}
						index={index}
						keyPrefix={`Step__${step.id}__${index}`}
						length={steps.length}
						servings={servings}
						servingsCount={servingsCount}
						step={step}
					/>
				);
			})}
		</ol>
	);
};
