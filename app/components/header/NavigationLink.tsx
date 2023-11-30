import { NavLink, type NavLinkProps } from "@remix-run/react";
import { clsx } from "clsx";
import { type ReactNode } from "react";

import { Button, type ButtonVariant } from "~/components/common/UI/Button";

interface NavigationLinkProps extends NavLinkProps {
	children: ReactNode;
	variant?: ButtonVariant;
	buttonClassName?: string;
}

export const NavigationLink = ({
	children,
	className,
	variant,
	buttonClassName,
	...rest
}: NavigationLinkProps) => {
	return (
		<NavLink
			className={clsx("flex justify-stretch", className)}
			tabIndex={-1}
			{...rest}
		>
			{({ isActive, isPending }) => (
				<Button
					className={clsx(
						"typography-bold",
						isPending && "animate-pulse",
						buttonClassName
					)}
					rounded="large"
					variant={isActive ? "normal" : variant ? variant : "text"}
				>
					{children}
				</Button>
			)}
		</NavLink>
	);
};
