import { createCookieSessionStorage, type Session } from "@remix-run/node";

import { PARSED_ENV } from "~/consts/parsed-env.const";

export const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: "__session__",
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		secure: true,
		secrets: [PARSED_ENV.SESSION_SECRET],
	},
});

export function getSession(request: Request): Promise<Session> {
	return sessionStorage.getSession(request.headers.get("Cookie"));
}

export const { commitSession, destroySession } = sessionStorage;
