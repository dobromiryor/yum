import { useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { type loader } from "~/root";
import { useAuth } from "~/utils/auth";

import { AuthMenu } from "./AuthMenu";
import { LanguageMenu } from "./LanguageMenu";
import { NavigationLink } from "./NavigationLink";
import { ThemeSwitch } from "./ThemeButton";

export const Header = () => {
	const { t } = useTranslation();
	const { appName, authData } = useLoaderData<typeof loader>();

	const { user, isAuthenticated } = useAuth(authData);

	return (
		<header
			className={
				"sticky top-0 mx-4 mb-4 backdrop-blur backdrop-brightness-95 dark:backdrop-brightness-110 rounded-b-lg"
			}
		>
			<nav className={clsx("flex justify-between items-center", "px-5 h-16")}>
				<div className="flex gap-2 items-center">
					<NavigationLink to={"/"}>
						<span aria-hidden>{appName}</span>
						<span className="sr-only">{appName}</span>
					</NavigationLink>
					<NavigationLink to={"/recipes"}>{t("nav.recipes")}</NavigationLink>
					{isAuthenticated && (
						<NavigationLink to={`/recipes/${user?.id}`}>
							{t("nav.myRecipes")}
						</NavigationLink>
					)}
				</div>

				<div className="flex gap-2 items-center">
					<ThemeSwitch />
					<LanguageMenu />

					{user ? (
						<AuthMenu />
					) : (
						<NavigationLink to={"/login"}>{t("nav.login")}</NavigationLink>
					)}
				</div>
			</nav>
			{/* MOBILE */}
			{/* <div>
				<div>
					<NavigationLink to={"/"}>{appName}</NavigationLink>
				</div>
			</div> */}
		</header>
	);
};
