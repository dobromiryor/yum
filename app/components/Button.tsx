import clsx from "clsx";
import { type ButtonHTMLAttributes, type DetailedHTMLProps } from "react";

interface ButtonProps
	extends DetailedHTMLProps<
		ButtonHTMLAttributes<HTMLButtonElement>,
		HTMLButtonElement
	> {
	variant?: "primary" | "secondary" | "danger";
	size?: "small" | "medium" | "large";
}

export const Button = (props: ButtonProps) => {
	const { children, variant = "primary", size = "medium", ...rest } = props;

	return (
		<button className={clsx(``)} {...rest}>
			{children}
		</button>
	);
};
