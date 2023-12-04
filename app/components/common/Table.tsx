import {
	flexRender,
	getCoreRowModel,
	useReactTable,
	type ColumnDef,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { type z } from "zod";

import { Button } from "~/components/common/UI/Button";
import { Icon } from "~/components/common/UI/Icon";
import { LIMIT_ARR } from "~/consts/pagination.const";
import { type PaginationWithCountSchema } from "~/schemas/pagination.schema";
import { getPaginationArr } from "~/utils/helpers/get-pagination-arr";

interface TablePaginationProps {
	pagination: z.infer<typeof PaginationWithCountSchema>;
	set: (target: "page" | "limit", value: string | number) => void;
}

interface TableProps<T extends object> extends TablePaginationProps {
	columns: ColumnDef<T>[];
	data: T[];
}

export const Table = <T extends object>({
	columns,
	data,
	pagination,
	set,
}: TableProps<T>) => {
	const { t } = useTranslation();

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
	});

	return (
		<div className="flex-1 flex flex-col gap-3">
			<div className="flex-1 flex p-3 bg-secondary dark:bg-primary rounded-2xl shadow-lg overflow-auto">
				<table className="flex-1 border-separate border-spacing-0">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id} className="group">
								{headerGroup.headers.map((header) => {
									return (
										<th
											key={header.id}
											className={clsx(
												"p-1 border-y border-r bg-light-50 dark:bg-dark-700 border-secondary dark:border-primary",
												"first:border",
												"first:rounded-tl-xl last:rounded-tr-xl",
												"typography-medium"
											)}
											colSpan={header.colSpan}
										>
											{header.isPlaceholder ? null : (
												<div>
													{flexRender(
														header.column.columnDef.header,
														header.getContext()
													)}
												</div>
											)}
										</th>
									);
								})}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.length !== 0 ? (
							table.getRowModel().rows.map((row) => {
								return (
									<tr key={row.id} className="group">
										{row.getVisibleCells().map((cell) => {
											return (
												<td
													key={cell.id}
													className={clsx(
														"bg-light dark:bg-dark p-2 border-b border-r border-secondary dark:border-primary",
														"first:border-l",
														"group-last:first:rounded-bl-xl",
														"group-last:last:rounded-br-xl"
													)}
												>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext()
													)}
												</td>
											);
										})}
									</tr>
								);
							})
						) : (
							<tr>
								<td
									className={clsx(
										" p-2 border-l border-b border-r border-primary dark:border-secondary rounded-b-xl"
									)}
									colSpan={1000}
								>
									<div className="flex justify-center items-center">
										<span>{t("common.noData")}</span>
									</div>
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			<TablePagination pagination={pagination} set={set} />
		</div>
	);
};

const TablePagination = ({ pagination, set }: TablePaginationProps) => {
	const { t } = useTranslation();

	const { count, limit, page } = pagination;

	if (count === 0) {
		return null;
	}

	const paginationArr = getPaginationArr(page, Math.ceil(count / limit));

	return (
		<div className="flex flex-wrap justify-center gap-3">
			<div className="flex justify-center items-center p-3 rounded-xl bg-secondary dark:bg-primary shadow-lg">
				<span>{`${t("common.total")}: ${count}`}</span>
			</div>
			<div className="flex justify-center items-center gap-2 p-3 rounded-xl bg-secondary dark:bg-primary shadow-lg">
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
			<div className="flex justify-center items-center p-3 rounded-xl bg-secondary dark:bg-primary shadow-lg">
				<label className="leading-[21px]" htmlFor="limit">
					{`${t("common.limit")}: `}
				</label>
				<select
					className="bg-secondary dark:bg-primary text-dark dark:text-light cursor-pointer"
					defaultValue={limit}
					name="limit"
					onChange={(e) => set("limit", e.target.value)}
				>
					{LIMIT_ARR.map((item) => (
						<option key={`Pagination__Limit__${item}`} value={item}>
							{item}
						</option>
					))}
				</select>
			</div>
		</div>
	);
};
