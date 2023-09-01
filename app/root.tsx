import { json, type LoaderArgs } from "@remix-run/node";
import { LiveReload, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { useChangeLanguage } from "remix-i18next";

import i18next from "./i18n.server";

export const loader = async ({ request }: LoaderArgs) => {
	const locale = await i18next.getLocale(request);

	return json({ locale });
};

export default function App() {
	const { locale } = useLoaderData<typeof loader>();

	const { i18n, t } = useTranslation();

	useChangeLanguage(locale);

	return (
		<html dir={i18n.dir()} lang={locale}>
			<head>
				<meta charSet="utf-8" />
				<meta content="width=device-width,initial-scale=1" name="viewport" />
				<title>Yum</title>
			</head>
			<body>
				<h1>{t("greetings")}</h1>
				<LiveReload />
			</body>
		</html>
	);
}
