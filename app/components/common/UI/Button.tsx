import clsx from "clsx";
import { type ButtonHTMLAttributes, type DetailedHTMLProps } from "react";

export type ButtonVariant =
	| "text"
	| "primary"
	| "secondary"
	| "success"
	| "warning"
	| "danger";

export type ButtonSize = "small" | "medium" | "large";

interface ButtonProps
	extends DetailedHTMLProps<
		ButtonHTMLAttributes<HTMLButtonElement>,
		HTMLButtonElement
	> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	isDisabled?: boolean;
}

export const Button = (props: ButtonProps) => {
	const {
		children,
		className,
		variant = "primary",
		size = "medium",
		type = "button",
		isDisabled = false,
		...rest
	} = props;

	const variantStyles = {
		text: "",
		primary: "bg-secondary dark:bg-primary",
		secondary: "bg-primary dark:bg-secondary text-light dark:text-dark",
		danger: "bg-red-700 text-light",
		warning: "bg-yellow-600 text-light",
		success: "bg-green-700 text-light",
	};

	const sizeStyles = {
		small: "text-xs",
		medium: "text-base",
		large: "text-lg",
	};

	return (
		<button
			className={clsx(
				`${variantStyles[variant]}`,
				`${sizeStyles[size]}`,
				"px-2 py-1 rounded select-none transition-all outline-offset-[-1px]",
				"active:brightness-75",
				"hover:brightness-90",
				isDisabled
					? "opacity-50 pointer-events-none"
					: "opacity-100  pointer-events-auto",
				className
			)}
			disabled={isDisabled}
			type={type}
			{...rest}
		>
			{children}
		</button>
	);
};
