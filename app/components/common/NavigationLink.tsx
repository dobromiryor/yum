import { NavLink, type NavLinkProps } from "@remix-run/react";
import { clsx } from "clsx";
import { type ReactNode } from "react";

import { Button } from "~/components/common/UI/Button";

interface NavigationLinkProps extends NavLinkProps {
	children: ReactNode;
}

export const NavigationLink = ({
	children,
	className,
	...rest
}: NavigationLinkProps) => {
	return (
		<NavLink {...rest}>
			{({ isActive, isPending }) => (
				<Button
					className={clsx("font-medium", isPending && "animate-pulse")}
					tabIndex={-1}
					variant={isActive ? "primary" : "text"}
				>
					{children}
				</Button>
			)}
		</NavLink>
	);
};
