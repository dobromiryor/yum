import { type Ingredient as IngredientType, type Prisma } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";
import { useParams } from "@remix-run/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { Figure } from "~/components/recipes/crud/Figure";
import { LanguageSchema, TranslatedContentSchema } from "~/schemas/common";

interface IngredientProps {
	ingredient: SerializeFrom<IngredientType>;
	as?: "span" | "p" | "";
}

interface IngredientFigureProps {
	step: SerializeFrom<
		Prisma.StepGetPayload<{
			include: {
				ingredients: true;
			};
		}>
	>;
}

export const Ingredient = ({ ingredient, as = "span" }: IngredientProps) => {
	const {
		t,
		i18n: { language: la },
	} = useTranslation();

	const params = useParams();
	const { lang: l } = params;

	const lang = LanguageSchema.optional().nullable().parse(l);
	const language = LanguageSchema.parse(la);

	const { name: n, unit, quantity } = ingredient;

	const name = TranslatedContentSchema.parse(n);

	let string = name?.[lang ?? language];

	if (!string) {
		string = `[ ${t("error.translationMissing")} ]`;
	}

	if (quantity && unit) {
		string = `${quantity} ${unit.replace("_", " ")} ${string}`;
	}

	if (quantity && !unit) {
		string = `${quantity} ${string}`;
	}

	if (!quantity && unit === "to_taste") {
		string = `${string} ${unit.replace("_", " ")}`;
	}

	const ElementType = as as keyof JSX.IntrinsicElements;

	return as === "" ? <>{string}</> : <ElementType>{string}</ElementType>;
};

export const IngredientsFigure = ({ step }: IngredientFigureProps) => {
	const { t } = useTranslation();
	const { id, ingredients } = step;

	if (ingredients.length === 0) {
		return null;
	}

	return (
		<Figure
			isInline={ingredients.length === 1}
			label={t("recipe.field.ingredients")}
		>
			{ingredients.length > 1 ? (
				<ul className={clsx(ingredients.length > 1 && "list-disc list-inside")}>
					{ingredients.map((item) => (
						<li key={`Step__${id}Ingredient__${item.id}`}>
							<Ingredient ingredient={item} />
						</li>
					))}
				</ul>
			) : (
				<Ingredient ingredient={ingredients[0]} />
			)}
		</Figure>
	);
};
