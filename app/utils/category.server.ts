import { type z } from "zod";

import { LIMIT_FALLBACK, PAGE_FALLBACK } from "~/consts/pagination.const";
import { type PaginationSchema } from "~/schemas/pagination.schema";
import { isPageGreaterThanPageCount } from "~/utils/helpers/set-pagination.server";
import { prisma } from "~/utils/prisma.server";

interface CategoriesOverviewProps {
	request: Request;
	pagination?: z.infer<typeof PaginationSchema>;
}

export const categoriesOverview = async ({
	pagination = { page: PAGE_FALLBACK, limit: LIMIT_FALLBACK },
	request,
}: CategoriesOverviewProps) => {
	const count = await prisma.category.count();

	if (count <= 0) {
		return {
			items: [],
			pagination: { page: PAGE_FALLBACK, limit: LIMIT_FALLBACK, count: 0 },
		};
	}

	const { page, limit } = await isPageGreaterThanPageCount(
		pagination,
		count,
		request
	);

	const foundCategories = await prisma.category.findMany({
		include: { _count: { select: { recipes: true, visit: true } } },
		skip: (page - 1) * limit,
		take: limit,
	});

	return {
		items: foundCategories,
		pagination: {
			page,
			limit,
			count,
		},
	};
};
