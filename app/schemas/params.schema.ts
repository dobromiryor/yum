import { z } from "zod";

import { LanguageSchema, NonEmptyStringSchema } from "~/schemas/common";

export const CreateRecipeSchema = z.object({
	lang: LanguageSchema,
});

export const RecipeParamsSchema = z.object({
	recipeId: NonEmptyStringSchema,
});

export const EditRecipeParamsSchema = RecipeParamsSchema.extend({
	lang: LanguageSchema,
});

export const EditRecipeSubRecipeParamsSchema = EditRecipeParamsSchema.extend({
	subRecipeId: NonEmptyStringSchema,
});

export const EditRecipeIngredientParamsSchema = EditRecipeParamsSchema.extend({
	ingredientId: NonEmptyStringSchema,
});

export const EditRecipeEquipmentParamsSchema = EditRecipeParamsSchema.extend({
	equipmentId: NonEmptyStringSchema,
});

export const EditRecipeStepParamsSchema = EditRecipeParamsSchema.extend({
	stepId: NonEmptyStringSchema,
});

export const UserRecipesParamsSchema = z.object({
	userId: NonEmptyStringSchema,
});
