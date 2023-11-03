const SIBLING_SIZE = 1;
const PAGINATION_BREAK = "";

export const getPaginationArr = (page: number, totalPages: number) => {
	const range = (start: number, end: number) => {
		return Array.from(
			{ length: end - start + 1 },
			(_v, index) => index + start
		);
	};

	const pageItems = SIBLING_SIZE + 5;

	// 1, 2, 3
	if (pageItems >= totalPages) {
		return range(0, totalPages);
	}

	const leftSiblingIndex = Math.max(page - 1 - SIBLING_SIZE, 1);
	const rightSiblingIndex = Math.min(page - 1 + SIBLING_SIZE, totalPages - 1);

	const isLeftBreakVisible = leftSiblingIndex > 1;
	const isRightBreakVisible = rightSiblingIndex < totalPages - 2;

	// 1, 2, 3, ..., 5
	if (!isLeftBreakVisible && isRightBreakVisible) {
		const leftItemCount = 1 + 2 * SIBLING_SIZE;
		const leftRange = range(0, leftItemCount);

		return [...leftRange, PAGINATION_BREAK, totalPages - 1];
	}

	// 1, ..., 3, 4, 5
	if (isLeftBreakVisible && !isRightBreakVisible) {
		const rightItemCount = 3 + 2 * SIBLING_SIZE;
		const rightRange = range(totalPages - rightItemCount + 1, totalPages - 1);

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
			totalPages - 1,
		];
	}

	return [];
};
