import { Status } from "@prisma/client";
import { type z } from "zod";

import { LIMIT_FALLBACK, PAGE_FALLBACK } from "~/consts/pagination.const";
import { type Language } from "~/enums/language.enum";
import i18next from "~/modules/i18next.server";
import { LanguageSchema } from "~/schemas/common";
import { type PaginationSchema } from "~/schemas/pagination.schema";
import { type RecipeWithSteps } from "~/types/recipe.type";
import { caseInsensitiveJSONSearch } from "~/utils/helpers/case-insensitive-json-search.server";
import { isPageGreaterThanPageCount } from "~/utils/helpers/set-pagination.server";
import { prisma } from "~/utils/prisma.server";

interface RecipeDetailProps {
	recipeId: string;
	locale: Language;
}

interface RecipeOverviewProps {
	userId?: string;
	status?: Status;
	pagination?: z.infer<typeof PaginationSchema>;
	request: Request;
	unlockLocale?: boolean;
}

interface UnpublishedRecipesCountProps {
	userId: string;
}

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

export const publishValidation = async (recipeId: string) => {
	const foundRecipe = await prisma.recipe.findUnique({
		where: { id: recipeId },
		include: { steps: true, ingredients: true },
	});

	if (!foundRecipe) {
		return false;
	}

	const {
		name,
		description,
		difficulty,
		servings,
		ingredients,
		steps,
		languages,
	} = foundRecipe;

	if (
		!name ||
		!description ||
		!difficulty ||
		!servings ||
		!ingredients.length ||
		!steps.length ||
		!languages.length
	) {
		return false;
	}

	return true;
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
	status = Status.PUBLISHED,
	userId,
	pagination = { page: PAGE_FALLBACK, limit: LIMIT_FALLBACK },
	request,
	unlockLocale = false,
}: RecipeOverviewProps) => {
	const locale = LanguageSchema.parse(await i18next.getLocale(request.clone()));

	const { searchParams } = new URL(request.clone().url);

	const searchQuery = () => {
		if (searchParams.has("q")) {
			const searchQuery = searchParams.get("q");

			if (!searchQuery?.trim().length) {
				searchParams.delete("q");

				return;
			}

			return searchQuery.trim();
		}

		return;
	};

	const where = {
		AND: [
			{
				status,
			},
			{
				...(!unlockLocale &&
					locale && {
						languages: {
							has: locale,
						},
					}),
			},
			{
				userId,
			},
			{
				...(searchQuery() && {
					OR: [
						...caseInsensitiveJSONSearch("name", locale, searchQuery()!),
						...caseInsensitiveJSONSearch("description", locale, searchQuery()!),
						...caseInsensitiveJSONSearch(
							"name",
							locale,
							searchQuery()!,
							"ingredients"
						),
					],
				}),
			},
		],
	};

	const count = await prisma.recipe.count({ where });

	if (count <= 0) {
		return {
			items: [],
			pagination: { page: PAGE_FALLBACK, limit: LIMIT_FALLBACK, count: 0 },
		};
	}

	const { page, limit } = await isPageGreaterThanPageCount(
		pagination,
		count,
		request
	);

	const foundRecipes = await prisma.recipe.findMany({
		where,
		include: {
			...(searchQuery() && { ingredients: true }),
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

export const unpublishedRecipesCount = async ({
	userId,
}: UnpublishedRecipesCountProps) => {
	return await prisma.recipe.count({
		where: {
			status: Status.UNPUBLISHED,
			userId,
		},
	});
};
