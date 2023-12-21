import { z } from "zod";

import { LanguageSchema, NonEmptyStringSchema } from "~/schemas/common";

export const CreateRecipeSchema = z.object({
	lang: LanguageSchema,
});

export const RecipeParamsSchema = z.object({
	slug: z.string(),
});

export const RecipeReviewsParamsSchema = z.object({
	recipeId: z.string(),
});

export const RecipeCategoryParamsSchema = z.object({
	slug: z.string(),
});

export const EditRecipeParamsSchema = z.object({
	recipeId: NonEmptyStringSchema,
});

export const EditRecipeWithLangParamsSchema = EditRecipeParamsSchema.extend({
	recipeId: NonEmptyStringSchema,
	lang: LanguageSchema,
});

export const EditRecipeSubRecipeParamsSchema =
	EditRecipeWithLangParamsSchema.extend({
		subRecipeId: NonEmptyStringSchema,
	});

export const EditRecipeIngredientParamsSchema =
	EditRecipeWithLangParamsSchema.extend({
		ingredientId: NonEmptyStringSchema,
	});

export const EditRecipeEquipmentParamsSchema =
	EditRecipeWithLangParamsSchema.extend({
		equipmentId: NonEmptyStringSchema,
	});

export const EditRecipeStepParamsSchema = EditRecipeWithLangParamsSchema.extend(
	{
		stepId: NonEmptyStringSchema,
	}
);

export const UserRecipesParamsSchema = z.object({
	userId: NonEmptyStringSchema,
});

export const AdminDashboardDeleteUserParamsSchema = z.object({
	userId: NonEmptyStringSchema,
});

export const AdminDashboardCategoryParamsSchema = z.object({
	categoryId: NonEmptyStringSchema,
});
