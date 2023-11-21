import { Link, type Path } from "@remix-run/react";
import clsx from "clsx";
import { type ReactNode } from "react";

interface EmptyCardProps {
	children: ReactNode;
	to: string | Partial<Path>;
	className?: string;
}

export const EmptyCard = ({ children, to, className }: EmptyCardProps) => {
	return (
		<Link
			className={clsx(
				"p-4 flex flex-col justify-center items-center gap-2 border border-secondary dark:border-primary bg-light dark:bg-dark rounded",
				className
			)}
			to={to}
		>
			{children}
		</Link>
	);
};
