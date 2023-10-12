import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";

import { isTheme } from "~/utils/theme-provider";
import { getThemeSession } from "~/utils/theme.server";

export const action = async ({ request }: ActionFunctionArgs) => {
	const themeSession = await getThemeSession(request);
	const requestText = await request.text();
	const form = new URLSearchParams(requestText);
	const theme = form.get("theme");

	if (!isTheme(theme)) {
		return json({
			success: false,
			message: `theme value of ${theme} is not a valid theme`,
		});
	}

	themeSession.setTheme(theme);

	return json(
		{ success: true },
		{ headers: { "Set-Cookie": await themeSession.commit() } }
	);
};

export const loader = async () => redirect("/");

/* temporary fix for useFetcher warning :
 *	react_devtools_backend_compact.js:13096
 *	Warning: React.createElement:
 *	type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: object.
 * 	You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.
 *	Thread: https://github.com/remix-run/remix/issues/7497
 */
export default function Component() {
	return null;
}
