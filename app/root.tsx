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

import manifest from "public/manifest.webmanifest";
import { Layout } from "~/components/common/Layout";
import { Menu, MenuProvider } from "~/components/common/Menu/Menu";
import { Tooltip, TooltipProvider } from "~/components/common/Tooltip";
import { Header } from "~/components/header/Header";
import { NAMESPACES } from "~/consts/namespaces.const";
import { PARSED_ENV } from "~/consts/parsed-env.const";
import i18n from "~/modules/i18n";
import i18next, { i18nCookie } from "~/modules/i18next.server";
import { auth } from "~/utils/auth.server";
import { getFrom } from "~/utils/helpers/get-from.server";
import {
	generateMetaDescription,
	generateMetaProps,
	generateMetaTitle,
} from "~/utils/helpers/meta-helpers";
import {
	ThemeHead,
	ThemeProvider,
	useTheme,
} from "~/utils/providers/theme-provider";
import { getThemeSession } from "~/utils/theme.server";

import tailwind from "./styles/tailwind.css";

export const handle = NAMESPACES;

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return generateMetaProps(data?.meta);
};

export const links: LinksFunction = () => {
	return [
		{
			rel: "stylesheet",
			href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0",
		},
		{
			rel: "stylesheet",
			href: "https://fonts.googleapis.com/css2?family=Rubik:wght@300..900&display=swap",
		},
		{
			rel: "stylesheet",
			href: tailwind,
		},
		{
			rel: "manifest",
			href: manifest,
		},
	];
};

export async function loader({ request }: LoaderFunctionArgs) {
	const locale = (await i18next.getLocale(request)) ?? i18n.fallbackLng;
	const themeSession = await getThemeSession(request);

	const authData = await auth.isAuthenticated(request);

	const from = getFrom(request);

	const t = await i18next.getFixedT(request);

	const theme = themeSession.getTheme();

	const title = generateMetaTitle({
		title: PARSED_ENV.APP_NAME,
	});

	const description = generateMetaDescription({
		description: t("seo.home.description", { appName: PARSED_ENV.APP_NAME }),
	});

	return json(
		{
			authData,
			locale,
			theme,
			from,
			ENV: {
				APP_NAME: PARSED_ENV.APP_NAME,
				CLOUDINARY_CLOUD_NAME: PARSED_ENV.CLOUDINARY_CLOUD_NAME,
			},
			meta: {
				url: PARSED_ENV.DOMAIN_URL,
				title,
				description,
				path: "",
				theme,
			},
		} as const,
		{
			headers: {
				"set-cookie": await i18nCookie.serialize(locale),
			},
		}
	);
}

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
				<meta charSet="utf-8" />
				<meta content="width=device-width, initial-scale=1" name="viewport" />
				<meta content="black" name="apple-mobile-web-app-status-bar-style" />
				<meta
					content="#ffffff"
					media="((prefers-color-scheme: light)"
					name="theme-color"
				/>
				<meta
					content="#000000"
					media="((prefers-color-scheme: dark)"
					name="theme-color"
				/>
				<Meta />
				<Links />
				<ThemeHead ssrTheme={Boolean(loaderTheme)} />
			</head>
			<body className="flex flex-col min-h-full">
				<Header />
				<Layout>
					<Outlet />
				</Layout>
				<Tooltip />
				<Menu />
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
			<TooltipProvider>
				<MenuProvider>
					<App />
				</MenuProvider>
			</TooltipProvider>
		</ThemeProvider>
	);
}

export { ErrorBoundary } from "~/components/common/ErrorBoundary";
