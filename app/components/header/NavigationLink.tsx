import { NavLink, type NavLinkProps } from "@remix-run/react";
import { clsx } from "clsx";
import { forwardRef, type ReactNode } from "react";

import {
	Button,
	type ButtonProps,
	type ButtonVariant,
} from "~/components/common/UI/Button";

interface NavigationLinkProps extends NavLinkProps {
	children: ReactNode;
	variant?: ButtonVariant;
	buttonClassName?: string;
	buttonProps?: Omit<ButtonProps, "ref">;
}

export const NavigationLink = forwardRef<
	HTMLAnchorElement,
	NavigationLinkProps
>(function NavigationLink(
	{ children, className, variant, buttonClassName, buttonProps, ...rest },
	ref
) {
	return (
		<NavLink
			ref={ref}
			className={clsx("flex justify-stretch", className)}
			tabIndex={-1}
			{...rest}
		>
			{({ isActive, isPending }) => (
				<Button
					{...buttonProps}
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
});
