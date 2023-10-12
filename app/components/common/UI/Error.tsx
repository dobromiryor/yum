import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useRemixFormContext } from "remix-hook-form";

interface ErrorProps {
	className?: string;
	name: string;
	translationValidation?: boolean;
}

export const Error = ({
	className,
	name,
	translationValidation,
}: ErrorProps) => {
	const { t } = useTranslation();
	const { formState } = useRemixFormContext();
	const formError = formState.errors[name];

	const error = useMemo(
		() =>
			formError && formError instanceof Array
				? formError[0].message.toString()
				: formError?.message?.toString(),
		[formError]
	);

	return (
		<AnimatePresence>
			{((formError && error) || translationValidation === false) && (
				<motion.p
					animate={{
						height: "fit-content",
						translateY: 0,
						opacity: 1,
					}}
					className={className}
					exit={{
						height: 0,
						translateY: -10,
						opacity: 0,
					}}
					initial={{
						height: 0,
						translateY: -10,
						opacity: 0,
					}}
					transition={{ duration: 0.3 }}
				>
					{error ?? t("error.translationMissing")}
				</motion.p>
			)}
		</AnimatePresence>
	);
};
