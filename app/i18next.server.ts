import { createCookie } from "@remix-run/node";
import Backend from "i18next-fs-backend";
import { RemixI18Next } from "remix-i18next";

import { type Language } from "~/enums/language.enum";
import i18n from "~/i18n";

import { resolve } from "node:path";

export const i18nCookie = createCookie("i18next", {
	sameSite: "lax",
	path: "/",
});

export const detectLanguage = (request: Request) => {
	const cookies = request.headers.get("Cookie");

	const cookie = Object.fromEntries(
		cookies?.split("; ").map((cookie) => cookie.split("=")) ?? []
	) as { i18next?: Language };

	if (cookie.i18next) {
		return cookie.i18next;
	}

	return null;
};

const i18next = new RemixI18Next({
	detection: {
		cookie: i18nCookie,
		supportedLanguages: i18n.supportedLngs,
		fallbackLanguage: i18n.fallbackLng,
	},
	i18next: {
		...i18n,
		backend: {
			loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json"),
			requestOptions: {
				cache: process.env.NODE_ENV === "development" ? "no-cache" : "default",
			},
		},
	},
	plugins: [Backend],
});

export default i18next;
