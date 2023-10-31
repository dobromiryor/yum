import clsx from "clsx";
import { type KeyboardEvent } from "react";

import { Label, type LabelWeight } from "~/components/common/UI/Label";

type SwitchVariant = "primary" | "secondary";

interface SwitchProps {
	className?: string;
	isDisabled?: boolean;
	isLoading?: boolean;
	label?: string;
	labelPosition?: "hidden" | "top" | "left";
	labelWeight?: LabelWeight;
	name: string;
	offLabel?: string;
	onChange?: (value: boolean) => void;
	onLabel?: string;
	value?: boolean;
	variant?: SwitchVariant;
}

export const Switch = ({
	className,
	isDisabled = false,
	isLoading = false,
	label,
	labelPosition = label ? "top" : "hidden",
	labelWeight,
	name,
	offLabel,
	onChange,
	onLabel,
	value,
	variant = "primary",
}: SwitchProps) => {
	const trackVariantStyles = {
		primary: "bg-secondary dark:bg-primary",
		secondary: "bg-primary dark:bg-secondary",
	};
	const thumbVariantStyles = {
		primary: "bg-primary dark:bg-secondary",
		secondary: "bg-secondary dark:bg-primary",
	};

	const handleChange = (value: boolean) => {
		if (!isDisabled) {
			onChange && onChange(value);
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === " " || e.key === "Enter") {
			e.preventDefault();
			handleChange(!value);
		}
	};

	const renderSwitch = () => (
		<div>
			<input
				hidden
				checked={value}
				disabled={isDisabled}
				name={name}
				tabIndex={-1}
				type="checkbox"
				onChange={(e) => handleChange(e.target.checked)}
			/>
			<div
				aria-checked={value}
				aria-label={labelPosition === "hidden" ? label : undefined}
				className={clsx(
					trackVariantStyles[variant],
					"relative h-6 w-12 rounded-full cursor-pointer transition-colors duration-500",
					isDisabled
						? "opacity-50 pointer-events-none"
						: "opacity-100  pointer-events-auto",
					isLoading && "animate-pulse",
					className
				)}
				role="switch"
				tabIndex={isDisabled ? -1 : 0}
				onClick={() => handleChange(!value)}
				onKeyDown={handleKeyDown}
			>
				<div
					aria-hidden
					className={clsx(
						thumbVariantStyles[variant],
						"absolute w-5 h-5 m-0.5 rounded-full transition-all duration-500",
						value ? "translate-x-6" : "translate-x-0"
					)}
				/>
			</div>
		</div>
	);

	return (
		<div
			className={clsx(
				"flex gap-2 flex-wrap",
				labelPosition === "top"
					? "flex-col"
					: labelPosition === "left"
					? "flex-row"
					: null
			)}
		>
			{labelPosition !== "hidden" && (
				<Label label={label} name={name} weight={labelWeight} />
			)}
			{offLabel && onLabel ? (
				<div className="flex items-center gap-2">
					<span aria-label={`${offLabel} ${onLabel}`}>{offLabel}</span>
					{renderSwitch()}
					<span aria-hidden>{onLabel}</span>
				</div>
			) : (
				renderSwitch()
			)}
		</div>
	);
};
