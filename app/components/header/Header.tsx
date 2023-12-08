import { NavLink, useNavigation } from "@remix-run/react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import logo_dark from "public/images/logo/logo_dark_200.png";
import logo_light from "public/images/logo/logo_light_200.png";
import { AuthMenu } from "~/components/common/Menu/AuthMenu";
import { LanguageMenu } from "~/components/common/Menu/LanguageMenu";
import { ThemeSwitch } from "~/components/common/ThemeButton";
import { MobileNavigation } from "~/components/header/MobileNavigation";
import { NavMenuButton } from "~/components/header/NavMenuButton";
import { NavigationLink } from "~/components/header/NavigationLink";
import { SearchInput } from "~/components/header/SearchInput";
import { useTypedRouteLoaderData } from "~/hooks/useTypedRouteLoaderData";
import { CategoryMenu } from "~/routes/resources.categories";
import { Theme, useTheme } from "~/utils/providers/theme-provider";

export const Header = () => {
	const [isOpen, setIsOpen] = useState<boolean>(false);

	const [theme] = useTheme();
	const { t } = useTranslation();
	const { location } = useNavigation();
	const { authData, ENV } = useTypedRouteLoaderData("root");

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
						<NavLink to={"/"}>
							<img
								aria-hidden
								alt=""
								className="max-h-8"
								height={31.98}
								src={theme === Theme.LIGHT ? logo_light : logo_dark}
								width={68.81}
							/>
							<span className="sr-only">{ENV.APP_NAME}</span>
						</NavLink>
						<div className="hidden md:flex gap-2 items-center">
							<NavigationLink end to={"/recipes"}>
								{t("nav.recipes")}
							</NavigationLink>

							<CategoryMenu />

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
