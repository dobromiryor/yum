import { NavLink, type NavLinkProps } from "@remix-run/react";
import { clsx } from "clsx";
import { type Dispatch, type ReactNode, type SetStateAction } from "react";

import { type ButtonVariant } from "~/components/common/UI/Button";

interface NavigationLinkProps extends NavLinkProps {
	children: ReactNode;
	variant?: ButtonVariant;
	buttonClassName?: string;
	closeMenu?: Dispatch<SetStateAction<boolean>>;
}

export const MobileNavigationLink = ({
	children,
	className,
	variant,
	buttonClassName,
	closeMenu,
	...rest
}: NavigationLinkProps) => {
	return (
		<NavLink
			className={clsx("flex justify-stretch", className)}
			tabIndex={-1}
			onClick={() => closeMenu?.((prev) => !prev)}
			{...rest}
		>
			{({ isPending }) => (
				<span
					className={clsx(
						"text-dark dark:text-light text-4xl typography-bold",
						isPending && "animate-pulse"
					)}
				>
					{children}
				</span>
			)}
		</NavLink>
	);
};
