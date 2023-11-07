import { type Language } from "~/enums/language.enum";

export const caseInsensitiveJSONSearch = (
	fieldKey: string,
	locale: Language,
	searchQuery: string,
	modelKey?: string
) => {
	/* TODO: Prisma doesn't support `mode: "insensitive"` for JSON fields yet  */
	/* https://github.com/prisma/prisma/issues/7390 */
	/* As a (hopefully) temporary workaround we'll search separately for lower case, capitalized and uppercase */

	if (modelKey) {
		return [
			/* query */
			{
				[modelKey]: {
					some: {
						[fieldKey]: {
							path: [locale],
							string_contains: searchQuery!.toString().toLowerCase(),
						},
					},
				},
			},
			/* Query */
			{
				[modelKey]: {
					some: {
						[fieldKey]: {
							path: [locale],
							string_contains:
								searchQuery!.toString().charAt(0).toUpperCase() +
								searchQuery!.toString().slice(1),
						},
					},
				},
			},
		];
	} else {
		return [
			/* query */
			{
				[fieldKey]: {
					path: [locale],
					string_contains: searchQuery!.toString().toLowerCase(),
				},
			},
			/* Query */
			{
				[fieldKey]: {
					path: [locale],
					string_contains:
						searchQuery!.toString().charAt(0).toUpperCase() +
						searchQuery!.toString().slice(1),
				},
			},
		];
	}
};
