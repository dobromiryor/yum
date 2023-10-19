import {
	json,
	type LinksFunction,
	type LoaderFunctionArgs,
	type MetaFunction,
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

import { Header } from "~/components/common/Header";
import { Layout } from "~/components/common/Layout";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import i18next, { detectLanguage } from "~/i18next.server";
import tailwind from "~/styles/tailwind.css";
import { auth } from "~/utils/auth.server";
import { ThemeHead, ThemeProvider, useTheme } from "~/utils/theme-provider";
import { getThemeSession } from "~/utils/theme.server";

export const links: LinksFunction = () => {
	return [
		{
			rel: "stylesheet",
			href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded&display=swap", // TODO: Optimize font
		},
		{
			rel: "stylesheet",
			href: "https://fonts.googleapis.com/css2?family=Rubik:wght@300..900&display=swap",
		},
		{
			rel: "stylesheet",
			href: tailwind,
		},
	];
};

export async function loader({ request }: LoaderFunctionArgs) {
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

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{ title: data?.appName },
		{ charset: "utf-8" },
		{ name: "viewport", content: "width=device-width, initial-scale=1" },
	];
};

function App() {
	const { locale, theme: loaderTheme } = useLoaderData<typeof loader>();
	const [theme] = useTheme();

	const { i18n } = useTranslation();

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
