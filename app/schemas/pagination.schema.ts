import { z } from "zod";

import { LIMIT_ARR, PAGE_FALLBACK } from "~/consts/pagination.const";

export const PaginationSchema = z.object({
	page: z.coerce.number().gte(PAGE_FALLBACK),
	limit: z.coerce
		.number()
		.gte(LIMIT_ARR[0])
		.lte(LIMIT_ARR[LIMIT_ARR.length - 1]),
});

export const PaginationWithCountSchema = PaginationSchema.extend({
	page: z.coerce.number().gte(PAGE_FALLBACK),
	limit: z.coerce
		.number()
		.gte(LIMIT_ARR[0])
		.lte(LIMIT_ARR[LIMIT_ARR.length - 1]),
	count: z.coerce.number().gte(0),
});
