import {
	Prisma,
	Unit,
	type Ingredient as IngredientType,
} from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { convertMany } from "convert";
import Fraction from "fraction.js";
import { useTranslation } from "react-i18next";

import { type loader } from "~/routes/recipes.$recipeId._index";
import {
	OptionalTranslatedContentSchema,
	TranslatedContentSchema,
} from "~/schemas/common";
import { UnitSchema, UnitSystemSchema } from "~/schemas/unit.schema";

interface IngredientProps {
	ingredient: SerializeFrom<IngredientType>;
	servings: number;
	servingsCount: number;
}

interface IngredientListProps {
	keyPrefix?: string;
	ingredients: SerializeFrom<IngredientType>[];
	servings: number;
	servingsCount: number;
}

interface IngredientCardProps extends IngredientListProps {
	title?: string | null;
}

export const Ingredient = ({
	ingredient,
	servings,
	servingsCount,
}: IngredientProps) => {
	const { authData, locale } = useLoaderData<typeof loader>();
	const { t } = useTranslation();

	const { autoConvert, prefersUnitSystem } = authData || {};

	const { name: na, note: no, quantity, unit } = ingredient;

	const name = TranslatedContentSchema.parse(na);
	const note = OptionalTranslatedContentSchema.parse(no);

	let string = name[locale];

	if (quantity) {
		const calculatedQuantity =
			(new Prisma.Decimal(quantity).toNumber() / servings ?? 1) *
				servingsCount ?? 1;

		if (quantity && !unit) {
			string = `${calculatedQuantity} ${string}`;
		}

		if (unit && unit !== Unit.to_taste) {
			if (prefersUnitSystem && autoConvert) {
				const parsedUnit = UnitSchema.parse(unit);
				const parsedSystem = UnitSystemSchema.parse(
					prefersUnitSystem.toLowerCase()
				);

				const converted = convertMany(`${calculatedQuantity}${parsedUnit}`).to(
					"best",
					parsedSystem
				);
				const convertedQuantity =
					parsedSystem === "imperial"
						? new Fraction(converted.quantity).simplify(0.1).toFraction(true)
						: converted.quantity.toFixed();

				string = `${convertedQuantity} ${t(
					`recipe.units.${converted.unit.replace(
						" ",
						"_"
					)}` as unknown as TemplateStringsArray,
					{
						count: Number(quantity),
					}
				)} ${string}`;
			} else {
				string = `${calculatedQuantity} ${t(`recipe.units.${unit}`, {
					count: Number(calculatedQuantity),
				})} ${string}`;
			}
		}
	}

	if (!quantity && unit === Unit.to_taste) {
		string = `${string} ${t("recipe.units.to_taste")}`;
	}

	return (
		<li>
			<span className="typography-medium">{string}</span>
			{note?.[locale] && <span> ({note?.[locale]})</span>}
		</li>
	);
};

export const IngredientList = ({
	ingredients,
	keyPrefix,
	servings,
	servingsCount,
}: IngredientListProps) => {
	return (
		<ul>
			{ingredients.map((ingredient, index) => {
				return (
					<Ingredient
						key={`${keyPrefix ? `${keyPrefix}__` : ""}Ingredient__${
							ingredient.id
						}__${index}`}
						ingredient={ingredient}
						servings={servings}
						servingsCount={servingsCount}
					/>
				);
			})}
		</ul>
	);
};

export const IngredientCard = ({
	keyPrefix,
	title,
	ingredients,
	servings,
	servingsCount,
}: IngredientCardProps) => {
	return (
		<div className="flex flex-col gap-1 p-3 bg-secondary dark:bg-primary rounded-2xl shadow-lg transition-colors">
			{title && <h3 className="text-lg typography-medium">{title}</h3>}
			<IngredientList
				ingredients={ingredients}
				keyPrefix={keyPrefix}
				servings={servings}
				servingsCount={servingsCount}
			/>
		</div>
	);
};
