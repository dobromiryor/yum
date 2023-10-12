import clsx from "clsx";
import {
	type DetailedHTMLProps,
	type HTMLAttributes,
	type ReactNode,
} from "react";

import { ErrorCount } from "~/components/recipes/crud/ErrorCount";

interface SectionProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
	buttons?: ReactNode;
	children: ReactNode;
	title: string;
	errorCount?: number | null | undefined;
}

export const Section = ({
	buttons,
	children,
	title,
	className,
	errorCount,
	...rest
}: SectionProps) => {
	return (
		<section
			className={clsx("flex-1 flex flex-col gap-4", className)}
			{...rest}
		>
			<div className="flex justify-between items-center">
				<p className="flex items-center gap-2 text-xl font-bold">
					<ErrorCount errorCount={errorCount} />
					{title}
				</p>
				<div className="flex gap-2">{buttons && buttons}</div>
			</div>
			{children}
		</section>
	);
};
