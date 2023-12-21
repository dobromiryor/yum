import { motion } from "framer-motion";
import { type SVGProps } from "react";

interface StarProps {
	title?: string;
	titleId?: string;
	value: number;
	currentValue: number;
}

export const Star = ({
	currentValue,
	value,
	...props
}: SVGProps<SVGSVGElement> & StarProps) => {
	const hasValue = currentValue > 0;
	const isFull = hasValue && value <= currentValue;
	const isPartial =
		hasValue && value === Math.round(currentValue) && value > currentValue;
	const fillPercent = isFull ? 1 : isPartial ? value - currentValue : 0;

	return (
		<svg
			fill="none"
			height={24}
			viewBox="0 -960 960 960"
			width={24}
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path
				className="fill-light dark:fill-dark"
				d="M480-229 314-129q-11 7-23 6t-21-8q-9-7-14-17.5t-2-23.5l44-189-147-127q-10-9-12.5-20.5T140-531q4-11 12-18t22-9l194-17 75-178q5-12 15.5-18t21.5-6q11 0 21.5 6t15.5 18l75 178 194 17q14 2 22 9t12 18q4 11 1.5 22.5T809-488L662-361l44 189q3 13-2 23.5T690-131q-9 7-21 8t-23-6L480-229Z"
				id="star"
				transform="translate(0 -32)"
				vectorEffect="non-scaling-stroke"
			/>
			<clipPath id="star-clip">
				<use href="#star" />
			</clipPath>
			<motion.rect
				animate={{ attrX: -960 + 960 * fillPercent }}
				className="fill-primary dark:fill-secondary"
				clipPath="url('#star-clip')"
				height={960}
				width={960}
				x={0}
				y={-960}
			/>
		</svg>
	);
};
