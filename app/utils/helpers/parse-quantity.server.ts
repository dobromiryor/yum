import { t } from "i18next";

import { QUANTITY_REGEX } from "~/consts/quantity-regex.const";

export const parseQuantity = (string: string): number => {
	const matches = QUANTITY_REGEX.test(string);

	if (!matches) {
		throw new Error(t("error.regex"));
	}

	const isFraction = string.includes("/");

	if (!isFraction) {
		return Number(string);
	}

	const stringArr = string.replace(",", ".").split("/");
	const mapToNumbers = stringArr.map((item) => Number(item));
	const reduced = mapToNumbers.reduce((prev, curr) => prev / curr);

	return reduced;
};
