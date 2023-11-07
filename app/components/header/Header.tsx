import { useLoaderData, useNavigation } from "@remix-run/react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { AuthMenu } from "~/components/common/Menu/AuthMenu";
import { LanguageMenu } from "~/components/common/Menu/LanguageMenu";
import { ThemeSwitch } from "~/components/common/ThemeButton";
import { MobileNavigation } from "~/components/header/MobileNavigation";
import { NavMenuButton } from "~/components/header/NavMenuButton";
import { NavigationLink } from "~/components/header/NavigationLink";
import { SearchInput } from "~/components/header/SearchInput";
import { type loader } from "~/root";

export const Header = () => {
	const [isOpen, setIsOpen] = useState<boolean>(false);

	const { appName, authData } = useLoaderData<typeof loader>();
	const { t } = useTranslation();
	const { location } = useNavigation();

	useEffect(() => {
		if (isOpen) {
			document.body.classList.add("overflow-hidden");

			return () => {
				document.body.classList.remove("overflow-hidden");
			};
		}
	}, [isOpen]);

	useEffect(() => {
		setIsOpen(false);
	}, [location]);

	return (
		<header className="sticky top-0 mx-4 z-50">
			<div
				className={clsx(
					"mx-auto mb-4 max-w-5xl md:backdrop-blur rounded-b-2xl shadow-none md:shadow-lg ",
					"bg-primary/0 md:bg-primary/40 md:backdrop-brightness-110",
					"bg-primary/0 md:dark:bg-primary/75 md:dark:backdrop-brightness-125"
				)}
			>
				<nav className={clsx("flex justify-between items-center", "px-5 h-16")}>
					<div className="flex gap-2 items-center">
						<NavigationLink to={"/"}>
							<span aria-hidden>{appName}</span>
							<span className="sr-only">{appName}</span>
						</NavigationLink>
						<div className="hidden md:flex gap-2 items-center">
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
					</div>

					<div className="flex gap-2 items-center">
						<div className="hidden md:flex gap-2 items-center">
							<SearchInput isMobile={false} />
							<ThemeSwitch />
							<LanguageMenu />

							{authData ? (
								<AuthMenu />
							) : (
								<NavigationLink to={"/login"}>{t("nav.login")}</NavigationLink>
							)}
						</div>
						<NavMenuButton isOpen={isOpen} setIsOpen={setIsOpen} />
					</div>
				</nav>
			</div>
			<MobileNavigation
				authData={authData}
				isOpen={isOpen}
				setIsOpen={setIsOpen}
			/>
		</header>
	);
};
