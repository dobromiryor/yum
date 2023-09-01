import { Response } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";

import isbot from "isbot";
import { renderToPipeableStream } from "react-dom/server";

import Backend from "i18next-fs-backend";
import { I18nextProvider, initReactI18next } from "react-i18next";

import { createInstance } from "i18next";

import i18n, { loadPath } from "./i18n"; // your i18n configuration file

import i18next from "./i18n.server";

import { PassThrough } from "stream";

import type { EntryContext } from "@remix-run/node";

const ABORT_DELAY = 5000;

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext
) {
	const callbackName = isbot(request.headers.get("user-agent")) ? "onAllReady" : "onShellReady";

	const instance = createInstance();
	const lng = await i18next.getLocale(request);

	await instance
		.use(initReactI18next) // Tell our instance to use react-i18next
		.use(Backend) // Setup our backend
		.init({
			...i18n, // spread the configuration
			lng, // The locale we detected above
			backend: { loadPath },
		});

	return new Promise((resolve, reject) => {
		let didError = false;

		const { pipe, abort } = renderToPipeableStream(
			<I18nextProvider i18n={instance}>
				<RemixServer context={remixContext} url={request.url} />
			</I18nextProvider>,
			{
				[callbackName]: () => {
					const body = new PassThrough();

					responseHeaders.set("Content-Type", "text/html");

					resolve(
						new Response(body, {
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
