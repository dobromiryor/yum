import { type ReactNode } from "react";

export const EmptyCard = ({ children }: { children: ReactNode }) => {
	return (
		<div className="p-4 flex justify-center items-center border border-secondary dark:border-primary bg-light dark:bg-dark rounded">
			{children}
		</div>
	);
};
