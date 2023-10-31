import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
	Children,
	cloneElement,
	isValidElement,
	useRef,
	useState,
	type ReactElement,
	type ReactNode,
} from "react";

import { useClose } from "~/hooks/useClose";

interface MenuProps {
	children: ReactNode;
	button: ReactNode;
	isButtonRounded?: boolean;
	positionX?: "left" | "center" | "right";
	positionY?: "top" | "bottom";
}

export const Menu = ({
	button,
	children,
	isButtonRounded = false,
	positionX = "center",
	positionY = "bottom",
}: MenuProps) => {
	const [isOpen, setIsOpen] = useState(false);

	const buttonRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	useClose(buttonRef, menuRef, isOpen, setIsOpen);

	const menuXStyles = {
		left: "left-0",
		center: "left-1/2 -translate-x-1/2",
		right: "right-0",
	};

	const menuYStyles = {
		top: "bottom-[calc(100%+10px)]",
		bottom: "top-[calc(100%+10px)]",
	};

	const arrowXStyles = {
		left: "left-[calc(50%-8px)]",
		center: "left-[calc(100%-8px)]",
		right: "right-[calc(50%-8px)]",
	};

	const arrowYStyles = {
		top: "bottom-[calc(100%+2px)] border-t-8 border-t-secondary dark:border-t-primary",
		bottom:
			"top-[calc(100%+2px)] border-b-8 border-b-secondary dark:border-b-primary",
	};

	return (
		<div className="relative">
			<button
				ref={buttonRef}
				aria-expanded={isOpen}
				className={clsx(isButtonRounded && "rounded-full", "flex")}
				onClick={() => setIsOpen((prev) => !prev)}
			>
				{button}
			</button>

			<AnimatePresence initial={false}>
				<motion.div
					key="MenuList"
					ref={menuRef}
					animate={
						isOpen
							? {
									display: "flex",
									visibility: "visible",
									opacity: 1,
									translateY: positionY === "bottom" ? 2 : -2,
							  }
							: {
									opacity: 0.5,
									translateY: positionY === "bottom" ? 4 : -4,
									transitionEnd: { display: "none", visibility: "hidden" },
							  }
					}
					className={clsx(
						"absolute p-1 gap-1 rounded flex flex-col bg-secondary dark:bg-primary shadow-xl",
						menuXStyles[positionX],
						menuYStyles[positionY]
					)}
					style={{
						translateX: positionX === "center" ? "-50%" : 0,
					}}
					transition={{ duration: 0.1 }}
				>
					{Children.map(children, (child) => {
						if (isValidElement(child)) {
							return cloneElement(child as ReactElement, {
								tabIndex: isOpen ? 0 : -1,
								onClick: () => {
									child.props.onClick && child.props.onClick();
									setIsOpen((prev) => !prev);
								},
							});
						}

						return null;
					})}
				</motion.div>
				<motion.div
					key="Menu__Arrow"
					animate={
						isOpen
							? {
									display: "flex",
									visibility: "visible",
									opacity: 1,
									translateY: positionY === "bottom" ? 2 : -2,
							  }
							: {
									opacity: 0.5,
									translateY: positionY === "bottom" ? 4 : -4,
									transitionEnd: { display: "none", visibility: "hidden" },
							  }
					}
					className={clsx(
						"absolute w-0 h-0 border-l-8 border-r-8 border-x-transparent",
						arrowXStyles[positionX],
						arrowYStyles[positionY]
					)}
					style={{
						translateX: positionX === "center" ? "calc(-50% - 8px)" : 0,
					}}
					transition={{ duration: 0.1 }}
				/>
			</AnimatePresence>
		</div>
	);
};
