import { type User } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";
import clsx from "clsx";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Image } from "~/components/common/UI/Image";
import { AvatarColor, AvatarShade } from "~/enums/avatar.enum";
import { CloudinaryUploadApiResponseWithBlurHashSchema } from "~/schemas/cloudinary.schema";

interface AvatarProps {
	layout?: "fixed" | "fill";
	size?: "initial" | "20" | "32";
	variant?: "square" | "circle";
	user: SerializeFrom<User>;
	className?: string;
}

export const Avatar = ({
	size = "initial",
	layout = "fixed",
	variant = "circle",
	user,
	className,
}: AvatarProps) => {
	const { t } = useTranslation();

	const p = user?.photo;
	const photo =
		CloudinaryUploadApiResponseWithBlurHashSchema.nullable().parse(p);

	const sizeStyles = {
		initial: "",
		"20": "w-5 h-5 text-xs",
		"32": "w-8 h-8",
	};

	const layoutStyles = useMemo(
		() => ({
			fixed: "aspect-square text-sm",
			fill: "min-w-full min-h-full text-4xl aspect-square",
		}),
		[]
	);

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

	// TODO: Tooltip?
	return photo ? (
		<Image
			className={clsx(
				"overflow-hidden select-none",
				sizeStyles[size],
				layoutStyles[layout],
				variantStyles[variant],
				className
			)}
			photo={photo}
			transformation={layout === "fill" ? "lgAvatar" : "smAvatar"}
		/>
	) : (
		<div
			aria-label={t("settings.field.avatar")}
			className={clsx(
				"flex justify-center items-center select-none overflow-hidden",
				sizeStyles[size],
				layoutStyles[layout],
				variantStyles[variant],
				getAvatarColors(user).background,
				className
			)}
		>
			<span
				aria-hidden
				className={clsx("typography-bold", getAvatarColors(user).text)}
			>
				{getInitials(user)}
			</span>
		</div>
	);
};
