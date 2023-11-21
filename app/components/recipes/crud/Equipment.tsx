import { type Equipment as EquipmentType, type Prisma } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import clsx from "clsx";
import { convertMany } from "convert";
import { useTranslation } from "react-i18next";

import { Figure } from "~/components/recipes/crud/Figure";
import { type loader as detailsLoader } from "~/routes/recipes.$recipeId._index";
import { type loader as crudLoader } from "~/routes/recipes.edit.$recipeId.$lang";
import { OptionalTranslatedContentSchema } from "~/schemas/common";
import { EditRecipeParamsSchema } from "~/schemas/params.schema";
import { UnitSystemSchema } from "~/schemas/unit.schema";

interface EquipmentProps {
	equipment: SerializeFrom<EquipmentType>;
	as?: "span" | "p";
}

interface EquipmentFigureProps {
	step: SerializeFrom<
		Prisma.StepGetPayload<{
			include: {
				equipment: true;
			};
		}>
	>;
}

interface DimensionProps {
	equipment: SerializeFrom<EquipmentType>;
	hasLabel?: boolean;
	shouldConvert?: boolean;
}

interface VolumeProps {
	equipment: SerializeFrom<EquipmentType>;
	hasLabel?: boolean;
	shouldConvert?: boolean;
}

export const Dimension = ({
	equipment,
	hasLabel = false,
	shouldConvert = false,
}: DimensionProps) => {
	const { authData } = useLoaderData<
		typeof crudLoader | typeof detailsLoader
	>();
	const { t } = useTranslation();

	const { autoConvert, prefersUnitSystem } = authData || {};

	const { length, width, height, dimensionUnit } = equipment;

	if (!length || !width || !dimensionUnit) {
		return null;
	}

	const tu = (unit: string) =>
		t(`recipe.units.${unit}` as unknown as TemplateStringsArray, { count: 0 });

	const unit = tu(dimensionUnit);

	let string = `${length} ${unit} × ${width} ${unit}${
		height ? ` × ${height} ${unit}` : ""
	}`;

	if (shouldConvert && autoConvert && prefersUnitSystem) {
		const parsedSystem = UnitSystemSchema.parse(
			prefersUnitSystem.toLowerCase()
		);
		const convertedLength = convertMany(`${length}${dimensionUnit}`).to(
			"best",
			parsedSystem
		);
		const convertedWidth = convertMany(`${width}${dimensionUnit}`).to(
			"best",
			parsedSystem
		);
		const convertedHeight = height
			? convertMany(`${height}${dimensionUnit}`).to("best", parsedSystem)
			: null;

		string = `${convertedLength.quantity.toFixed()} ${tu(
			convertedLength.unit
		)} × ${convertedWidth.quantity.toFixed()} ${tu(convertedWidth.unit)}${
			convertedHeight
				? ` × ${convertedHeight.quantity.toFixed()} ${tu(convertedHeight.unit)}`
				: ""
		}`;
	}

	return hasLabel ? (
		<Figure isInline label={t("recipe.field.dimensions")}>
			<span>{string}</span>
		</Figure>
	) : (
		<span>{string}</span>
	);
};

export const Volume = ({
	equipment,
	hasLabel = false,
	shouldConvert = false,
}: VolumeProps) => {
	const { authData } = useLoaderData<
		typeof crudLoader | typeof detailsLoader
	>();
	const { t } = useTranslation();

	const { autoConvert, prefersUnitSystem } = authData || {};

	const { volume, volumeUnit } = equipment;

	if (!volume || !volumeUnit) {
		return null;
	}

	const tu = (unit: string) =>
		t(`recipe.units.${unit}` as unknown as TemplateStringsArray, { count: 0 });

	let string = `${volume}	${tu(volumeUnit)}`;

	if (shouldConvert && autoConvert && prefersUnitSystem) {
		const parsedSystem = UnitSystemSchema.parse(
			prefersUnitSystem.toLowerCase()
		);
		const converted = convertMany(`${volume}${volumeUnit}`).to(
			"best",
			parsedSystem
		);

		string = `${converted.quantity.toFixed()}	${tu(converted.unit)}`;
	}

	return hasLabel ? (
		<Figure isInline label={t("recipe.field.volume")}>
			<span>{string}</span>
		</Figure>
	) : (
		<span>{string}</span>
	);
};

export const Equipment = ({ equipment, as = "span" }: EquipmentProps) => {
	const { t } = useTranslation();
	const params = useParams();

	const { lang } = EditRecipeParamsSchema.parse(params);
	const name = OptionalTranslatedContentSchema.parse(equipment.name);

	const ElementType = as as keyof JSX.IntrinsicElements;

	return (
		<ElementType>
			{name?.[lang] ?? t("error.translationMissing")}{" "}
			<Dimension equipment={equipment} />
			<Volume equipment={equipment} />
		</ElementType>
	);
};

export const EquipmentFigure = ({ step }: EquipmentFigureProps) => {
	const { t } = useTranslation();

	const { id, equipment } = step;

	if (equipment.length === 0) {
		return null;
	}

	return (
		<Figure
			isInline={equipment.length === 1}
			label={t("recipe.field.equipment")}
		>
			{equipment.length > 1 ? (
				<ul className={clsx(equipment.length > 1 && "list-disc list-inside")}>
					{equipment.map((item) => (
						<li key={`Step__${id}__Equipment__${item.id}`}>
							<Equipment equipment={item} />
						</li>
					))}
				</ul>
			) : (
				<Equipment equipment={equipment[0]} />
			)}
		</Figure>
	);
};
