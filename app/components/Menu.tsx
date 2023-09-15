import clsx from "clsx";
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
}

export const Menu = ({
	button,
	children,
	isButtonRounded = false,
}: MenuProps) => {
	const [isOpen, setIsOpen] = useState(false);

	const buttonRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	useClose(buttonRef, menuRef, isOpen, setIsOpen);

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
			<div
				ref={menuRef}
				aria-hidden={!isOpen}
				className={clsx(
					"absolute top-10 right-0 mt-1 p-1 gap-1 rounded flex flex-col justify-end bg-light dark:bg-dark shadow-lg ",
					isOpen ? "flex" : "hidden",
					// arrow
					"before:absolute before:-top-2 before:right-2 before:w-0 before:h-0 before:border-l-8 before:border-r-8 before:border-b-8 before:border-x-transparent before:border-b-light dark:before:border-b-dark"
				)}
			>
				{Children.map(children, (child) => {
					if (isValidElement(child)) {
						return cloneElement(child as ReactElement, {
							className: clsx(
								"px-2 py-1 bg-light dark:bg-dark hover:bg-secondary dark:hover:bg-primary transition-colors rounded",
								child.props.className
							),
							tabIndex: isOpen ? 0 : -1,
							onClick: () => {
								child.props.onClick();
								setIsOpen(false);
							},
						});
					}

					return null;
				})}
			</div>
		</div>
	);
};
