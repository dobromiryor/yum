import clsx from "clsx";

type IconSize = "14" | "16" | "20" | "36";

interface IconProps {
	name: string;
	label?: string;
	className?: string;
	size?: IconSize;
}

export const Icon = ({ name, label, className, size = "14" }: IconProps) => {
	const sizeStyles = {
		"14": "text-sm leading-[14px]",
		"16": "text-base leading-4",
		"20": "text-xl leading-5",
		"36": "text-4xl leading-9",
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
			>
				{name}
			</span>
		</div>
	);
};
