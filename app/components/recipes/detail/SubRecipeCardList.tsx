import { type Prisma } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { IngredientCard } from "~/components/recipes/detail/Ingredient";
import { type loader } from "~/routes/recipes.$recipeId._index";
import { TranslatedContentSchema } from "~/schemas/common";

interface SubRecipeCardListProps {
	subRecipes: SerializeFrom<
		Prisma.SubRecipeGetPayload<{
			include: {
				ingredients: true;
			};
		}>
	>[];
	servings: number;
	servingsCount: number;
}

export const SubRecipeCardList = ({
	subRecipes,
	servings,
	servingsCount,
}: SubRecipeCardListProps) => {
	const { locale } = useLoaderData<typeof loader>();

	if (!subRecipes.length) {
		return null;
	}

	return (
		<>
			{subRecipes.map((subRecipe, index) => {
				const { id, name: n, ingredients } = subRecipe;

				const name = TranslatedContentSchema.parse(n);

				return (
					<IngredientCard
						key={`Sub__Recipe__${id}__${index}`}
						ingredients={ingredients}
						keyPrefix={`Sub__Recipe__${id}__${index}`}
						servings={servings}
						servingsCount={servingsCount}
						title={name[locale]}
					/>
				);
			})}
		</>
	);
};
