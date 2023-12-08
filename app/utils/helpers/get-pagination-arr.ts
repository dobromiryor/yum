import { PAGE_FALLBACK } from "~/consts/pagination.const";

const SIBLING_SIZE = 1;
const PAGINATION_BREAK = "";

const validate = (value: number) => {
	if (value === 0 || value === Infinity) {
		return PAGE_FALLBACK;
	}

	return value;
};

export const getPaginationArr = (page: number, totalPages: number) => {
	const range = (start: number, end: number) => {
		return Array.from(
			{ length: end - start + 1 },
			(_v, index) => index + start
		);
	};

	const pageItems = SIBLING_SIZE + 5;

	// 1, 2, 3
	if (pageItems >= validate(totalPages)) {
		return range(0, validate(totalPages) - 1);
	}

	const leftSiblingIndex = Math.max(validate(page) - 1 - SIBLING_SIZE, 1);
	const rightSiblingIndex = Math.min(
		validate(page) - 1 + SIBLING_SIZE,
		validate(totalPages) - 1
	);

	const isLeftBreakVisible = leftSiblingIndex > 1;
	const isRightBreakVisible = rightSiblingIndex < validate(totalPages) - 2;

	// 1, 2, 3, ..., 5
	if (!isLeftBreakVisible && isRightBreakVisible) {
		const leftItemCount = 1 + 2 * SIBLING_SIZE;
		const leftRange = range(0, leftItemCount);

		return [...leftRange, PAGINATION_BREAK, validate(totalPages) - 1];
	}

	// 1, ..., 3, 4, 5
	if (isLeftBreakVisible && !isRightBreakVisible) {
		const rightItemCount = 3 + 2 * SIBLING_SIZE;
		const rightRange = range(
			validate(totalPages) - rightItemCount + 1,
			validate(totalPages) - 1
		);

		return [0, PAGINATION_BREAK, ...rightRange];
	}

	// 1, ..., 3, ..., 5
	if (isLeftBreakVisible && isRightBreakVisible) {
		const middleRange = range(leftSiblingIndex, rightSiblingIndex);

		return [
			0,
			PAGINATION_BREAK,
			...middleRange,
			PAGINATION_BREAK,
			validate(totalPages) - 1,
		];
	}

	return [];
};
