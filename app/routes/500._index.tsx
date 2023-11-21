import { redirect } from "@remix-run/node";
import {
	Link,
	Links,
	Meta,
	Scripts,
	isRouteErrorResponse,
	useRouteError,
} from "@remix-run/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import on from "public/images/500/display_on.png";
import placeholder from "public/images/500/display_placeholder.png";
import insideOff from "public/images/500/inside_off.png";
import insideOn from "public/images/500/inside_on.png";
import oven from "public/images/500/oven_base.png";
import { Button } from "~/components/common/UI/Button";
import { useTypedRouteLoaderData } from "~/hooks/useTypedRouteLoaderData";

export const sitemap = () => ({
	exclude: true,
});

export const loader = () => {
	return redirect("/");
};

export function ErrorBoundary() {
	const { theme: loaderTheme, from, locale } = useTypedRouteLoaderData("root");

	const error = useRouteError();
	const { t, i18n } = useTranslation();

	console.error(error);

	return (
		<html
			className={clsx(loaderTheme, "flex justify-center h-0 min-h-full")}
			dir={i18n.dir()}
			lang={locale}
		>
			<head>
				<meta charSet="utf-8" />
				<meta content="width=device-width, initial-scale=1" name="viewport" />
				<Meta />
				<Links />
			</head>
			<body className="flex flex-col justify-center min-h-full max-w-xl">
				<div className="flex flex-col items-center gap-6 p-4">
					<h1 className="text-2xl typography-bold text-center">
						{t("errorPages.500.title")}
					</h1>
					<div className="flex gap-2">
						<Button onClick={() => window.location.reload()}>
							{t("errorPages.500.refreshCTA")}
						</Button>
						{from && (
							<Link to={from}>
								<Button>{t("errorPages.common.backCTA")}</Button>
							</Link>
						)}
						<Link to="/">
							<Button>{t("errorPages.common.homeCTA")}</Button>
						</Link>
					</div>
					<div className="relative w-full max-w-lg max-h-lg aspect-square">
						<img alt="" className="absolute w-full drop-shadow-xl" src={oven} />
						<img alt="" className="absolute" src={insideOff} />
						<img
							alt=""
							className="absolute animate-malfunction"
							src={insideOn}
						/>
						<img alt="" className="absolute" src={placeholder} />
						<img alt="" className="absolute animate-blink" src={on} />
					</div>

					<details className="self-start flex flex-col gap-2 max-w-full">
						<summary>Error Details</summary>
						{isRouteErrorResponse(error) ? (
							<>
								<h2>
									{error.status} {error.statusText}
								</h2>
								<p>{error.data}</p>
							</>
						) : error instanceof Error ? (
							<pre className="overflow-x-auto">{error.stack}</pre>
						) : (
							<p>Unknown error</p>
						)}
					</details>
				</div>
				<Scripts />
			</body>
		</html>
	);
}
