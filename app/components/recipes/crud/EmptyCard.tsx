import { Link, type Path } from "@remix-run/react";
import { type ReactNode } from "react";

interface EmptyCardProps {
	children: ReactNode;
	to: string | Partial<Path>;
}

export const EmptyCard = ({ children, to }: EmptyCardProps) => {
	return (
		<Link
			className="p-4 flex flex-col justify-center items-center gap-2 border border-secondary dark:border-primary bg-light dark:bg-dark rounded"
			to={to}
		>
			{children}
		</Link>
	);
};
