import { TemperatureScale } from "@prisma/client";
import { t } from "i18next";
import { z } from "zod";

import { TranslatedContentSchema } from "~/schemas/common";

export const StepSchema = z.object({
	temperatureScale: z.nativeEnum(TemperatureScale).nullable(),
	id: z.string().uuid(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	position: z.number().int(),
	recipeId: z.string(),
	userId: z.string(),
	content: TranslatedContentSchema,
	temperature: z.number().int().nullable(),
});

export const StepDTOSchema = z
	.object({
		content: z.string().min(1),
		temperature: z
			.preprocess(
				(value) =>
					value === "" || Number.isNaN(value)
						? null
						: value === 0
						? 0
						: value
						? value
						: undefined,
				z.number().nullish()
			)
			.nullish(),
		temperatureScale: z
			.union([z.nativeEnum(TemperatureScale), z.literal("")])
			.nullable()
			.transform((value) => (value !== "" ? value : null))
			.optional(),
		ingredients: z.string().array().nullish(),
	})
	.superRefine(({ temperature, temperatureScale }, refinementContext) => {
		// only optional if neither of temperature or temperature scale are filled

		if (temperature == null && temperatureScale != null) {
			return refinementContext.addIssue({
				code: z.ZodIssueCode.custom,
				message: t("recipe.errors.temperatureScale"),
				path: ["temperature"],
			});
		}

		if (temperature != null && temperatureScale == null) {
			return refinementContext.addIssue({
				code: z.ZodIssueCode.custom,
				message: t("recipe.errors.temperature"),
				path: ["temperatureScale"],
			});
		}
	});

export const StepsSchema = z.array(StepDTOSchema);
