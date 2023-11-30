import clsx from "clsx";

export type LabelWeight = "normal" | "medium";

interface LabelProps {
	name: string;
	label?: string;
	isRequired?: boolean;
	weight?: LabelWeight;
}

export const Label = ({
	label,
	name,
	isRequired = false,
	weight = "medium",
}: LabelProps) => {
	if (!label) {
		return null;
	}

	const weightStyles = {
		normal: "typography-normal",
		medium: "typography-medium",
	};

	return (
		<label className={clsx(weightStyles[weight])} htmlFor={name}>
			{label}
			{isRequired && (
				<span className="typography-normal text-red-500">{" *"}</span>
			)}
		</label>
	);
};
