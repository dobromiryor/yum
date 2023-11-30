import clsx from "clsx";
import { type ReactNode } from "react";

import { TooltipWrapper } from "~/components/common/Tooltip";
import { Icon } from "~/components/common/UI/Icon";

interface CardPillProps {
	icon?: string;
	label?: ReactNode | string | number | null;
	tooltip?: string;
}

export const Pill = ({ icon, label, tooltip }: CardPillProps) => {
	if (!label && !icon) {
		return null;
	}

	return (
		<TooltipWrapper content={tooltip}>
			<div
				className={clsx(
					"flex justify-center items-center gap-1.5 p-1.5 bg-light dark:bg-dark text-xs leading-[14px] h-min transition-colors select-none",
					icon && !label ? "rounded-full" : "rounded-xl"
				)}
			>
				{icon && <Icon label={tooltip} name={icon} />}
				{label && <span className="typography-normal">{label}</span>}
			</div>
		</TooltipWrapper>
	);
};
