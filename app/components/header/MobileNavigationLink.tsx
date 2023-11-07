import { NavLink, type NavLinkProps } from "@remix-run/react";
import { clsx } from "clsx";
import { type ReactNode } from "react";

import { type ButtonVariant } from "~/components/common/UI/Button";

interface NavigationLinkProps extends NavLinkProps {
	children: ReactNode;
	variant?: ButtonVariant;
	buttonClassName?: string;
}

export const MobileNavigationLink = ({
	children,
	className,
	variant,
	buttonClassName,
	...rest
}: NavigationLinkProps) => {
	return (
		<NavLink
			className={clsx("flex justify-stretch py-0.5", className)}
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
