import { type Prisma, type SubRecipe as SubRecipeType } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";
import { useParams } from "@remix-run/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { Figure } from "~/components/recipes/crud/Figure";
import { OptionalTranslatedContentSchema } from "~/schemas/common";
import { EditRecipeWithLangParamsSchema } from "~/schemas/params.schema";

interface SubRecipeProps {
	subRecipe: SerializeFrom<SubRecipeType>;
	as?: "span" | "p";
}

interface SubRecipeFigureProps {
	step: SerializeFrom<
		Prisma.StepGetPayload<{
			include: {
				subRecipes: true;
			};
		}>
	>;
}

export const SubRecipe = ({ subRecipe, as = "span" }: SubRecipeProps) => {
	const { t } = useTranslation();
	const params = useParams();

	const { lang } = EditRecipeWithLangParamsSchema.parse(params);

	const name = OptionalTranslatedContentSchema.parse(subRecipe.name);

	const ElementType = as as keyof JSX.IntrinsicElements;

	return (
		<ElementType>
			{name?.[lang] ?? `[ ${t("error.translationMissing")} ]`}
		</ElementType>
	);
};

export const SubRecipesFigure = ({ step }: SubRecipeFigureProps) => {
	const { t } = useTranslation();

	const { id, subRecipes, subRecipeAction } = step;

	if (subRecipes.length === 0 || !subRecipeAction) {
		return null;
	}

	return (
		<Figure
			isInline={subRecipes.length === 1}
			label={t(`recipe.subRecipeAction.${subRecipeAction}`)}
		>
			{subRecipes.length > 1 ? (
				<ul className={clsx(subRecipes.length > 1 && "list-disc list-inside")}>
					{subRecipes.map((item) => (
						<li key={`Step__${id}__Sub__Recipe__${item.id}`}>
							<SubRecipe subRecipe={item} />
						</li>
					))}
				</ul>
			) : (
				<SubRecipe subRecipe={subRecipes[0]} />
			)}
		</Figure>
	);
};
