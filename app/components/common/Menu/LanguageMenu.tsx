import { useLocation, useSubmit } from "@remix-run/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { MenuWrapper } from "~/components/common/Menu/Menu";
import { Button } from "~/components/common/UI/Button";
import { Icon } from "~/components/common/UI/Icon";
import { type Language } from "~/enums/language.enum";
import { useIsLoading } from "~/hooks/useIsLoading";
import i18next from "~/modules/i18n";

const ACTION_URL = "/action/change-language";

interface LanguageMenuProps {
	isMobile?: boolean;
	isNotAuthenticated?: boolean;
}

export const LanguageMenu = ({
	isMobile = false,
	isNotAuthenticated = false,
}: LanguageMenuProps) => {
	const submit = useSubmit();
	const { pathname, search } = useLocation();
	const [isLoading] = useIsLoading({ formAction: ACTION_URL });
	const { t, i18n } = useTranslation();
	const langs = i18next.supportedLngs;

	const handleLanguageChange = (lang: Language) => {
		i18n.changeLanguage(lang);
		submit(
			{ locale: lang, pathname: pathname + search },
			{ action: ACTION_URL, method: "post", replace: true }
		);
	};

	return (
		<MenuWrapper
			menuChildren={langs.map((lang) => (
				<Button
					key={`Language__Button__${lang}`}
					aria-current={i18n.resolvedLanguage === lang}
					aria-label={t(`nav.language.${lang}Label`)}
					className="typography-bold"
					variant={i18n.resolvedLanguage === lang ? "normal" : "text"}
					onClick={() => handleLanguageChange(lang)}
				>
					{t(`nav.language.${lang}`)}
				</Button>
			))}
			x={isNotAuthenticated ? "right" : "center"}
			y={isMobile ? "top" : "bottom"}
		>
			<div
				className={clsx(
					"flex justify-center items-center w-8 h-8 bg-light dark:bg-dark rounded-full select-none transition-colors duration-500 cursor-pointer"
				)}
			>
				<Icon
					className={clsx(isLoading && "animate-pulse")}
					label={t("nav.language.label")}
					name="language"
					size="20"
				/>
			</div>
		</MenuWrapper>
	);
};
