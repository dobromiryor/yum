import { z } from "zod";

export const ENVIRONMENT_VARIABLES_SCHEMA = z.object({
	/* GENERAL */
	APP_NAME: z.string().min(1),
	DOMAIN_URL: z.string().min(1),

	/* AUTH */
	THEME_SECRET: z.string().min(1),
	SESSION_SECRET: z.string().min(1),
	I18NEXT_SECRET: z.string().min(1),
	MAGIC_LINK_SECRET: z.string().min(1),
	SESSION_DATA_SECRET: z.string().min(1),

	/* MAIL */
	MAIL_API_KEY: z.string().min(1),
	MAIL_FROM: z.string().min(1),

	/* CLOUDINARY */
	CLOUDINARY_CLOUD_NAME: z.string().min(1),
	CLOUDINARY_API_KEY: z.string().min(1),
	CLOUDINARY_API_SECRET: z.string().min(1),

	/* PRISMA/DB */
	DATABASE_URL: z.string().min(1),
	SEED_EMAIL: z.string().email().min(1),
});
