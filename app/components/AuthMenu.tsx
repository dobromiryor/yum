import { useTranslation } from "react-i18next";

import { useRef, useState } from "react";

import { NavLink } from "@remix-run/react";
import clsx from "clsx";

import { useClose } from "~/hooks/useClose";

import { Avatar } from "./Avatar";

export const AuthMenu = () => {
	const [isOpen, setIsOpen] = useState(false);

	const buttonRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	const { t } = useTranslation();

	useClose(buttonRef, menuRef, isOpen, setIsOpen);

	const itemClass =
		"px-2 py-1 text-sm bg-light dark:bg-dark hover:bg-secondary dark:hover:bg-primary transition-colors rounded";

	return (
		<div className="relative">
			<button
				ref={buttonRef}
				aria-expanded={isOpen}
				className="rounded-full"
				onClick={() => setIsOpen((prev) => !prev)}
			>
				<Avatar />
			</button>
			<div
				ref={menuRef}
				aria-hidden={!isOpen}
				className={clsx(
					"absolute top-10 right-0 mt-1 p-1 gap-1 rounded flex flex-col justify-end bg-light dark:bg-dark shadow-lg",
					isOpen ? "flex" : "hidden",
					// arrow
					"before:absolute before:-top-2 before:right-2 before:w-0 before:h-0 before:border-l-8 before:border-r-8 before:border-b-8 before:border-x-transparent before:border-b-light dark:before:border-b-dark"
				)}
			>
				<NavLink
					className={itemClass}
					tabIndex={isOpen ? 0 : -1}
					to="/settings"
				>
					{t("nav.authMenu.settings")}
				</NavLink>
				<NavLink className={itemClass} tabIndex={isOpen ? 0 : -1} to="/logout">
					{t("nav.authMenu.logout")}
				</NavLink>
			</div>
		</div>
	);
};
