import { useLocation, useSubmit } from "@remix-run/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { Menu } from "~/components/common/Menu/Menu";
import { Button } from "~/components/common/UI/Button";
import { Icon } from "~/components/common/UI/Icon";
import { type Language } from "~/enums/language.enum";
import { useIsLoading } from "~/hooks/useIsLoading";
import i18next from "~/modules/i18n";

const ACTION_URL = "/action/change-language";

interface LanguageMenuProps {
	isMobile?: boolean;
}

export const LanguageMenu = ({ isMobile = false }: LanguageMenuProps) => {
	const submit = useSubmit();
	const { pathname } = useLocation();
	const [isLoading] = useIsLoading({ formAction: ACTION_URL });
	const { t, i18n } = useTranslation();
	const langs = i18next.supportedLngs;

	const renderButton = () => (
		<div
			className={clsx(
				"flex justify-center items-center w-8 h-8 bg-light dark:bg-dark rounded-full shadow-md select-none transition-colors duration-500"
			)}
		>
			<Icon
				className={clsx(isLoading && "animate-pulse")}
				label={t("nav.language.label")}
				name="language"
				size="20"
			/>
		</div>
	);

	const handleLanguageChange = (lang: Language) => {
		i18n.changeLanguage(lang);
		submit(
			{ locale: lang, pathname },
			{ action: ACTION_URL, method: "post", replace: true }
		);
	};

	return (
		<Menu
			isButtonRounded
			button={renderButton()}
			positionX={isMobile ? "right" : "center"}
			positionY={isMobile ? "top" : "bottom"}
		>
			{langs.map((lang) => (
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
		</Menu>
	);
};
