import { z } from "zod";

import { EmailSchema } from "~/schemas/common";

export const LoginIntentSchema = z.union([
	z.literal("login"),
	z.literal("reset"),
]);

export const LoginDTOSchema = z
	.object({
		email: EmailSchema.optional(),
		intent: LoginIntentSchema,
	})
	.superRefine(({ email, intent }, ctx) => {
		if (intent === "login" && (typeof email === "undefined" || email === "")) {
			return ctx.addIssue({
				code: "invalid_type",
				expected: "string",
				received: "undefined",
				path: ["email"],
				fatal: true,
			});
		}
	});
