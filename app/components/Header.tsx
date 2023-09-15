import { NavLink, useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { type loader } from "~/root";
import { useAuth } from "~/utils/auth";

import { AuthMenu } from "./AuthMenu";
import { LanguageSwitch } from "./LanguageSwitch";
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
					<NavLink to={"/"}>
						<span aria-hidden>{appName}</span>
						<span className="sr-only">{appName}</span>
					</NavLink>
					<NavLink to={"/recipes"}>{t("nav.recipes")}</NavLink>
					{isAuthenticated && (
						<NavLink to={`/recipes/${user?.id}`}>{t("nav.myRecipes")}</NavLink>
					)}
				</div>

				<div className="flex gap-2 items-center">
					<LanguageSwitch />
					<ThemeSwitch />

					{user ? (
						<AuthMenu />
					) : (
						<NavLink to={"/login"}>{t("nav.login")}</NavLink>
					)}
				</div>
			</nav>
			{/* MOBILE */}
			{/* <div>
				<div>
					<NavLink to={"/"}>{appName}</NavLink>
				</div>
			</div> */}
		</header>
	);
};
