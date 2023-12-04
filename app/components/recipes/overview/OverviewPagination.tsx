import { type z } from "zod";

import { Button } from "~/components/common/UI/Button";
import { Icon } from "~/components/common/UI/Icon";
import { type PaginationWithCountSchema } from "~/schemas/pagination.schema";
import { getPaginationArr } from "~/utils/helpers/get-pagination-arr";

interface OverviewPaginationProps {
	pagination: z.infer<typeof PaginationWithCountSchema>;
	set: (target: "page" | "limit", value: string | number) => void;
}

export const OverviewPagination = ({
	pagination,
	set,
}: OverviewPaginationProps) => {
	const { page, limit, count } = pagination;

	if (!limit || count <= limit) {
		return null;
	}

	const paginationArr = getPaginationArr(page, Math.ceil(count / limit));

	return (
		<div className="flex justify-center items-center">
			<div className="flex justify-center items-center gap-2 p-3 rounded-xl bg-secondary dark:bg-primary">
				<Button
					className="basis-7 max-w-7"
					isDisabled={page <= 1}
					rounded="full"
					size="smallSquare"
					variant="normal"
					onClick={() => set("page", page - 1)}
				>
					<Icon name="arrow_back" />
				</Button>
				{paginationArr.map((item, index) =>
					typeof item === "string" ? (
						<div key={`Pagination__Page__Break__${index}`}>{item}</div>
					) : (
						<Button
							key={`Pagination__Page__Button__${item + 1}__${index}`}
							className="basis-7 w-7"
							rounded="full"
							size="smallSquare"
							variant={item + 1 === page ? "normal" : "primary"}
							onClick={() => set("page", item + 1)}
						>
							{item + 1}
						</Button>
					)
				)}
				<Button
					className="basis-7 max-w-7"
					isDisabled={page * limit >= count}
					rounded="full"
					size="smallSquare"
					variant="normal"
					onClick={() => set("page", page + 1)}
				>
					<Icon name="arrow_forward" />
				</Button>
			</div>
		</div>
	);
};
