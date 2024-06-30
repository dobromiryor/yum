import { useMemo } from "react";

import { Icon } from "~/components/common/UI/Icon";

const ICON_ARR = [
	"restaurant",
	"lunch_dining",
	"cake",
	"fastfood",
	"local_pizza",
	"bakery_dining",
	"ramen_dining",
	"icecream",
	"dinner_dining",
	"egg_alt",
	"set_meal",
	"breakfast_dining",
	"kebab_dining",
];

export const ImageFallback = () => {
	const randomIcon = useMemo(
		() => ICON_ARR[Math.floor(Math.random() * ICON_ARR.length)],
		[]
	);

	return (
		<div className="flex justify-center items-center w-full h-full">
			<Icon
				className="text-secondary dark:text-primary"
				fallbackClassName="bg-secondary dark:bg-primary"
				name={randomIcon}
				size="48"
			/>
		</div>
	);
};
