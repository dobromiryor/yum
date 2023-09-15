import { createCookieSessionStorage } from "@remix-run/node";

import { PARSED_ENV } from "~/consts/parsed-env.const";

import { isTheme, type Theme } from "./theme-provider";

const themeStorage = createCookieSessionStorage({
	cookie: {
		name: "__theme__",
		secure: true,
		secrets: [PARSED_ENV.THEME_SECRET],
		sameSite: "lax",
		path: "/",
		httpOnly: true,
	},
});

export const getThemeSession = async (request: Request) => {
	const session = await themeStorage.getSession(request.headers.get("Cookie"));

	return {
		getTheme: () => {
			const themeValue = session.get("theme");

			return isTheme(themeValue) ? themeValue : null;
		},
		setTheme: (theme: Theme) => session.set("theme", theme),
		commit: () => themeStorage.commitSession(session),
	};
};
