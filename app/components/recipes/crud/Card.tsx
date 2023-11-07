import clsx from "clsx";
import { type DragControls } from "framer-motion";
import { type ReactNode } from "react";

import { ErrorCount } from "~/components/common/ErrorCount";
import { Button } from "~/components/common/UI/Button";
import { BasicCard } from "~/components/recipes/crud/BasicCard";

interface CardProps {
	buttons?: ReactNode;
	children?: ReactNode;
	controls?: DragControls;
	index?: number;
	isReordering?: boolean;
	title: ReactNode;
	errorCount?: number;
}

export const Card = ({
	buttons,
	children,
	controls,
	index,
	isReordering = false,
	title,
	errorCount,
}: CardProps) => {
	return (
		<BasicCard>
			<div className="flex justify-between items-center gap-2">
				<div className={clsx("flex items-center gap-2", "truncate")}>
					<p className="text-lg typography-semibold truncate">
						{typeof index === "number" && <span>{`${index + 1}. `}</span>}
						<span>{title}</span>
					</p>
					<ErrorCount errorCount={errorCount} />
				</div>
				<div className="flex gap-2 items-center">
					{isReordering ? (
						<Button
							// TODO: accessibility
							className="hover:cursor-grab active:cursor-grabbing"
							size="small"
							onPointerDown={(e) => controls && controls.start(e)}
						>
							{/* TODO: Bug on Chrome mobile */}
							<span aria-hidden="true">&#8942;&#8942;</span>
						</Button>
					) : (
						buttons && buttons
					)}
				</div>
			</div>
			{children && children}
		</BasicCard>
	);
};
