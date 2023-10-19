import clsx from "clsx";

type IconSize = "small" | "medium" | "large" | "custom";
type IconGrade = "-25" | "0" | "200";
type IconWeight = "400" | "500" | "600";

interface IconProps {
	icon: string;
	label?: string;
	className?: string;
	size?: IconSize;
	grade?: IconGrade;
	weight?: IconWeight;
}

export const Icon = ({
	icon,
	label,
	className,
	size = "medium",
	grade = "-25",
	weight = "400",
}: IconProps) => {
	const sizeStyles = {
		small: "text-sm leading-[14px]",
		medium: "text-base leading-4",
		large: "text-lg leading-[18px]",
		custom: "",
	};

	return (
		<div
			aria-hidden={!label}
			aria-label={label}
			className="flex justify-center items-center"
		>
			<span
				aria-hidden
				className={clsx(
					sizeStyles[size],
					"material-symbols-rounded select-none",
					className
				)}
				style={{
					fontVariationSettings: `'FILL' 0,'wght' ${weight},'GRAD' ${grade},'opsz' 48`,
				}}
			>
				{icon}
			</span>
		</div>
	);
};
