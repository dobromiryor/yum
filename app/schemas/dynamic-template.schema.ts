import { z } from "zod";

export const DynamicTemplateSchema = z.object({
	appName: z.string(),
	subject: z.string(),
	preheader: z.string(),
	contentTitle: z.string(),
	contentParagraph: z.string(),
	contentCTA: z.string(),
	buttonURL: z.string(),
	unsubscribeURL: z.string().optional(),
	unsubscribePreferencesURL: z.string().optional(),
});
