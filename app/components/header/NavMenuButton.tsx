import clsx from "clsx";
import { motion } from "framer-motion";
import { type Dispatch, type SetStateAction } from "react";

interface MenuButtonProps {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
}

export const NavMenuButton = ({ isOpen, setIsOpen }: MenuButtonProps) => {
	const lineStyles =
		"absolute min-w-5 min-h-0.5 bg-dark dark:bg-light transition-colors";

	return (
		<motion.div
			className="relative flex flex-col justify-center items-center sm:hidden min-w-8 min-h-8 cursor-pointer"
			onClick={() => setIsOpen((prev) => !prev)}
		>
			<motion.div
				animate={
					isOpen
						? {
								/* open */
								rotate: -135,
								translateY: 4,
						  }
						: {
								/* close */
								rotate: 0,
								translateY: 0,
						  }
				}
				className={clsx(lineStyles, "top-1/3")}
				initial={false}
			/>
			<motion.div
				animate={
					isOpen
						? {
								/* open */
								rotate: 135,
								translateY: -4,
						  }
						: {
								/* close */
								rotate: 0,
								translateY: 0,
						  }
				}
				className={clsx(lineStyles, "bottom-1/3")}
				initial={false}
			/>
		</motion.div>
	);
};
