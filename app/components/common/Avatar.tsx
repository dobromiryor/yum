import { type User } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { AvatarColor, AvatarShade } from "~/enums/avatar.enum";
import { type loader } from "~/root";

interface AvatarProps {
	size?: "fixed" | "fill";
	variant?: "square" | "circle";
	user?: SerializeFrom<User>;
}

export const Avatar = ({
	size = "fixed",
	variant = "circle",
	user,
}: AvatarProps) => {
	const { authData } = useLoaderData<typeof loader>();
	const { t } = useTranslation();

	const sizeStyles = {
		fixed: "w-8 h-8 text-sm",
		fill: "w-full h-full text-4xl aspect-square",
	};

	const variantStyles = {
		square: "rounded-none",
		circle: "rounded-full",
	};

	const getInitials = (user: SerializeFrom<User> | null) => {
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

	const getAvatarColors = (user: SerializeFrom<User> | null) => {
		if (!user) {
			return {
				background: "bg-neutral-500",
				text: "text-neutral-100",
			};
		}

		const { createdAt: created } = user;
		const createdAt = new Date(created);

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
			aria-label={t("settings.field.avatar")}
			className={clsx(
				"flex justify-center items-center shadow-md select-none",
				sizeStyles[size],
				variantStyles[variant],
				getAvatarColors(user ?? authData).background
			)}
		>
			<span
				aria-hidden
				className={clsx(
					"typography-bold",
					getAvatarColors(user ?? authData).text
				)}
			>
				{getInitials(user ?? authData)}
			</span>
		</div>
	);
};
