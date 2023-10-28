import clsx from "clsx";
import { type ReactNode } from "react";

interface OverviewContainerProps {
	children: ReactNode;
}

export const OverviewContainer = ({ children }: OverviewContainerProps) => {
	return (
		<div
			className={clsx(
				"grid grid-cols-1 gap-4",
				"sm:grid-cols-2 lg:grid-cols-3"
			)}
		>
			{children}
		</div>
	);
};
