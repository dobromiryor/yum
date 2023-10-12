import { z } from "zod";

import { LanguageSchema } from "~/schemas/common";

export const LanguageValidationSchema = z.record(
	LanguageSchema,
	z.object({
		recipe: z.object({
			name: z.boolean(),
			description: z.boolean(),
			count: z.number(),
		}),
		ingredients: z
			.object({
				name: z.boolean(),
				note: z.boolean(),
				count: z.number(),
			})
			.array(),
		ingredientErrorCount: z.number(),
		steps: z
			.object({
				content: z.boolean(),
				count: z.number(),
			})
			.array(),
		stepErrorCount: z.number(),
		subRecipes: z
			.object({
				name: z.boolean(),
				count: z.number(),
			})
			.array(),
		subRecipeErrorCount: z.number(),
		count: z.number(),
	})
);

export const RecipeLanguageValidation = z.record(
	LanguageSchema,
	z.object({
		name: z.boolean(),
		description: z.boolean(),
	})
);

export const SubRecipeLanguageValidation = z.record(
	LanguageSchema,
	z.object({
		name: z.boolean(),
	})
);

export const IngredientLanguageValidation = z.record(
	LanguageSchema,
	z.object({
		name: z.boolean(),
		note: z.boolean(),
	})
);

export const StepLanguageValidation = z.record(
	LanguageSchema,
	z.object({
		content: z.boolean(),
	})
);
