import { type DragControls } from "framer-motion";
import { type ReactNode } from "react";

import { Button } from "~/components/common/UI/Button";
import { BasicCard } from "~/components/recipes/crud/BasicCard";

interface CardProps {
	buttons?: ReactNode;
	children?: ReactNode;
	controls?: DragControls;
	index?: number;
	isReordering?: boolean;
	title: ReactNode;
}

export const Card = ({
	buttons,
	children,
	controls,
	index,
	isReordering = false,
	title,
}: CardProps) => {
	return (
		<BasicCard>
			<div className="flex justify-between items-center">
				<p className="text-lg font-semibold truncate">
					{typeof index === "number" && <span>{`${index + 1}. `}</span>}
					<span>{title}</span>
				</p>
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
