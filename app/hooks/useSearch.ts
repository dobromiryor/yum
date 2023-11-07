import { useSearchParams } from "@remix-run/react";

export const useSearch = () => {
	const [searchParams] = useSearchParams();

	if (searchParams.has("q")) {
		const searchQuery = searchParams.get("q");

		if (!searchQuery?.trim().length) {
			searchParams.delete("q");

			return undefined;
		} else {
			return searchQuery;
		}
	}
};
