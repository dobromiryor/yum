import { useTranslation } from "react-i18next";

import { Avatar } from "~/components/common/Avatar";
import { Menu } from "~/components/common/Menu/Menu";
import { NavigationLink } from "~/components/common/NavigationLink";

export const AuthMenu = () => {
	const { t } = useTranslation();

	return (
		<Menu isButtonRounded button={<Avatar />} position="right">
			<NavigationLink buttonClassName="flex-1" to="/settings">
				{t("nav.authMenu.settings")}
			</NavigationLink>
			<NavigationLink buttonClassName="flex-1" to="/logout" variant="danger">
				{t("nav.authMenu.logout")}
			</NavigationLink>
		</Menu>
	);
};
