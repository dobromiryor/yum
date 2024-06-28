import { Reorder, useDragControls } from "framer-motion";
import { type ReactNode } from "react";

import { Card } from "~/components/recipes/crud/Card";

interface CardProps<T> {
	buttons?: ReactNode;
	children: ReactNode;
	index?: number;
	isReordering?: boolean;
	item: T;
	title: ReactNode;
}

export const ReorderCard = <T extends object>({
	buttons,
	children,
	index,
	isReordering = false,
	item,
	title,
}: CardProps<T>) => {
	const controls = useDragControls();

	return (
		<Reorder.Item dragControls={controls} dragListener={false} value={item}>
			<Card
				buttons={buttons}
				controls={controls}
				index={index}
				isReordering={isReordering}
				title={title}
			>
				{children}
			</Card>
		</Reorder.Item>
	);
};
