import { type TFunction } from "i18next";

export const formatTime = (
	minutes: number,
	t?: TFunction<"translation", undefined>
) => {
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;

	if (!t) {
		return `${h}:${m}`;
	}

	if (!h) {
		return t("recipe.field.minutes", { count: m });
	}

	if (h && !m) {
		return t("recipe.field.hours", { count: h });
	}

	return `${t("recipe.field.hours", { count: h })} ${t("common.and")} ${t(
		"recipe.field.minutes",
		{ count: m }
	)}`;
};
