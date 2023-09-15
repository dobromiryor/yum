import { useTranslation } from "react-i18next";

import { Avatar } from "./Avatar";
import { Menu } from "./Menu";
import { NavigationLink } from "./NavigationLink";

export const AuthMenu = () => {
	const { t } = useTranslation();

	return (
		<Menu isButtonRounded button={<Avatar />} position="right">
			<NavigationLink to="/settings">
				{t("nav.authMenu.settings")}
			</NavigationLink>
			<NavigationLink to="/logout">{t("nav.authMenu.logout")}</NavigationLink>
		</Menu>
	);
};
