import { z } from "zod";

export const ENVIRONMENT_VARIABLES_SCHEMA = z.object({
	/* GENERAL */
	APP_NAME: z.string().min(1),
	DOMAIN_URL: z.string().min(1),

	/* AUTH */
	THEME_SECRET: z.string().min(1),
	SESSION_SECRET: z.string().min(1),
	MAGIC_LINK_SECRET: z.string().min(1),

	/* SENDGRID */
	SENDGRID_API_KEY: z.string().min(1),
	SENDGRID_FROM_NAME: z.string().min(1),
	SENDGRID_FROM_EMAIL: z.string().min(1),
	SENDGRID_MAGIC_LINK_REGISTER_TEMPLATE: z.string().min(1),
	SENDGRID_MAGIC_LINK_LOGIN_TEMPLATE: z.string().min(1),
	SENDGRID_CHANGE_EMAIL_TEMPLATE: z.string().min(1),

	/* PRISMA/DB */
	DATABASE_URL: z.string().min(1),
	SEED_EMAIL: z.string().email().min(1),
});
