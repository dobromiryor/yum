import {
	createReadableStreamFromReadable,
	type EntryContext,
} from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { createInstance, type i18n as I18N } from "i18next";
import Backend from "i18next-fs-backend";
import { isbot } from "isbot";
import { StrictMode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { createSitemapGenerator } from "remix-sitemap";

import { PARSED_ENV } from "~/consts/parsed-env.const";
import i18n from "~/modules/i18n";
import i18next from "~/modules/i18next.server";

import { resolve } from "node:path";
import { PassThrough } from "stream";

const ABORT_DELAY = 5000;

const { isSitemapUrl, sitemap } = createSitemapGenerator({
	siteUrl: PARSED_ENV.DOMAIN_URL,
	format: true,
	generateRobotsTxt: true,
	headers: {
		"Cache-Control": "max-age=3600",
	},
});

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext
) {
	const callbackName = isbot(request.headers.get("user-agent"))
		? "onAllReady"
		: "onShellReady";

	const instance = createInstance();
	const lng = await i18next.getLocale(request);
	const ns = i18next.getRouteNamespaces(remixContext);

	if (isSitemapUrl(request)) {
		return await sitemap(request, remixContext);
	}

	await instance
		.use(initReactI18next)
		.use(Backend)
		.init({
			...i18n,
			lng,
			ns,
			backend: {
				loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json"),
				requestOptions: {
					cache:
						process.env.NODE_ENV === "development" ? "no-cache" : "default",
				},
			},
			detection: {
				lookupCookie: "__i18n__",
			},
		});

	return new Promise((resolve, reject) => {
		let didError = false;

		const { pipe, abort } = renderToPipeableStream(
			<StrictMode>
				{/* https://github.com/i18next/react-i18next/issues/1693 */}
				<I18nextProvider i18n={instance as I18N}>
					<RemixServer context={remixContext} url={request.url} />
				</I18nextProvider>
			</StrictMode>,
			{
				[callbackName]: () => {
					const body = new PassThrough();
					const stream = createReadableStreamFromReadable(body);

					responseHeaders.set("Content-Type", "text/html");

					resolve(
						new Response(stream, {
							headers: responseHeaders,
							status: didError ? 500 : responseStatusCode,
						})
					);

					pipe(body);
				},
				onShellError(error: unknown) {
					reject(error);
				},
				onError(error: unknown) {
					didError = true;

					console.error(error);
				},
			}
		);

		setTimeout(abort, ABORT_DELAY);
	});
}
