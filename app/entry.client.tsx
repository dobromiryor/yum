import { RemixBrowser } from "@remix-run/react";
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { getInitialNamespaces } from "remix-i18next";

import { hydrateRoot } from "react-dom/client";

import { StrictMode } from "react";

import i18n from "./i18n";

i18next
	.use(initReactI18next)
	.use(LanguageDetector)
	.use(Backend)
	.init({
		...i18n,
		ns: getInitialNamespaces(),
		backend: {
			loadPath: "/locales/{{lng}}/{{ns}}.json",
			requestOptions: {
				cache: process.env.NODE_ENV === "development" ? "no-cache" : "default",
			},
		},
		detection: {
			caches: ["cookie"],
		},
	})
	.then(() =>
		hydrateRoot(
			document,
			<I18nextProvider i18n={i18next}>
				<StrictMode>
					<RemixBrowser />
				</StrictMode>
			</I18nextProvider>
		)
	);
