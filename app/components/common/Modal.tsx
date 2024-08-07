import { useNavigate } from "@remix-run/react";
import { AnimatePresence, motion } from "framer-motion";
import {
	useCallback,
	useEffect,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
} from "react";
import { useTranslation } from "react-i18next";

import { Button, type ButtonVariant } from "~/components/common/UI/Button";
import { useIsLoading } from "~/hooks/useIsLoading";

interface ModalProps {
	children: ReactNode;
	CTAFn?: (() => void) | string;
	CTALabel?: string;
	CTAVariant?: ButtonVariant;
	dismissFn?: () => void;
	dismissLabel?: string;
	dismissVariant?: ButtonVariant;
	isCTADisabled?: boolean;
	isLoading?: boolean;
	isOpen: boolean;
	prevPath: string;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	success?: boolean;
	title: string;
}

export const Modal = ({
	children,
	CTAFn,
	CTALabel,
	CTAVariant = "success",
	dismissFn,
	dismissLabel,
	dismissVariant = "primary",
	isCTADisabled = false,
	isLoading = false,
	isOpen,
	prevPath,
	setIsOpen,
	success,
	title,
}: ModalProps) => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [isSubmitting] = useIsLoading({ state: "submitting" });

	const handleCTA = () => {
		if (CTAFn && typeof CTAFn !== "string") {
			CTAFn();
		}
	};

	const handleDismiss = () => {
		dismissFn && dismissFn();
		setIsOpen(false);
	};

	const handleExitComplete = useCallback(() => {
		navigate(prevPath, { replace: true, preventScrollReset: true });
	}, [navigate, prevPath]);

	useEffect(() => {
		if (success) {
			handleExitComplete();
		}
	}, [handleExitComplete, success]);

	useEffect(() => {
		document.body.classList.add("overflow-hidden");

		return () => {
			document.body.classList.remove("overflow-hidden");
		};
	}, []);

	return (
		<AnimatePresence onExitComplete={handleExitComplete}>
			{isOpen && (
				<motion.div
					key="modal-overlay"
					animate={{ opacity: 1 }}
					className="fixed inset-0 flex justify-center items-center bg-dark-900/50 z-50"
					exit={{ opacity: 0 }}
					initial={{ opacity: 0 }}
					transition={{ duration: 0.3 }}
					onMouseDown={() => !(isLoading || isSubmitting) && handleDismiss()}
				>
					{isOpen && (
						<motion.div
							animate={{ opacity: 1, translateY: 0 }}
							aria-label={title}
							aria-modal={isOpen}
							className="flex flex-col gap-6 basis-[768px] h-fit max-h-screen min-w-80 max-w-3xl bg-light dark:bg-dark rounded-2xl py-6 m-4 shadow-xl"
							exit={{ opacity: 0, translateY: 20 }}
							initial={{ opacity: 0, translateY: -20 }}
							role="dialog"
							transition={{ delay: 0.15, duration: 0.3 }}
							onMouseDown={(e) => {
								e.stopPropagation();

								return false;
							}}
						>
							<h1 className="text-2xl typography-semibold px-6">{title}</h1>

							<div className="flex flex-col gap-2 overflow-y-auto scroll-p-1 px-6">
								{children}
							</div>

							<div className="flex justify-end items-start gap-2 px-6">
								{CTAFn && (
									<Button
										form={typeof CTAFn === "string" ? CTAFn : undefined}
										isDisabled={isCTADisabled || isLoading || isSubmitting}
										isLoading={isLoading || isSubmitting}
										type={typeof CTAFn === "string" ? "submit" : "button"}
										variant={CTAVariant}
										onClick={handleCTA}
									>
										{CTALabel ?? t("common.save")}
									</Button>
								)}
								<Button
									isDisabled={isLoading || isSubmitting}
									isLoading={isLoading || isSubmitting}
									variant={dismissVariant}
									onClick={() =>
										!(isLoading || isSubmitting) && handleDismiss()
									}
								>
									{dismissLabel ?? t("common.cancel")}
								</Button>
							</div>
						</motion.div>
					)}
				</motion.div>
			)}
		</AnimatePresence>
	);
};
