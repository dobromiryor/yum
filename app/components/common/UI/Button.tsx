import clsx from "clsx";
import { type ButtonHTMLAttributes, type DetailedHTMLProps } from "react";

export type ButtonVariant =
	| "text"
	| "normal"
	| "inverted"
	| "primary"
	| "secondary"
	| "success"
	| "warning"
	| "danger";

type ButtonSize = "small" | "medium" | "large" | "smallSquare";

type ButtonRounded = "full" | "default";

interface ButtonProps
	extends DetailedHTMLProps<
		ButtonHTMLAttributes<HTMLButtonElement>,
		HTMLButtonElement
	> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	rounded?: ButtonRounded;
	isDisabled?: boolean;
	isLoading?: boolean;
}

export const Button = (props: ButtonProps) => {
	const {
		children,
		className,
		variant = "primary",
		size = "medium",
		type = "button",
		rounded = "default",
		isDisabled = false,
		isLoading = false,
		...rest
	} = props;

	const variantStyles = {
		text: "",
		normal: "bg-light dark:bg-dark",
		inverted: "bg-dark dark:bg-light text-light dark:text-dark",
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
		smallSquare:
			"text-xs aspect-square min-h-full flex-grow flex-shrink-0 basis-full",
	};

	const roundedStyles = {
		full: "p-1.5 rounded-full",
		default: "px-2 py-1 rounded",
	};

	return (
		<button
			className={clsx(
				variantStyles[variant],
				sizeStyles[size],
				roundedStyles[rounded],
				"flex justify-center items-center select-none transition-all outline-offset-[-1px]",
				"active:brightness-75",
				"hover:brightness-90",
				isDisabled
					? "opacity-50 pointer-events-none"
					: "opacity-100  pointer-events-auto",
				isLoading && "animate-pulse",
				className
			)}
			disabled={isLoading || isDisabled}
			type={type}
			{...rest}
		>
			{children}
		</button>
	);
};
