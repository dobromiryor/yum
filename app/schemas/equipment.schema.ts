import { Length, Volume } from "@prisma/client";
import { t } from "i18next";
import { z } from "zod";

import { NonEmptyStringSchema } from "~/schemas/common";

const NullableNumberString = z
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
	.nullish();

export const EquipmentDTOSchema = z
	.object({
		name: NonEmptyStringSchema,
		width: NullableNumberString,
		height: NullableNumberString,
		length: NullableNumberString,
		dimensionUnit: z.nativeEnum(Length).nullish(),
		volume: NullableNumberString,
		volumeUnit: z.nativeEnum(Volume).nullish(),
	})
	.superRefine((values, ctx) => {
		const { name, ...rest } = values;
		const { dimensionUnit, height, length, volume, volumeUnit, width } = rest;
		const isVolume = !!volume || !!volumeUnit;
		const isDimension = !!dimensionUnit || !!height || !!length || !!width;

		if (isVolume && isDimension) {
			const errFields = Object.keys(
				Object.fromEntries(Object.entries(rest).filter((item) => !!item[1]))
			);

			// volume or dimension
			errFields.map((item) =>
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: t("recipe.errors.dimensionOrVolume"),
					path: [item],
					fatal: true,
				})
			);
		}

		// dimensions
		if (!!dimensionUnit && (!length || !width)) {
			const errFields = Object.keys(
				Object.fromEntries(
					Object.entries({ length, width }).filter((item) => !item[1])
				)
			);

			// length and width are required when dimension unit is selected
			errFields.map((item) =>
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: t("recipe.errors.dimensionMissing"),
					path: [item],
					fatal: true,
				})
			);
		}

		if (!dimensionUnit && (height || length || width)) {
			// dimensionUnit is required if any dimensions are entered
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: t("recipe.errors.dimensionUnitMissing"),
				path: ["dimensionUnit"],
				fatal: true,
			});
		}

		// volume
		if (volumeUnit && !volume) {
			// volume is required when volume unit is selected
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: t("recipe.errors.volumeMissing"),
				path: ["volume"],
				fatal: true,
			});
		}

		if (volume && !volumeUnit) {
			// volume unit is required if volume is entered
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: t("recipe.errors.volumeUnitMissing"),
				path: ["volumeUnit"],
				fatal: true,
			});
		}
	});
