import { Status, type Prisma } from "@prisma/client";
import { type z } from "zod";

import { LIMIT_FALLBACK, PAGE_FALLBACK } from "~/consts/pagination.const";
import { type Language } from "~/enums/language.enum";
import { type PaginationSchema } from "~/schemas/pagination.schema";
import { isPageGreaterThanPageCount } from "~/utils/helpers/set-pagination.server";
import { prisma } from "~/utils/prisma.server";

interface RecipeDetailProps {
	recipeId: string;
	locale: Language;
}
interface RecipeOverviewProps {
	locale?: Language;
	userId?: string;
	status?: Status;
	pagination?: z.infer<typeof PaginationSchema>;
	request: Request;
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
	// TODO: set fallback for status to Status.PUBLISHED
	status,
	userId,
	pagination = { page: PAGE_FALLBACK, limit: LIMIT_FALLBACK },
	request,
}: RecipeOverviewProps) => {
	const where = {
		userId,
		status,
		...(locale && {
			languages: {
				has: locale,
			},
		}),
	};

	const count = await prisma.recipe.count({ where });

	const { page, limit } = await isPageGreaterThanPageCount(
		pagination,
		count,
		request
	);

	const foundRecipes = await prisma.recipe.findMany({
		where,
		include: {
			steps: {
				orderBy: {
					position: "asc",
				},
			},
		},
		skip: (page - 1) * limit,
		take: limit,
	});

	return {
		items: foundRecipes.map((recipe) => computeTimes({ recipe })),
		pagination: {
			page,
			limit,
			count,
		},
	};
};
