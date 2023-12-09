import { json, type LoaderFunctionArgs } from "@remix-run/node";

import { DARK, LIGHT } from "~/consts/color.const";
import { Theme } from "~/utils/providers/theme-provider";
import { getThemeSession } from "~/utils/theme.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const themeSession = await getThemeSession(request);
	const theme = themeSession.getTheme();

	return json(
		{
			short_name: "Yum",
			name: "Yum",
			start_url: "/",
			display: "standalone",
			background_color: theme === Theme.LIGHT ? LIGHT : DARK,
			theme_color: theme === Theme.LIGHT ? LIGHT : DARK,
			icons: [
				{
					src: "/favicon.ico",
					sizes: "48x48",
					type: "image/x-icon",
				},
				{
					src: "/icons/android-icon-36x36.png",
					sizes: "36x36",
					type: "image/png",
					density: "0.75",
				},
				{
					src: "/icons/android-icon-48x48.png",
					sizes: "48x48",
					type: "image/png",
					density: "1.0",
				},
				{
					src: "/icons/android-icon-72x72.png",
					sizes: "72x72",
					type: "image/png",
					density: "1.5",
				},
				{
					src: "/icons/android-icon-96x96.png",
					sizes: "96x96",
					type: "image/png",
					density: "2.0",
				},
				{
					src: "/icons/android-icon-144x144.png",
					sizes: "144x144",
					type: "image/png",
					density: "3.0",
				},
				{
					src: "/icons/android-chrome-192x192.png",
					sizes: "192x192",
					type: "image/png",
					purpose: "maskable",
				},
				{
					src: "/icons/android-chrome-256x256.png",
					sizes: "256x256",
					type: "image/png",
					purpose: "maskable",
				},
				{
					src: "/icons/android-chrome-512x512.png",
					sizes: "512x512",
					type: "image/png",
					purpose: "maskable",
				},
			],
		},
		{
			headers: {
				"Cache-Control": "public, max-age=600",
				"Content-Type": "application/manifest+json",
			},
		}
	);
};