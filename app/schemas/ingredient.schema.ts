import { Unit } from "@prisma/client";
import { t } from "i18next";
import { z } from "zod";

import { QUANTITY_REGEX } from "~/consts/regex.const";
import {
	NonEmptyStringSchema,
	OptionalStringSchema,
	OptionalTranslatedContentSchema,
	TranslatedContentSchema,
} from "~/schemas/common";

export const IngredientSchema = z.object({
	id: z.string().uuid(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	position: z.number().int(),
	stepPosition: z.number().int(),
	name: TranslatedContentSchema,
	quantity: z.union([z.number(), z.string()]).nullable(),
	note: OptionalTranslatedContentSchema.optional(),
	unit: z.nativeEnum(Unit).nullable(),
	recipeId: z.string(),
	subRecipeId: z.string().nullable(),
	userId: z.string(),
});

export const IngredientDTOSchema = z
	.object({
		name: NonEmptyStringSchema,
		note: OptionalStringSchema.transform((value) =>
			value ? value : undefined
		),
		quantity: z.preprocess(
			(value) =>
				value === "" || value === "0"
					? null
					: value === undefined
					? undefined
					: value,
			z
				.string()
				.regex(QUANTITY_REGEX, { message: t("recipe.errors.invalidQuantity") })
				.nullish()
		),
		unit: z
			.union([z.nativeEnum(Unit), z.literal("")])
			.nullable()
			.transform((value) => (value !== "" ? value : null))
			.optional(),
		subRecipeId: z.string().nullish(),
	})
	.superRefine(({ quantity, unit }, refinementContext) => {
		// quantity is required if units other than "to taste" are selected
		if (unit && unit !== "to_taste" && !quantity) {
			return refinementContext.addIssue({
				code: z.ZodIssueCode.custom,
				message: t("recipe.errors.emptyQuantity"),
				path: ["quantity"],
			});
		}

		// "to taste" option can't be used with quantity value
		if (unit === "to_taste" && !(quantity === null || quantity === undefined)) {
			return refinementContext.addIssue({
				code: z.ZodIssueCode.custom,
				message: t("recipe.errors.unit"),
				path: ["unit"],
			});
		}
	});

export const IngredientsDTOSchema = z.array(IngredientDTOSchema);

export const IngredientsFormDataSchema = z.object({
	ingredients: z.array(IngredientDTOSchema),
});
