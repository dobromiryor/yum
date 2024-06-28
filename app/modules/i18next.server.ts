import { createCookie } from "@remix-run/node";
import Backend from "i18next-fs-backend";
import { RemixI18Next } from "remix-i18next/server";

import i18n from "~/modules/i18n";

import { resolve } from "node:path";

export const i18nCookie = createCookie("__i18n__", {
	sameSite: "lax",
	path: "/",
});

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
