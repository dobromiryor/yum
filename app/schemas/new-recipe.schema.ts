import { Difficulty } from "@prisma/client";
import { z } from "zod";

import { NonEmptyStringSchema } from "~/schemas/common";

const NullishNumber = z
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

export const NewRecipeSchema = z.object({
	name: NonEmptyStringSchema,
	description: NonEmptyStringSchema,
	difficulty: z.nativeEnum(Difficulty),
	prepTime: NullishNumber,
	cookTime: NullishNumber,
	bakeTime: NullishNumber,
	servings: NullishNumber,
});
