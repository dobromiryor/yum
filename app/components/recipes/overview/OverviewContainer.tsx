import { useNavigation } from "@remix-run/react";
import clsx from "clsx";
import { type ReactNode } from "react";

interface OverviewContainerProps {
	children: ReactNode;
}

export const OverviewContainer = ({ children }: OverviewContainerProps) => {
	const { state } = useNavigation();

	return (
		<div
			className={clsx(
				"grid grid-cols-1 gap-4",
				"sm:grid-cols-2 lg:grid-cols-3",
				state !== "idle" && "animate-pulse"
			)}
		>
			{children}
		</div>
	);
};
