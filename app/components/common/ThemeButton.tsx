import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { Theme, useTheme } from "~/utils/providers/theme-provider";

export const ThemeSwitch = () => {
	const [theme, setTheme] = useTheme();
	const { t } = useTranslation();

	const isLight = theme === Theme.LIGHT ? true : false;

	const toggleTheme = () => {
		setTheme((prevTheme) =>
			prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT
		);
	};

	return (
		<div className="inline-flex items-center gap-2">
			<button
				aria-details={t(isLight ? "nav.theme.light" : "nav.theme.dark")}
				aria-label={t("nav.theme.label")}
				className={clsx(
					"relative flex justify-center item-center bg-light dark:bg-dark w-8 h-8 rounded-full shadow-md transition-colors duration-500"
				)}
				onClick={toggleTheme}
			>
				<div
					aria-hidden
					className={clsx("absolute m-2 w-4 h-4 rounded-full bg-light")}
				/>
				<div
					aria-hidden
					className={clsx(
						"absolute m-2 w-4 h-4 rounded-full transition-all duration-500",
						isLight
							? "bg-amber-300 translate-x-0 translate-y-0"
							: "bg-dark -translate-x-1 -translate-y-1"
					)}
				/>
			</button>
			{/* <span>{t("nav.theme.label")}</span> */}
		</div>
	);
};
