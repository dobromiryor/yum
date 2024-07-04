import {
	type Equipment,
	type Ingredient,
	type Recipe,
	type Step,
	type SubRecipe,
} from "@prisma/client";

import { LANGUAGES } from "~/consts/languages.const";
import {
	EquipmentLanguageValidation,
	IngredientLanguageValidation,
	LanguageValidationSchema,
	RecipeLanguageValidation,
	StepLanguageValidation,
	SubRecipeLanguageValidation,
} from "~/schemas/language-validation.schema";

interface LanguageValidationProps {
	foundIngredients: Pick<Ingredient, "name" | "note">[];
	foundRecipe: Pick<Recipe, "name" | "description">;
	foundSteps: Pick<Step, "content">[];
	foundSubRecipes: Pick<SubRecipe, "name">[];
	foundEquipment: Pick<Equipment, "name">[];
}

export const languageValidation = ({
	foundIngredients,
	foundRecipe,
	foundSteps,
	foundSubRecipes,
	foundEquipment,
}: LanguageValidationProps) => {
	const result = {};

	LANGUAGES.forEach((lang) => {
		const recipeValidation = {
			name: !!foundRecipe.name?.[lang as keyof typeof foundRecipe.name],
			description:
				!!foundRecipe.description?.[
					lang as keyof typeof foundRecipe.description
				],
		};
		const recipeErrorCount = Object.values(recipeValidation).filter(
			(item) => item === false
		).length;
		const recipe = { ...recipeValidation, count: recipeErrorCount };

		const subRecipes = foundSubRecipes.map((subRecipe) => {
			const result = {
				name: !!subRecipe.name?.[lang as keyof typeof subRecipe.name],
			};

			const count = Object.values(result).filter(
				(item) => item === false
			).length;

			return { ...result, count };
		});
		const subRecipeErrorCount = subRecipes.reduce(
			(prev, curr) => prev + curr.count,
			0
		);

		const ingredients = foundIngredients.map((ingredient) => {
			const result = {
				name: !!ingredient.name?.[lang as keyof typeof ingredient.name],
				note: !ingredient.note
					? true
					: ingredient.note[lang as keyof typeof ingredient.note]
						? true
						: false,
			};

			const count = Object.values(result).filter(
				(item) => item === false
			).length;

			return { ...result, count };
		});
		const ingredientErrorCount = ingredients.reduce(
			(prev, curr) => prev + curr.count,
			0
		);

		const equipment = foundEquipment.map((item) => {
			const result = {
				name: !!item.name?.[lang as keyof typeof item.name],
			};

			const count = Object.values(result).filter(
				(item) => item === false
			).length;

			return { ...result, count };
		});
		const equipmentErrorCount = equipment.reduce(
			(prev, curr) => prev + curr.count,
			0
		);

		const steps = foundSteps.map((step) => {
			const result = {
				content: !!step.content?.[lang as keyof typeof step.content],
			};

			const count = Object.values(result).filter(
				(item) => item === false
			).length;

			return { ...result, count };
		});
		const stepErrorCount = steps.reduce((prev, curr) => prev + curr.count, 0);

		const count =
			recipe.count +
			subRecipeErrorCount +
			ingredientErrorCount +
			equipmentErrorCount +
			stepErrorCount;

		Object.assign(result, {
			[lang]: {
				recipe,
				count,
				equipment,
				equipmentErrorCount,
				ingredients,
				ingredientErrorCount,
				stepErrorCount,
				steps,
				subRecipeErrorCount,
				subRecipes,
			},
		});
	});

	return LanguageValidationSchema.parse(result);
};

export const recipeLanguageValidation = (
	foundRecipe: Pick<Recipe, "name" | "description">
) => {
	const result = {};

	LANGUAGES.forEach((lang) => {
		const recipeValidation = {
			name: !!foundRecipe.name?.[lang as keyof typeof foundRecipe.name],
			description:
				!!foundRecipe.description?.[
					lang as keyof typeof foundRecipe.description
				],
		};

		Object.assign(result, { [lang]: { ...recipeValidation } });
	});

	return RecipeLanguageValidation.parse(result);
};

export const subRecipeLanguageValidation = (
	foundSubRecipe: Pick<SubRecipe, "name">
) => {
	const result = {};

	LANGUAGES.forEach((lang) => {
		const subRecipeValidation = {
			name: !!foundSubRecipe.name?.[lang as keyof typeof foundSubRecipe.name],
		};

		Object.assign(result, { [lang]: { ...subRecipeValidation } });
	});

	return SubRecipeLanguageValidation.parse(result);
};

export const ingredientLanguageValidation = (
	foundIngredient: Pick<Ingredient, "name" | "note">
) => {
	const result = {};

	LANGUAGES.forEach((lang) => {
		const ingredientValidation = {
			name: !!foundIngredient.name?.[lang as keyof typeof foundIngredient.name],
			note: !foundIngredient.note
				? true
				: foundIngredient.note[lang as keyof typeof foundIngredient.note]
					? true
					: false,
		};

		Object.assign(result, { [lang]: { ...ingredientValidation } });
	});

	return IngredientLanguageValidation.parse(result);
};

export const equipmentLanguageValidation = (
	foundEquipment: Pick<Equipment, "name">
) => {
	const result = {};

	LANGUAGES.forEach((lang) => {
		const equipmentValidation = {
			name: !!foundEquipment.name?.[lang as keyof typeof foundEquipment.name],
		};

		Object.assign(result, { [lang]: { ...equipmentValidation } });
	});

	return EquipmentLanguageValidation.parse(result);
};

export const stepLanguageValidation = (foundStep: Pick<Step, "content">) => {
	const result = {};

	LANGUAGES.forEach((lang) => {
		const stepValidation = {
			content: !!foundStep.content?.[lang as keyof typeof foundStep.content],
		};

		Object.assign(result, { [lang]: { ...stepValidation } });
	});

	return StepLanguageValidation.parse(result);
};
