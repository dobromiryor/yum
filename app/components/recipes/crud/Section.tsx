import clsx from "clsx";
import {
	type DetailedHTMLProps,
	type HTMLAttributes,
	type ReactNode,
} from "react";

import { ErrorCount } from "~/components/common/ErrorCount";

interface SectionProps
	extends DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> {
	buttons?: ReactNode;
	children: ReactNode;
	title: string;
	errorCount?: number | null | undefined;
	isRequired?: boolean;
}

export const Section = ({
	buttons,
	children,
	title,
	className,
	errorCount,
	isRequired = false,
	...rest
}: SectionProps) => {
	return (
		<section
			className={clsx("flex-1 flex flex-col gap-4", className)}
			{...rest}
		>
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-2">
					<p className="flex items-center gap-2 text-2xl typography-bold">
						{title}
						{isRequired && (
							<span className="typography-normal text-red-500">{" *"}</span>
						)}
					</p>
					<ErrorCount errorCount={errorCount} />
				</div>
				<div className="flex gap-2">{buttons && buttons}</div>
			</div>
			{children}
		</section>
	);
};
