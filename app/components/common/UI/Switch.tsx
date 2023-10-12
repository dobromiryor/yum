import clsx from "clsx";
import { type KeyboardEvent } from "react";

import { Label } from "~/components/common/UI/Label";

interface SwitchProps {
	className?: string;
	isDisabled?: boolean;
	label?: string;
	labelPosition?: "hidden" | "top" | "left";
	name: string;
	onChange?: (value: boolean) => void;
	value?: boolean;
}

export const Switch = ({
	className,
	isDisabled = false,
	label,
	labelPosition = "top",
	name,
	onChange,
	value,
}: SwitchProps) => {
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

	return (
		<div
			className={clsx(
				"flex gap-2",
				labelPosition === "top"
					? "flex-col"
					: labelPosition === "left"
					? "flex-row"
					: null
			)}
		>
			{labelPosition !== "hidden" && <Label label={label} name={name} />}
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
						"relative h-6 w-12 rounded-full cursor-pointer outline-offset-[-1px] transition-colors duration-500",
						"bg-secondary",
						"dark:bg-primary",
						isDisabled
							? "opacity-50 pointer-events-none"
							: "opacity-100  pointer-events-auto",
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
							"absolute w-5 h-5 m-0.5 rounded-full transition-all duration-500",
							"bg-primary",
							"dark:bg-secondary",
							value ? "translate-x-6" : "translate-x-0"
						)}
					/>
				</div>
			</div>
		</div>
	);
};
