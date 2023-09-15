import { type User } from "@prisma/client";
import { json, type LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { AvatarColor, AvatarShade } from "~/enums/avatar.enum";
import { useAuth } from "~/utils/auth";
import { auth } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderArgs) => {
	const authData = await auth.isAuthenticated(request);

	return json({ authData });
};

export const Avatar = () => {
	const { authData } = useLoaderData<typeof loader>();
	const { user } = useAuth(authData);
	const { t } = useTranslation();

	const getInitials = (user: User | null) => {
		if (!user) {
			return "?";
		}

		const { firstName, lastName, username, email } = user;

		if (username) {
			return username[0].toUpperCase();
		}

		if (firstName && lastName) {
			return firstName[0].toUpperCase() + lastName[0].toUpperCase();
		}

		return email.split("@")[0][0].toUpperCase();
	};

	const getAvatarColors = (user: User | null) => {
		if (!user) {
			return {
				background: "bg-neutral-500",
				text: "text-neutral-100",
			};
		}

		const { createdAt } = user;

		const colorValues = Object.values(AvatarColor);
		const weekDay = createdAt.getDay() + 1;
		const month = createdAt.getMonth() + 1;

		// <number of colors> - <days in a week> * <month % 3> - <day of the week>
		const colorKey = colorValues.length - ((7 * month) % 3) - weekDay;

		const shadeValues = Object.values(AvatarShade);
		const hour = createdAt.getHours();

		// <number of shades> - <hour> % <number of shades>
		const shadeKey = shadeValues.length - (hour % shadeValues.length);

		const color = colorValues[colorKey - 1];
		const shade = shadeValues[shadeKey - 1];

		return {
			text: `text-${color}-100`,
			background: `bg-${color}-${shade}`,
		};
	};

	return (
		// TODO: Tooltip?
		<div
			aria-label={t("common.labels.avatar")}
			className={clsx(
				"flex justify-center items-center w-8 h-8 rounded-full shadow-md select-none",
				getAvatarColors(user).background
			)}
		>
			<span
				aria-hidden
				className={clsx("text-sm font-medium", getAvatarColors(user).text)}
			>
				{getInitials(user)}
			</span>
		</div>
	);
};
