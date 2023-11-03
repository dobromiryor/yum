import isEqual from "lodash.isequal";
import { type z } from "zod";

import {
	LIMIT_ARR,
	LIMIT_FALLBACK,
	PAGE_FALLBACK,
} from "~/consts/pagination.const";
import { PaginationSchema } from "~/schemas/pagination.schema";

type Pagination = z.infer<typeof PaginationSchema>;

export const setPagination = (request: Request) => {
	const { searchParams } = new URL(request.clone().url);

	if (!searchParams.has("page")) {
		searchParams.append("page", String(PAGE_FALLBACK));
	}

	if (!searchParams.has("limit")) {
		searchParams.append("limit", String(LIMIT_FALLBACK));
	}

	const searchParamsObj = Object.fromEntries(searchParams.entries());

	const pagination = PaginationSchema.safeParse(searchParamsObj);

	if (!pagination.success) {
		pagination.error.errors.forEach((error) => {
			if (isEqual(error.path, ["page"])) {
				if (error.code === "too_small") {
					searchParams.set("page", String(PAGE_FALLBACK));
				}
			}

			if (isEqual(error.path, ["limit"])) {
				if (error.code === "too_small") {
					searchParams.set("limit", String(LIMIT_FALLBACK));
				}

				if (error.code === "too_big") {
					searchParams.set("limit", String(LIMIT_ARR[LIMIT_ARR.length - 1]));
				}
			}
		});
	}

	if (pagination.success) {
		return pagination.data;
	}

	return PaginationSchema.parse({
		page: searchParams.get("page"),
		limit: searchParams.get("limit"),
	});
};

export const isPageGreaterThanPageCount = async (
	pagination: Pagination,
	count: number,
	request: Request
) => {
	const { limit } = pagination;
	let { page } = pagination;
	const pageCount = Math.ceil(count / limit);

	if (page > pageCount) {
		const { searchParams } = new URL(request.clone().url);

		searchParams.set("page", String(pageCount));
		page = pageCount;
	}

	return { page, limit };
};
