import { type User } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";
import clsx from "clsx";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Image } from "~/components/common/UI/Image";
import { CloudinaryUploadApiResponseWithBlurHashSchema } from "~/schemas/cloudinary.schema";

type UserType = Pick<
	SerializeFrom<User>,
	"email" | "firstName" | "lastName" | "username" | "photo" | "id"
>;

const stringToHex = (str: string) => {
	const hexStr = [];

	for (const char of str) {
		const charCode = char.charCodeAt(0);
		let hex = charCode.toString(16);

		if (hex.length === 1) {
			hex = `0${hex}`;
		}

		hexStr.push(hex);
	}

	return hexStr.join("");
};

interface AvatarProps {
	layout?: "fixed" | "fill";
	size?: "initial" | "20" | "32";
	variant?: "square" | "circle";
	user: UserType | null;
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

	const photo = CloudinaryUploadApiResponseWithBlurHashSchema.nullable().parse(
		user?.photo ?? null
	);

	const sizeStyles = {
		initial: "",
		"20": "min-w-5 max-w-5 min-h-5 max-h-8 text-[10px] leading-3",
		"32": "min-w-8 max-w-8 min-h-8 max-h-8",
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

	const getInitials = (user: UserType | null) => {
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

	const getAvatarColors = (user: UserType | null) => {
		if (!user) {
			return `#737373`;
		}

		return `#${stringToHex(user.id.slice(-3))}`;
	};

	// TODO: Tooltip?
	return photo ? (
		<Image
			className={clsx(
				"overflow-hidden select-none",
				layoutStyles[layout],
				sizeStyles[size],
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
				className
			)}
			style={{ backgroundColor: getAvatarColors(user) }}
		>
			<span aria-hidden className="typography-bold text-light drop-shadow-md">
				{getInitials(user)}
			</span>
		</div>
	);
};
