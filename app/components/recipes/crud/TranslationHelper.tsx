import { useParams } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/common/UI/Button";
import { Language } from "~/enums/language.enum";
import { LanguageSchema } from "~/schemas/common";

interface TranslationHelperProps {
	children: ReactNode;
	content: string | null | undefined;
}

export const TranslationHelper = ({
	children,
	content,
}: TranslationHelperProps) => {
	const [isOpen, setIsOpen] = useState<boolean>(false);

	const { t } = useTranslation();
	const { lang: l } = useParams();

	if (!content) {
		return children;
	}

	const lang = LanguageSchema.parse(l);
	const invertedLang = lang === Language.EN ? Language.BG : Language.EN;

	return (
		<div className="flex-col gap-1">
			<div className="flex justify-between items-center">
				{children}
				<Button size="small" onClick={() => setIsOpen((prev) => !prev)}>
					{t(
						isOpen
							? "recipe.field.hideTranslation"
							: "recipe.field.viewTranslation"
					)}
				</Button>
			</div>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						animate={{ opacity: 1, translateY: 0, height: "fit-content" }}
						exit={{ opacity: 0, translateY: -10, height: 0 }}
						initial={{ opacity: 0, translateY: -10, height: 0 }}
						transition={{ duration: 0.3 }}
					>
						<p>{`${t(`nav.language.${invertedLang}`)}: ${content}`}</p>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
