import { Role } from "@prisma/client";
import { useTranslation } from "react-i18next";

import { Avatar } from "~/components/common/Avatar";
import { MenuWrapper } from "~/components/common/Menu/Menu";
import { NavigationLink } from "~/components/header/NavigationLink";
import { useTypedRouteLoaderData } from "~/hooks/useTypedRouteLoaderData";
import { getDisplayName } from "~/utils/helpers/get-display-name";

interface AuthMenuProps {
	isMobile?: boolean;
}

export const AuthMenu = ({ isMobile }: AuthMenuProps) => {
	const { authData } = useTypedRouteLoaderData("root");
	const { t } = useTranslation();

	if (!authData) {
		return null;
	}

	return (
		<MenuWrapper
			ariaLabel={t("nav.authMenu.userMenu")}
			menuChildren={[
				<div
					key="User__Info"
					className="flex flex-col items-center p-2 rounded-lg "
				>
					<span className="typography-bold">{getDisplayName(authData)}</span>
					<span className="text-sm typography-light">{authData.email}</span>
				</div>,
				...(authData.role === Role.ADMIN
					? [
							<NavigationLink
								key="Admin__Dashboard__Link"
								buttonClassName="flex-1"
								to="/admin"
							>
								{t("nav.authMenu.adminDashboard")}
							</NavigationLink>,
					  ]
					: []),
				...(authData?.isVerified
					? [
							<NavigationLink
								key="My_Recipes_Link"
								buttonClassName="flex-1"
								to={`/users/${authData?.id}`}
							>
								{t("nav.authMenu.myRecipes")}
							</NavigationLink>,
					  ]
					: []),
				<NavigationLink
					key="Settings__Link"
					buttonClassName="flex-1"
					to="/settings"
				>
					{t("nav.authMenu.settings")}
				</NavigationLink>,
				<NavigationLink
					key="Logout__Link"
					buttonClassName="flex-1"
					to="/logout"
					variant="danger"
				>
					{t("nav.authMenu.logout")}
				</NavigationLink>,
			]}
			x="right"
			y={isMobile ? "top" : "bottom"}
		>
			<Avatar
				className="cursor-pointer"
				layout="fixed"
				size="32"
				user={authData}
				variant="circle"
			/>
		</MenuWrapper>
	);
};
