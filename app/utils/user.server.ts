import { type z } from "zod";

import { LIMIT_FALLBACK, PAGE_FALLBACK } from "~/consts/pagination.const";
import { type PaginationSchema } from "~/schemas/pagination.schema";
import { isPageGreaterThanPageCount } from "~/utils/helpers/set-pagination.server";
import { prisma } from "~/utils/prisma.server";

interface UsersOverviewProps {
	request: Request;
	pagination?: z.infer<typeof PaginationSchema>;
}

export const usersOverview = async ({
	pagination = { page: PAGE_FALLBACK, limit: LIMIT_FALLBACK },
	request,
}: UsersOverviewProps) => {
	const count = await prisma.user.count();

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

	const foundUsers = await prisma.user.findMany({
		include: { _count: { select: { recipes: true } } },
		skip: (page - 1) * limit,
		take: limit,
	});

	return {
		items: foundUsers,
		pagination: {
			page,
			limit,
			count,
		},
	};
};
