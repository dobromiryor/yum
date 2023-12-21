export const MIN_RATING = 1;
export const MAX_RATING = 5;
export const RATING_ARR = Array.from(
	{ length: MAX_RATING - MIN_RATING + 1 },
	(_, i) => i + MIN_RATING
);
