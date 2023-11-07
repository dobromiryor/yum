import { useSearchParams } from "@remix-run/react";
import { useCallback, useEffect, useMemo } from "react";
import { type z } from "zod";

import {
	LIMIT_ARR,
	LIMIT_FALLBACK,
	PAGE_FALLBACK,
} from "~/consts/pagination.const";
import { type PaginationWithCountSchema } from "~/schemas/pagination.schema";
import { toNumber } from "~/utils/helpers/to-number";

type Pagination = z.infer<typeof PaginationWithCountSchema>;

export const usePagination = (
	pagination: Pagination
): [Pagination, typeof set] => {
	const [searchParams, setSearchParams] = useSearchParams();
	const pageCount = useMemo(
		() => Math.ceil(pagination.count / pagination.limit),
		[pagination]
	);

	const set = useCallback(
		(target: "page" | "limit", value: string | number, replace = false) => {
			setSearchParams(
				(prev) => {
					prev.set(target, String(value));

					return prev;
				},
				{ replace }
			);
		},
		[setSearchParams]
	);

	useEffect(() => {
		if (!searchParams.has("page") || !searchParams.has("limit")) {
			set("page", pagination?.page, true);
			set("limit", pagination?.limit, true);
		}

		if (searchParams.get("page")) {
			if (pageCount < PAGE_FALLBACK) {
				if (toNumber(searchParams.get("page"))! < PAGE_FALLBACK) {
					set("page", PAGE_FALLBACK, true);
				}
			} else {
				if (toNumber(searchParams.get("page"))! > pageCount) {
					set("page", pageCount, true);
				}
			}
		}

		if (searchParams.get("limit")) {
			if (toNumber(searchParams.get("limit"))! < 1) {
				set("limit", LIMIT_FALLBACK, true);
			} else if (
				toNumber(searchParams.get("limit"))! > LIMIT_ARR[LIMIT_ARR.length - 1]
			) {
				set("limit", LIMIT_ARR[LIMIT_ARR.length - 1], true);
			}
		}
	}, [pageCount, pagination, searchParams, set]);

	return [
		{
			page: toNumber(searchParams.get("page"))!,
			limit: toNumber(searchParams.get("limit"))!,
			count: pagination.count,
		},
		set,
	];
};
