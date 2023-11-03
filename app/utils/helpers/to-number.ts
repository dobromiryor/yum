export const toNumber = (value: string | number | null | undefined) => {
	const number = Number(value);

	return !isNaN(number) ? number : undefined;
};
