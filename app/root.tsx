import {
	json,
	type LinksFunction,
	type LoaderArgs,
	type V2_MetaFunction,
} from "@remix-run/node";
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from "@remix-run/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { useChangeLanguage } from "remix-i18next";

import { Header } from "./components/Header";
import { PARSED_ENV } from "./consts/parsed-env.const";
import i18next, { detectLanguage } from "./i18next.server";

import { Layout } from "./components/Layout";
import tailwind from "./styles/tailwind.css";
import { auth } from "./utils/auth.server";
import { ThemeHead, ThemeProvider, useTheme } from "./utils/theme-provider";
import { getThemeSession } from "./utils/theme.server";

export const links: LinksFunction = () => {
	return [{ rel: "stylesheet", href: tailwind }];
};

export const meta: V2_MetaFunction = ({ data }) => {
	const { appName } = data;

	return [
		{ title: appName },
		{ charset: "utf-8" },
		{ viewport: "width=device-width,initial-scale=1" },
	];
};

export async function loader({ request }: LoaderArgs) {
	const locale = detectLanguage(request) ?? (await i18next.getLocale(request));
	const themeSession = await getThemeSession(request);

	const authData = await auth.isAuthenticated(request);

	return json({
		authData,
		locale,
		theme: themeSession.getTheme(),
		appName: PARSED_ENV.APP_NAME,
	});
}

export const handle = {
	i18n: "translation",
};

function App() {
	const { locale, theme: loaderTheme } = useLoaderData<typeof loader>();

	const { i18n } = useTranslation();
	const [theme] = useTheme();

	useChangeLanguage(locale);

	return (
		<html className={clsx(theme)} dir={i18n.dir()} lang={i18n.language}>
			<head>
				<Meta />
				<Links />
				<ThemeHead ssrTheme={Boolean(loaderTheme)} />
			</head>
			<body>
				<Header />
				<Layout>
					<Outlet />
				</Layout>
				<ScrollRestoration />
				<Scripts />
				{process.env.NODE_ENV === "development" ? <LiveReload /> : null}
			</body>
		</html>
	);
}

export default function AppWithProviders() {
	const { theme } = useLoaderData<typeof loader>();

	return (
		<ThemeProvider specifiedTheme={theme}>
			<App />
		</ThemeProvider>
	);
}
