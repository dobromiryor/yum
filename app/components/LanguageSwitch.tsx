import clsx from "clsx";
import { useTranslation } from "react-i18next";

import i18next from "~/i18n";

export const LanguageSwitch = () => {
	const { t, i18n } = useTranslation();
	const langs = i18next.supportedLngs;

	return (
		<div className="flex gap-2">
			{langs.map((lang) => (
				<button
					key={`Language__Button__${lang}`}
					aria-current={i18n.resolvedLanguage === lang}
					aria-label={t(`nav.language.${lang}Label` as const)}
					className={clsx(i18n.resolvedLanguage === lang && "font-bold")}
					onClick={() => i18n.changeLanguage(lang)}
				>
					{t(`nav.language.${lang}` as const)}
				</button>
			))}
		</div>
	);
};
