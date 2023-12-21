import { z } from "zod";

import { MAX_RATING, MIN_RATING } from "~/consts/rating.const";

export const RecipeRatingSchema = z.object({
	value: z.number().min(MIN_RATING).max(MAX_RATING),
	ratingId: z.string().optional(),
});

export const RecipeReviewsIntentSchema = z.union([
	z.literal(""),
	z.literal("rating"),
	z.literal("new_comment"),
	z.literal("edit_comment"),
	z.literal("reply_comment"),
	z.literal("hide_comment"),
	z.literal("delete_comment"),
	z.literal("report_comment"),
]);

export const RecipeCommentSchema = z.object({
	content: z.string().min(1),
	commentId: z.string().optional(),
	parentId: z.string().optional(),
	intent: RecipeReviewsIntentSchema.optional(),
});

export const RecipeCommentIdSchema = z.object({
	commentId: z.string(),
});

export const RecipeReportCommentSchema = z.object({
	commentId: z.string(),
	userId: z.string(),
	reportId: z.string().optional(),
});

export const RecipeReviewsSchema = z.object({
	intent: RecipeReviewsIntentSchema,
	data: z.string(),
});
