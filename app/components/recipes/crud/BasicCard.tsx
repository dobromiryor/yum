import clsx from "clsx";
import { type ReactNode } from "react";

interface BasicCardProps {
	children: ReactNode;
	className?: string;
}

export const BasicCard = ({ children, className }: BasicCardProps) => (
	<div
		className={clsx(
			"flex flex-col gap-2 p-4 border border-secondary dark:border-primary rounded shadow-none transition-all group group-active:shadow-lg",
			"bg-light dark:bg-dark",
			className
		)}
	>
		{children}
	</div>
);
