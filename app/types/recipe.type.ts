import { type Prisma } from "@prisma/client";

export type RecipeWithSteps = Prisma.RecipeGetPayload<{
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
