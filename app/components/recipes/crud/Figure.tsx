import clsx from "clsx";
import {
	type DetailedHTMLProps,
	type HTMLAttributes,
	type ReactNode,
} from "react";

interface FigureProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
	children: ReactNode;
	isInline?: boolean;
	label: string;
	labelProps?: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
}

export const Figure = ({
	children,
	isInline = false,
	label,
	labelProps = {},
	...props
}: FigureProps) => {
	const { className, ...rest } = labelProps;

	return (
		<figure {...props}>
			<figcaption
				className={clsx("typography-medium", isInline && "inline", className)}
				{...rest}
			>
				{`${label}: `}
			</figcaption>
			{children}
		</figure>
	);
};
