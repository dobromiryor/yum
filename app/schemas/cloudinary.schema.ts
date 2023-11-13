import { z } from "zod";

export const CloudinaryUploadApiResponseSchema = z.object({
	public_id: z.string(),
	version: z.number(),
	folder: z.string(),
	width: z.number(),
	height: z.number(),
	format: z.string(),
	bytes: z.number(),
	etag: z.string(),
	url: z.string().url(),
	secure_url: z.string().url(),
	original_filename: z.string(),
	overwritten: z.boolean(),
});

export const CloudinaryUploadApiResponseWithBlurHashSchema =
	CloudinaryUploadApiResponseSchema.extend({
		blurHash: z.string().min(6),
	});
