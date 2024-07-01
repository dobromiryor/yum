import { Difficulty } from "@prisma/client";
import { z } from "zod";

import { Language } from "~/enums/language.enum";

export const NonEmptyStringSchema = z.string().min(1);
export const OptionalStringSchema = z.string().optional();

export const EmailSchema = z.string().email().min(1);

export const NonEmptyNumberCoercionSchema = z.coerce.number().min(1);
export const OptionalNumberCoercionSchema = z.preprocess(
	(value) => (value ? value : undefined),
	z.coerce.number().optional()
);

export const NullishNumber = z
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

export const NonNullTranslatedContentSchema = z.record(
	z.nativeEnum(Language),
	z.string()
);

export const OptionalNonNullTranslatedContentSchema =
	NonNullTranslatedContentSchema.nullable();

export const TranslatedContentSchema = z.record(
	z.nativeEnum(Language),
	z.string().nullable()
);

export const OptionalTranslatedContentSchema =
	TranslatedContentSchema.nullish();

export const LanguageSchema = z.nativeEnum(Language);

export const SessionDataStorageSchema = z.object({
	name: OptionalTranslatedContentSchema,
	description: OptionalTranslatedContentSchema,
	content: OptionalTranslatedContentSchema,
	note: OptionalTranslatedContentSchema,
	languages: LanguageSchema.array().optional(),
});

export const DifficultySchema = z.nativeEnum(Difficulty);
