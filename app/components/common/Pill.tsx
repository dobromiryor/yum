import clsx from "clsx";
import { type ReactNode } from "react";

import { TooltipWrapper } from "~/components/common/Tooltip";
import { Icon } from "~/components/common/UI/Icon";

interface CardPillProps {
	icon?: string;
	label?: ReactNode | string | number | null;
	tooltip?: string;
	padding?: "none" | "default";
	variant?: "normal" | "error";
}

export const Pill = ({
	icon,
	label,
	tooltip,
	padding = "default",
	variant = "normal",
}: CardPillProps) => {
	if (!label && !icon) {
		return null;
	}

	const paddingStyles = {
		default: "p-1.5",
		none: "",
	};

	const variantStyles = {
		normal: "bg-light dark:bg-dark",
		error: "bg-red-700 text-light",
	};

	return (
		<TooltipWrapper content={tooltip}>
			<div
				className={clsx(
					"flex justify-center items-center gap-1.5 text-xs leading-[14px] h-min transition-colors select-none",
					paddingStyles[padding],
					variantStyles[variant],
					icon && !label ? "rounded-full" : "rounded-xl"
				)}
			>
				{icon && <Icon label={tooltip} name={icon} />}
				{label && <span className="typography-normal">{label}</span>}
			</div>
		</TooltipWrapper>
	);
};
