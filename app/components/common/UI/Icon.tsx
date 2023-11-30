import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type IconSize = "14" | "16" | "20" | "36";

interface IconProps {
	name: string;
	label?: string;
	className?: string;
	size?: IconSize;
}

export const Icon = ({ name, label, className, size = "14" }: IconProps) => {
	const [isLoaded, setIsLoaded] = useState(false);
	const placeholderStyles = {
		"14": "h-[7px] w-[7px]",
		"16": "h-2 w-2",
		"20": "h-2.5 w-2.5",
		"36": "h-[18px] w-[18px]",
	};
	const sizeStyles = {
		"14": "text-sm leading-[14px] h-[14px] w-[14px]",
		"16": "text-base leading-4 h-4 w-4",
		"20": "text-xl leading-5 h-5 w-5",
		"36": "text-4xl leading-9 h-9 w-9",
	};

	useEffect(() => {
		const isFontLoaded = async () => {
			await document.fonts.ready.then(async (fonts) =>
				fonts.forEach(async (font) => {
					if (
						font.family === "Material Symbols Rounded" ||
						font.family === '"Material Symbols Rounded"'
					) {
						await font.load();
						await font.loaded.then(() => setIsLoaded(true));
					}
				})
			);
		};

		isFontLoaded();
	}, []);

	return (
		<div
			aria-hidden={!label}
			aria-label={label}
			className="flex justify-center items-center"
		>
			<AnimatePresence mode="popLayout">
				{isLoaded ? (
					<motion.span
						aria-hidden
						animate={{ opacity: 1, filter: "blur(0px)" }}
						className={clsx(
							sizeStyles[size],
							"material-symbols-rounded select-none transition-opacity duration-500",
							className
						)}
						exit={{ opacity: 0 }}
						initial={{ opacity: 0, filter: "blur(4px)" }}
					>
						{name}
					</motion.span>
				) : (
					<motion.div
						animate={{ opacity: 1 }}
						className={clsx(
							"flex justify-center items-center blur-sm",
							sizeStyles[size]
						)}
						exit={{ opacity: 0 }}
						initial={{ opacity: 1 }}
					>
						<div
							className={clsx(
								"bg-dark dark:bg-light rounded-full ",
								placeholderStyles[size]
							)}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
