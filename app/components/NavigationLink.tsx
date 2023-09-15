import { NavLink, type NavLinkProps } from "@remix-run/react";
import { clsx } from "clsx";
import { type ReactNode } from "react";

interface NavigationLinkProps extends NavLinkProps {
	children: ReactNode;
}

export const NavigationLink = ({
	children,
	className,
	...rest
}: NavigationLinkProps) => {
	return (
		<NavLink
			end
			className={({ isActive, isPending }) =>
				clsx(
					"px-2 py-1 bg-light/0 dark:bg-dark/0 hover:bg-secondary dark:hover:bg-primary rounded transition-colors",
					isPending ? "" : isActive ? "bg-secondary/50 dark:bg-primary/50" : "",
					className
				)
			}
			{...rest}
		>
			{children}
		</NavLink>
	);
};
