import { createCookieSessionStorage } from "@remix-run/node";

import { PARSED_ENV } from "~/consts/parsed-env.const";
import { SessionDataStorageSchema } from "~/schemas/common";

export const sessionDataStorage = createCookieSessionStorage({
	cookie: {
		name: "__data__",
		httpOnly: true,
		path: "/",
		sameSite: "lax",
		secure: true,
		secrets: [PARSED_ENV.SESSION_DATA_SECRET],
		maxAge: 60 * 60, // 60min
	},
});

export const getDataSession = async (request: Request) => {
	const session = await sessionDataStorage.getSession(
		request.headers.get("Cookie")
	);

	return {
		getData: () => session.get("data"),
		setData: (data: unknown) => {
			const parsedData = SessionDataStorageSchema.parse(data);

			return session.set("data", parsedData);
		},
		commit: () => sessionDataStorage.commitSession(session),
		destroy: () => sessionDataStorage.destroySession(session),
	};
};
