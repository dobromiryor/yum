import { AnimatePresence, motion } from "framer-motion";

interface ErrorProps {
	className?: string;
	error: string | undefined;
}

export const FormError = ({ className, error }: ErrorProps) => {
	return (
		<AnimatePresence>
			{error && (
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
					{error}
				</motion.p>
			)}
		</AnimatePresence>
	);
};
