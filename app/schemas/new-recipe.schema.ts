import { Difficulty } from "@prisma/client";
import { z } from "zod";

import { NonEmptyStringSchema, NullishNumber } from "~/schemas/common";

export const NewRecipeSchema = z.object({
	name: NonEmptyStringSchema,
	description: NonEmptyStringSchema,
	difficulty: z.nativeEnum(Difficulty),
	servings: NullishNumber,
});
