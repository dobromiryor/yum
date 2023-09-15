import clsx from "clsx";
import {
	type DetailedHTMLProps,
	type HTMLAttributes,
	type ReactNode,
} from "react";

interface LayoutProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
	children: ReactNode;
}

export const Layout = ({ children, className, ...rest }: LayoutProps) => (
	<div className={clsx("m-4 flex flex-col", className)} {...rest}>
		{children}
	</div>
);
