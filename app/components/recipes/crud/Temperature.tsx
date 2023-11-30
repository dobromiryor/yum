import { type Step } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { convertMany } from "convert";
import { useTranslation } from "react-i18next";

import { Figure } from "~/components/recipes/crud/Figure";
import { type loader as detailsLoader } from "~/routes/recipes.$recipeId._index";
import { type loader as crudLoader } from "~/routes/recipes.edit.$recipeId.$lang";

interface TemperatureProps {
	shouldConvert?: boolean;
	as?: "span" | "p" | "";
	step: Partial<SerializeFrom<Step>>;
}

interface TemperatureFigureProps {
	step: SerializeFrom<Step>;
}

export const Temperature = ({
	step,
	as = "span",
	shouldConvert = false,
}: TemperatureProps) => {
	const { authData } = useLoaderData<
		typeof crudLoader | typeof detailsLoader
	>();

	const { autoConvert, prefersTemperatureScale } = authData || {};

	const { temperature, temperatureScale } = step;

	if (!temperature || !temperatureScale) {
		return null;
	}

	let string = `${temperature} °${temperatureScale}`;

	if (shouldConvert && autoConvert && prefersTemperatureScale) {
		const converted = convertMany(`${temperature}${temperatureScale}`).to(
			prefersTemperatureScale
		);
		const convertedTemperature = Math.floor(converted / 10) * 10;

		string = `${convertedTemperature} °${prefersTemperatureScale}`;
	}

	const ElementType = as as keyof JSX.IntrinsicElements;

	return as === "" ? string : <ElementType>{string}</ElementType>;
};

export const TemperatureFigure = ({ step }: TemperatureFigureProps) => {
	const { t } = useTranslation();
	const { temperature, temperatureScale } = step;

	if (!temperature || !temperatureScale) {
		return null;
	}

	return (
		<Figure isInline label={t("recipe.field.temperature")}>
			<Temperature step={step} />
		</Figure>
	);
};
