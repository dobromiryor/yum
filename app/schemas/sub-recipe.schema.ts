import { z } from "zod";

export const SubRecipeDTOSchema = z.object({
	name: z.string().min(1),
});
