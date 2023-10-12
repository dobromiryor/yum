import { Reorder, useDragControls } from "framer-motion";
import {
	useEffect,
	useRef,
	type ReactNode,
	type TouchEventHandler,
} from "react";

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

	// TODO: Check if fixed
	// Inconsistent ordering behaviour with 10.16.4 - downgrade to 10.9.4
	// https://github.com/framer/motion/issues/2347
	// https://github.com/framer/motion/issues/2351

	// TODO: Check if fixed
	// Reorder touch trigger fix
	// https://github.com/framer/motion/issues/1597
	/* eslint-disable @typescript-eslint/ban-ts-comment */
	const iRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (isReordering) {
			const touchHandler: TouchEventHandler<HTMLElement> = (e) =>
				e.preventDefault();

			const iTag = iRef.current;

			if (iTag) {
				//@ts-ignore
				iTag.addEventListener("touchstart", touchHandler, {
					passive: false,
				});

				return () => {
					//@ts-ignore
					iTag.removeEventListener("touchstart", touchHandler, {
						passive: false,
					});
				};
			}
		}

		return;
	}, [iRef, isReordering]);
	/* eslint-enable @typescript-eslint/ban-ts-comment */
	/* ### */

	return (
		<Reorder.Item
			ref={iRef}
			dragControls={controls}
			dragListener={false}
			value={item}
		>
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
