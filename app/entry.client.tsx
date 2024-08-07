import { RemixBrowser } from "@remix-run/react";
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { getInitialNamespaces } from "remix-i18next/client";

import i18n from "~/modules/i18n";

const hydrate = async () => {
	await i18next
		.use(initReactI18next)
		.use(LanguageDetector)
		.use(Backend)
		.init({
			...i18n,
			ns: getInitialNamespaces(),
			backend: {
				loadPath: "/locales/{{lng}}/{{ns}}.json",
				requestOptions: {
					cache:
						process.env.NODE_ENV === "development" ? "no-cache" : "default",
				},
			},
			detection: {
				lookupCookie: "__i18n__",
				order: ["htmlTag", "cookie"],
			},
		});

	startTransition(() => {
		hydrateRoot(
			document,
			<I18nextProvider i18n={i18next}>
				<StrictMode>
					<RemixBrowser />
				</StrictMode>
			</I18nextProvider>
		);
	});
};

if (window.requestIdleCallback) {
	window.requestIdleCallback(hydrate);
} else {
	// Safari doesn't support requestIdleCallback
	// https://caniuse.com/requestidlecallback
	window.setTimeout(hydrate, 1);
}

// if the browser supports SW (all modern browsers do it)
if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		// we will register it after the page complete the load
		navigator.serviceWorker.register("/sw.js");
	});
}
