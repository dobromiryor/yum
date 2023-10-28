import { Status, type Prisma } from "@prisma/client";

import { type Language } from "~/enums/language.enum";
import { prisma } from "~/utils/prisma.server";

interface RecipeDetailProps {
	recipeId: string;
	locale: Language;
}

type RecipeWithSteps = Prisma.RecipeGetPayload<{
	include: {
		user: true;
		steps: true;
		equipment: true;
		ingredients: true;
		subRecipes: true;
	};
}>;
interface ComputeTimesProps<T> {
	recipe: T;
}

const computeTimes = <T extends RecipeWithSteps>({
	recipe,
}: ComputeTimesProps<T>) => {
	const { steps } = recipe;

	const prepTime = steps.reduce((prev, curr) => {
		if (curr.prepTime) {
			return curr.prepTime + prev;
		} else {
			return 0 + prev;
		}
	}, 0);
	const cookTime = steps.reduce((prev, curr) => {
		if (curr.cookTime) {
			return curr.cookTime + prev;
		} else {
			return 0 + prev;
		}
	}, 0);
	const bakeTime = steps.reduce((prev, curr) => {
		if (curr.bakeTime) {
			return curr.bakeTime + prev;
		} else {
			return 0 + prev;
		}
	}, 0);
	const restTime = steps.reduce((prev, curr) => {
		if (curr.restTime) {
			return curr.restTime + prev;
		} else {
			return 0 + prev;
		}
	}, 0);
	const totalTime = prepTime + cookTime + bakeTime + restTime;

	return {
		...recipe,
		totalTime,
		prepTime,
		cookTime,
		bakeTime,
		restTime,
	};
};

export const recipeDetails = async ({
	recipeId,
	locale,
}: RecipeDetailProps) => {
	const foundRecipe = await prisma.recipe.findFirst({
		where: {
			id: recipeId,
			status: Status.PUBLISHED,
			languages: {
				has: locale,
			},
		},
		include: {
			user: true,
			ingredients: {
				where: {
					subRecipe: null,
				},
				orderBy: {
					position: "asc",
				},
			},
			subRecipes: {
				orderBy: {
					position: "asc",
				},
				include: {
					ingredients: {
						orderBy: {
							position: "asc",
						},
					},
				},
			},
			equipment: {
				orderBy: {
					position: "asc",
				},
			},
			steps: {
				orderBy: {
					position: "asc",
				},
				include: {
					ingredients: {
						orderBy: {
							position: "asc",
						},
					},
					equipment: {
						orderBy: {
							position: "asc",
						},
					},
					subRecipes: {
						orderBy: {
							position: "asc",
						},
					},
				},
			},
		},
	});

	if (!foundRecipe) {
		return null;
	}

	return computeTimes({ recipe: foundRecipe });
};

export const recipeOverview = () => {
	/* TODO */
};
