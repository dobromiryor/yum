import {
	Link,
	Links,
	Meta,
	Scripts,
	isRouteErrorResponse,
	useRouteError,
} from "@remix-run/react";
import { blurhashToGradientCssObject } from "@unpic/placeholder";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

/* IMAGES START */
/* 401-403 */
import on_401 from "public/images/401-403/display_401.png";
import on_403 from "public/images/401-403/display_403.png";
import placeholder_401_403 from "public/images/401-403/display_placeholder.png";
import oven_401_403 from "public/images/401-403/oven.png";
/* 403 */
/* 404 */
import on_404 from "public/images/404/display_on.png";
import placeholder_404 from "public/images/404/display_placeholder.png";
import oven_404 from "public/images/404/oven.png";
/* 500 */
import on_500 from "public/images/500/display_on.png";
import placeholder_500 from "public/images/500/display_placeholder.png";
import insideOff_500 from "public/images/500/inside_off.png";
import insideOn_500 from "public/images/500/inside_on.png";
import oven_500 from "public/images/500/oven_base.png";
/* IMAGES END */
import { Button } from "~/components/common/UI/Button";
import { E401, E403, E404, E500 } from "~/consts/blurhash.const";
import { useIsImageLoaded } from "~/hooks/useIsImageLoaded";
import { useTypedRouteLoaderData } from "~/hooks/useTypedRouteLoaderData";

export const Unauthorized = ({ from }: { from?: string | null }) => {
	const { t } = useTranslation();
	const { from: rootFrom, authData } = useTypedRouteLoaderData("root");

	const ovenRef = useRef<HTMLImageElement>(null);
	const isOvenLoaded = useIsImageLoaded(ovenRef);

	const onRef = useRef<HTMLImageElement>(null);
	const isOnLoaded = useIsImageLoaded(onRef);

	const placeholderRef = useRef<HTMLImageElement>(null);
	const isPlaceholderLoaded = useIsImageLoaded(placeholderRef);

	const isLoaded = isOnLoaded && isPlaceholderLoaded && isOvenLoaded;

	const imgProps = useMemo(
		() => ({
			animate: isLoaded ? { opacity: 1 } : { opacity: 0 },
			initial: { opacity: 0 },
		}),
		[isLoaded]
	);

	const blur = blurhashToGradientCssObject(E401);

	return (
		<>
			<h1 className="text-2xl typography-bold text-center">
				{t("errorPages.401.title")}
			</h1>
			<div className="flex gap-2">
				{authData ? (
					from ? (
						<Link to={from ?? rootFrom}>
							<Button>{t("errorPages.common.backCTA")}</Button>
						</Link>
					) : null
				) : (
					<Link to="/login">
						<Button>{t("errorPages.401.loginCTA")}</Button>
					</Link>
				)}
				<Link to="/">
					<Button>{t("errorPages.common.homeCTA")}</Button>
				</Link>
			</div>
			<div className="relative w-full max-w-lg max-h-lg aspect-square">
				<motion.img
					ref={ovenRef}
					alt=""
					className="absolute w-full drop-shadow-xl"
					src={oven_401_403}
					{...imgProps}
				/>
				<motion.img
					ref={placeholderRef}
					alt=""
					className="absolute"
					src={placeholder_401_403}
					{...imgProps}
				/>
				<motion.img
					ref={onRef}
					alt=""
					className="absolute animate-blink"
					src={on_401}
					{...imgProps}
				/>
				<motion.div
					animate={isLoaded ? { opacity: 0 } : { opacity: 1 }}
					className="absolute w-full max-w-lg max-h-lg aspect-square drop-shadow-xl rounded-sm"
					initial={{ opacity: 1 }}
					style={blur}
				/>
			</div>
		</>
	);
};

export const Forbidden = ({ from }: { from?: string | null }) => {
	const { t } = useTranslation();
	const { from: rootFrom } = useTypedRouteLoaderData("root");

	const ovenRef = useRef<HTMLImageElement>(null);
	const isOvenLoaded = useIsImageLoaded(ovenRef);

	const onRef = useRef<HTMLImageElement>(null);
	const isOnLoaded = useIsImageLoaded(onRef);

	const placeholderRef = useRef<HTMLImageElement>(null);
	const isPlaceholderLoaded = useIsImageLoaded(placeholderRef);

	const isLoaded = isOnLoaded && isPlaceholderLoaded && isOvenLoaded;

	const imgProps = useMemo(
		() => ({
			animate: isLoaded ? { opacity: 1 } : { opacity: 0 },
			initial: { opacity: 0 },
		}),
		[isLoaded]
	);

	const blur = blurhashToGradientCssObject(E403);

	return (
		<>
			<h1 className="text-2xl typography-bold text-center">
				{t("errorPages.403.title")}
			</h1>
			<div className="flex gap-2">
				{from && (
					<Link to={from ?? rootFrom}>
						<Button>{t("errorPages.common.backCTA")}</Button>
					</Link>
				)}
				<Link to="/">
					<Button>{t("errorPages.common.homeCTA")}</Button>
				</Link>
			</div>
			<div className="relative w-full max-w-lg max-h-lg aspect-square">
				<motion.img
					ref={ovenRef}
					alt=""
					className="absolute w-full drop-shadow-xl"
					src={oven_401_403}
					{...imgProps}
				/>
				<motion.img
					ref={placeholderRef}
					alt=""
					className="absolute"
					src={placeholder_401_403}
					{...imgProps}
				/>
				<motion.img
					ref={onRef}
					alt=""
					className="absolute animate-blink"
					src={on_403}
					{...imgProps}
				/>
				<motion.div
					animate={isLoaded ? { opacity: 0 } : { opacity: 1 }}
					className="absolute w-full max-w-lg max-h-lg aspect-square drop-shadow-xl rounded-sm"
					initial={{ opacity: 1 }}
					style={blur}
				/>
			</div>
		</>
	);
};

export const NotFound = ({ from }: { from?: string | null }) => {
	const { t } = useTranslation();
	const { from: rootFrom } = useTypedRouteLoaderData("root");

	const ovenRef = useRef<HTMLImageElement>(null);
	const isOvenLoaded = useIsImageLoaded(ovenRef);

	const onRef = useRef<HTMLImageElement>(null);
	const isOnLoaded = useIsImageLoaded(onRef);

	const placeholderRef = useRef<HTMLImageElement>(null);
	const isPlaceholderLoaded = useIsImageLoaded(placeholderRef);

	const isLoaded = isOnLoaded && isPlaceholderLoaded && isOvenLoaded;

	const blur = blurhashToGradientCssObject(E404);

	const imgProps = useMemo(
		() => ({
			animate: isLoaded ? { opacity: 1 } : { opacity: 0 },
			initial: { opacity: 0 },
		}),
		[isLoaded]
	);

	return (
		<>
			<h1 className="text-2xl typography-bold text-center">
				{t("errorPages.404.title")}
			</h1>
			<div className="flex gap-2">
				{from && (
					<Link to={from ?? rootFrom}>
						<Button>{t("errorPages.common.backCTA")}</Button>
					</Link>
				)}
				<Link to="/">
					<Button>{t("errorPages.common.homeCTA")}</Button>
				</Link>
			</div>
			<div className="relative w-full max-w-lg max-h-lg aspect-square">
				<motion.img
					ref={ovenRef}
					alt=""
					className="absolute w-full drop-shadow-xl"
					src={oven_404}
					{...imgProps}
				/>
				<motion.img
					ref={placeholderRef}
					alt=""
					className="absolute"
					src={placeholder_404}
					{...imgProps}
				/>
				<motion.img
					ref={onRef}
					alt=""
					className="absolute animate-blink"
					src={on_404}
					{...imgProps}
				/>
				<motion.div
					animate={isLoaded ? { opacity: 0 } : { opacity: 1 }}
					className="absolute w-full max-w-lg max-h-lg aspect-square drop-shadow-xl rounded-sm"
					initial={{ opacity: 1 }}
					style={blur}
				/>
			</div>
		</>
	);
};

const Unexpected = () => {
	const { from } = useTypedRouteLoaderData("root");
	const { t } = useTranslation();

	const ovenRef = useRef<HTMLImageElement>(null);
	const isOvenLoaded = useIsImageLoaded(ovenRef);

	const insideOnRef = useRef<HTMLImageElement>(null);
	const isInsideOnLoaded = useIsImageLoaded(insideOnRef);

	const insideOffRef = useRef<HTMLImageElement>(null);
	const isInsideOffLoaded = useIsImageLoaded(insideOffRef);

	const onRef = useRef<HTMLImageElement>(null);
	const isOnLoaded = useIsImageLoaded(onRef);

	const placeholderRef = useRef<HTMLImageElement>(null);
	const isPlaceholderLoaded = useIsImageLoaded(placeholderRef);

	const isLoaded =
		isOnLoaded &&
		isInsideOffLoaded &&
		isInsideOnLoaded &&
		isPlaceholderLoaded &&
		isOvenLoaded;

	const imgProps = useMemo(
		() => ({
			animate: isLoaded ? { opacity: 1 } : { opacity: 0 },
			initial: { opacity: 0 },
		}),
		[isLoaded]
	);

	const blur = blurhashToGradientCssObject(E500);

	return (
		<>
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
			<div className={clsx("relative w-full max-w-lg max-h-lg aspect-square")}>
				<motion.img
					ref={ovenRef}
					alt=""
					className="absolute w-full drop-shadow-xl"
					src={oven_500}
					{...imgProps}
				/>
				<motion.img
					ref={insideOffRef}
					alt=""
					className="absolute"
					src={insideOff_500}
					{...imgProps}
				/>
				<motion.img
					ref={insideOnRef}
					alt=""
					className="absolute animate-malfunction"
					src={insideOn_500}
					{...imgProps}
				/>
				<motion.img
					ref={placeholderRef}
					alt=""
					className="absolute"
					src={placeholder_500}
					{...imgProps}
				/>
				<motion.img
					ref={onRef}
					alt=""
					className="absolute animate-blink"
					src={on_500}
					{...imgProps}
				/>
				<motion.div
					animate={isLoaded ? { opacity: 0 } : { opacity: 1 }}
					className="absolute w-full max-w-lg max-h-lg aspect-square drop-shadow-xl rounded-sm"
					initial={{ opacity: 1 }}
					style={blur}
				/>
			</div>
		</>
	);
};

export const ErrorBoundaryContent = () => {
	const error = useRouteError();

	return (
		<div className="flex flex-col items-center gap-6 p-4">
			{isRouteErrorResponse(error) ? (
				error.status === 401 ? (
					<Unauthorized />
				) : error.status === 403 ? (
					<Forbidden />
				) : error.status === 404 ? (
					<NotFound />
				) : (
					<Unexpected />
				)
			) : (
				<Unexpected />
			)}

			<details className="flex flex-col gap-2 max-w-full">
				<summary className="cursor-pointer">Error Details</summary>
				{isRouteErrorResponse(error) ? (
					<>
						<h2>
							{error.status} {error.statusText}
						</h2>
						<p>{error.data}</p>
					</>
				) : error instanceof Error ? (
					<pre className="whitespace-pre-wrap">{error.stack}</pre>
				) : (
					<p>Unknown error</p>
				)}
			</details>
		</div>
	);
};

export function ErrorBoundary() {
	const { theme: loaderTheme, locale } = useTypedRouteLoaderData("root");

	const error = useRouteError();
	const { i18n } = useTranslation();

	console.error(error);

	return (
		<html
			className={clsx(loaderTheme, "flex justify-center min-h-full")}
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
				<ErrorBoundaryContent />
				<Scripts />
			</body>
		</html>
	);
}
