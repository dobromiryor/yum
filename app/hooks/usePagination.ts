import { useSearchParams } from "@remix-run/react";
import { useCallback, useEffect } from "react";
import { type z } from "zod";

import { LIMIT_ARR, LIMIT_FALLBACK } from "~/consts/pagination.const";
import { type PaginationWithCountSchema } from "~/schemas/pagination.schema";
import { toNumber } from "~/utils/helpers/to-number";

type Pagination = z.infer<typeof PaginationWithCountSchema>;

export const usePagination = (
	pagination: Pagination
): [Pagination, typeof set] => {
	const [searchParams, setSearchParams] = useSearchParams();

	const set = useCallback(
		(target: "page" | "limit", value: string | number) => {
			setSearchParams((prev) => {
				prev.set(target, String(value));

				return prev;
			});
		},
		[setSearchParams]
	);

	useEffect(() => {
		if (!searchParams.has("page") || !searchParams.has("limit")) {
			set("page", pagination?.page);
			set("limit", pagination?.limit);
		}

		if (searchParams.get("page")) {
			if (toNumber(searchParams.get("page"))! < 1) {
				set("page", 1);
			}

			if (
				toNumber(searchParams.get("page"))! >
				Math.ceil(pagination.count / pagination.limit)
			) {
				set("page", Math.ceil(pagination.count / pagination.limit));
			}
		}

		if (searchParams.get("limit")) {
			if (toNumber(searchParams.get("limit"))! < 1) {
				set("limit", LIMIT_FALLBACK);
			}

			if (
				toNumber(searchParams.get("limit"))! > LIMIT_ARR[LIMIT_ARR.length - 1]
			) {
				set("limit", LIMIT_ARR[LIMIT_ARR.length - 1]);
			}
		}
	}, [pagination, searchParams, set]);

	return [
		{
			page: toNumber(searchParams.get("page"))!,
			limit: toNumber(searchParams.get("limit"))!,
			count: pagination.count,
		},
		set,
	];
};
