export const getFrom = (request: Request) => {
	const currentPathname = new URL(request.clone().url).pathname;
	const referer = request.clone().headers.get("Referer");
	const from = referer && new URL(referer).pathname;

	if (from === currentPathname) {
		return null;
	}

	return from;
};
