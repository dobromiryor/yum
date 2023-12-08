import { Status } from "@prisma/client";
import { t } from "i18next";
import { z } from "zod";

import { SLUG_REGEX } from "~/consts/regex.const";
import { Language } from "~/enums/language.enum";

export const CategoryDTOSchema = z
	.object({
		name: z.record(z.nativeEnum(Language), z.string().min(1)),
		description: z.record(z.nativeEnum(Language), z.string()).nullable(),
		slug: z.string().min(3).max(80).regex(SLUG_REGEX),
	})
	.superRefine((values, ctx) => {
		const { description } = values;

		if (description) {
			const hasAllValues = Object.keys(description).every(
				(key) =>
					description[key as keyof typeof description] !== undefined &&
					description[key as keyof typeof description] !== null &&
					description[key as keyof typeof description] !== ""
			);
			const hasNoValues = Object.values(description).every(
				(value) => value === undefined || value === null || value === ""
			);
			const hasSomeValues = Object.values(description).some(
				(value) => value !== undefined && value !== null && value !== ""
			);

			if (hasSomeValues && !(hasAllValues || hasNoValues)) {
				Object.keys(description).forEach((item) =>
					ctx.addIssue({
						code: "custom",
						message: t("admin.category.error.descriptionRequired"),
						path: [`description.${item}`],
						fatal: true,
					})
				);
			}
		}
	});

export const UpdateCategoryStatusSchema = z.object({
	id: z.string(),
	status: z.nativeEnum(Status),
});
