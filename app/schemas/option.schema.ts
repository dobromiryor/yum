import { z } from "zod";

import { NonEmptyStringSchema } from "~/schemas/common";

export const OptionSchema = z.object({
	label: NonEmptyStringSchema,
	value: NonEmptyStringSchema,
});

export const OptionsSchema = z.array(OptionSchema);
