import { Status, type Prisma } from "@prisma/client";

import { type Language } from "~/enums/language.enum";
import { prisma } from "~/utils/prisma.server";

interface RecipeDetailProps {
	recipeId: string;
	locale: Language;
}
interface RecipeOverviewProps {
	locale?: Language;
	userId?: string;
	status?: Status;
}

type RecipeWithSteps = Prisma.RecipeGetPayload<{
	include:
		| {
				user: true;
				steps: true;
				equipment: true;
				ingredients: true;
				subRecipes: true;
		  }
		| {
				steps: true;
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

export const recipesOverview = async ({
	locale,
	status = Status.PUBLISHED,
	userId,
}: RecipeOverviewProps) => {
	const foundRecipes = await prisma.recipe.findMany({
		where: {
			userId,
			status,
			...(locale && {
				languages: {
					has: locale,
				},
			}),
		},
		include: {
			steps: {
				orderBy: {
					position: "asc",
				},
			},
		},
	});

	return foundRecipes.map((recipe) => computeTimes({ recipe }));
};
