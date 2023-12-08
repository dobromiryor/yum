import { Difficulty, Status } from "@prisma/client";
import { z } from "zod";

import { LanguageSchema, NonEmptyStringSchema } from "~/schemas/common";
import { IngredientSchema } from "~/schemas/ingredient.schema";
import { StepSchema } from "~/schemas/step.schema";

export const EditRecipeIntentSchema = z.union([
	z.literal("ingredientOrder"),
	z.literal("stepOrder"),
	z.literal("publishedStatus"),
	z.literal("languages"),
]);

export const EditRecipeIntentDTOSchema = z.object({
	intent: EditRecipeIntentSchema,
	ingredientOrder: z
		.string()
		.transform((value) => IngredientSchema.array().parse(JSON.parse(value)))
		.optional(),
	stepOrder: z
		.string()
		.transform((value) => StepSchema.array().parse(JSON.parse(value)))
		.optional(),
	publishedStatus: z.nativeEnum(Status).optional(),
	languages: LanguageSchema.optional(),
});

export const NewRecipeSchema = z.object({
	name: NonEmptyStringSchema,
	description: NonEmptyStringSchema,
	difficulty: z.nativeEnum(Difficulty),
	servings: z.coerce.number().gt(0).lte(20),
});

export const EditRecipeSchema = NewRecipeSchema.extend({
	categories: z.string().cuid().array().nullish(),
});
