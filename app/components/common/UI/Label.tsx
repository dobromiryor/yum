import clsx from "clsx";

import { TooltipWrapper } from "~/components/common/Tooltip";
import { Icon } from "~/components/common/UI/Icon";

export type LabelWeight = "normal" | "medium";

interface LabelProps {
	name: string;
	label?: string;
	isRequired?: boolean;
	weight?: LabelWeight;
	explanation?: string;
	explanationIcon?: string;
}

export const Label = ({
	label,
	name,
	isRequired = false,
	weight = "medium",
	explanation,
	explanationIcon = "help",
}: LabelProps) => {
	if (!label) {
		return null;
	}

	const weightStyles = {
		normal: "typography-normal",
		medium: "typography-medium",
	};

	return (
		<label
			className={clsx("inline-flex items-center gap-1", weightStyles[weight])}
			htmlFor={name}
		>
			{label}
			{isRequired && (
				<span className="typography-normal text-red-500">{"*"}</span>
			)}
			{explanation && (
				<TooltipWrapper content={explanation}>
					<Icon name={explanationIcon} size="16" />
				</TooltipWrapper>
			)}
		</label>
	);
};
