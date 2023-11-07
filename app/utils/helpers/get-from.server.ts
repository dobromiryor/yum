export const getFrom = (request: Request) => {
	const referer = request.clone().headers.get("Referer");
	const from = referer && new URL(referer).pathname;

	return from;
};
