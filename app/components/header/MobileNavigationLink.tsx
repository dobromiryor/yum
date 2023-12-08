import { NavLink, type NavLinkProps } from "@remix-run/react";
import { clsx } from "clsx";
import { type ReactNode } from "react";

import { type ButtonVariant } from "~/components/common/UI/Button";

interface NavigationLinkProps extends NavLinkProps {
	children: ReactNode;
	variant?: ButtonVariant;
	size?: "xl" | "4xl";
}

export const MobileNavigationLink = ({
	children,
	className,
	variant,
	size = "4xl",
	...rest
}: NavigationLinkProps) => {
	const sizeStyles = {
		xl: "text-xl",
		"4xl": "text-4xl",
	};

	return (
		<NavLink
			className={clsx("flex justify-stretch py-0.5", className)}
			{...rest}
		>
			{({ isPending }) => (
				<div
					className={clsx(
						"flex justify-center items-center gap-1 text-dark dark:text-light typography-bold",
						sizeStyles[size],
						isPending && "animate-pulse"
					)}
				>
					{children}
				</div>
			)}
		</NavLink>
	);
};
