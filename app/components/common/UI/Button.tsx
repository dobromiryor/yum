import clsx from "clsx";
import {
	forwardRef,
	type ButtonHTMLAttributes,
	type DetailedHTMLProps,
} from "react";

export type ButtonVariant =
	| "text"
	| "normal"
	| "inverted"
	| "primary"
	| "secondary"
	| "success"
	| "warning"
	| "danger";

type ButtonSize = "small" | "medium" | "large" | "smallSquare" | "mediumSquare";

type ButtonRounded = "full" | "default" | "large";

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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	function Button(props, ref) {
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
			normal: "bg-light dark:bg-dark text-dark dark:text-light",
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
			smallSquare: "text-xs aspect-square flex-shrink-0",
			mediumSquare: "text-base aspect-square flex-shrink-0",
		};

		const roundedStyles = {
			full: "p-1.5 rounded-full",
			default: "px-2 py-1 rounded",
			large: "px-2 py-1 rounded-lg",
		};

		return (
			<button
				ref={ref}
				className={clsx(
					variantStyles[variant],
					sizeStyles[size],
					roundedStyles[rounded],
					"flex justify-center items-center select-none transition-all",
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
	}
);
