import { Status } from "@prisma/client";
import { z } from "zod";

import { LanguageSchema } from "~/schemas/common";
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
