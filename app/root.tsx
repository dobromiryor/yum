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
import { setErrorMap } from "zod";
import { makeZodI18nMap } from "zod-i18n-map";

import { Layout } from "~/components/common/Layout";
import { Header } from "~/components/header/Header";
import { NAMESPACES } from "~/consts/namespaces.const";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import i18n from "~/modules/i18n";
import i18next, { i18nCookie } from "~/modules/i18next.server";
import tailwind from "~/styles/tailwind.css";
import { auth } from "~/utils/auth.server";
import {
	ThemeHead,
	ThemeProvider,
	useTheme,
} from "~/utils/providers/theme-provider";
import { getThemeSession } from "~/utils/theme.server";

export const handle = NAMESPACES;

export const links: LinksFunction = () => {
	return [
		{
			rel: "stylesheet",
			href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&display=block",
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
	const locale = (await i18next.getLocale(request)) ?? i18n.fallbackLng;
	const themeSession = await getThemeSession(request);

	const authData = await auth.isAuthenticated(request);

	return json(
		{
			authData,
			locale,
			theme: themeSession.getTheme(),
			appName: PARSED_ENV.APP_NAME,
		} as const,
		{
			headers: {
				"set-cookie": await i18nCookie.serialize(locale),
			},
		}
	);
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

	const { t, i18n } = useTranslation();

	useChangeLanguage(locale);
	setErrorMap(makeZodI18nMap({ t }));

	return (
		<html
			className={clsx(theme, "h-0 min-h-full")}
			dir={i18n.dir()}
			lang={locale}
		>
			<head>
				<Meta />
				<Links />
				<ThemeHead ssrTheme={Boolean(loaderTheme)} />
			</head>
			<body className="flex flex-col min-h-full">
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
