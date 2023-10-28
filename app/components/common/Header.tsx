import { useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { AuthMenu } from "~/components/common/Menu/AuthMenu";
import { LanguageMenu } from "~/components/common/Menu/LanguageMenu";
import { NavigationLink } from "~/components/common/NavigationLink";
import { ThemeSwitch } from "~/components/common/ThemeButton";
import { type loader } from "~/root";

export const Header = () => {
	const { t } = useTranslation();

	const { appName, authData } = useLoaderData<typeof loader>();

	return (
		<header className="sticky top-0 mx-4 z-50">
			<div className="mx-auto mb-4 max-w-5xl backdrop-blur backdrop-brightness-95 dark:backdrop-brightness-110 rounded-b-lg">
				<nav className={clsx("flex justify-between items-center", "px-5 h-16")}>
					<div className="flex gap-2 items-center">
						<NavigationLink to={"/"}>
							<span aria-hidden>{appName}</span>
							<span className="sr-only">{appName}</span>
						</NavigationLink>
						<NavigationLink end to={"/recipes"}>
							{t("nav.recipes")}
						</NavigationLink>
						{authData?.isVerified && (
							<NavigationLink to={`/users/${authData?.id}`}>
								{t("nav.myRecipes")}
							</NavigationLink>
						)}
						{authData?.isVerified && (
							<NavigationLink to={`/recipes/new`}>
								{t("nav.newRecipe")}
							</NavigationLink>
						)}
					</div>

					<div className="flex gap-2 items-center">
						<ThemeSwitch />
						<LanguageMenu />

						{authData ? (
							<AuthMenu />
						) : (
							<NavigationLink to={"/login"}>{t("nav.login")}</NavigationLink>
						)}
					</div>
				</nav>
			</div>
			{/* MOBILE */}
			{/* <div>
				<div>
					<NavigationLink to={"/"}>{appName}</NavigationLink>
				</div>
			</div> */}
		</header>
	);
};
