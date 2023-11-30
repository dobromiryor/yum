import { Difficulty } from "@prisma/client";
import { z } from "zod";

import { NonEmptyStringSchema } from "~/schemas/common";

export const NewRecipeSchema = z.object({
	name: NonEmptyStringSchema,
	description: NonEmptyStringSchema,
	difficulty: z.nativeEnum(Difficulty),
	servings: z.coerce.number().gt(0).lte(20),
});
