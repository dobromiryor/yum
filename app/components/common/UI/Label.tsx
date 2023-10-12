interface LabelProps {
	name: string;
	label?: string;
	isRequired?: boolean;
}

export const Label = (props: LabelProps) => {
	const { label, name, isRequired = false } = props;

	if (!label) {
		return null;
	}

	return (
		<label className="font-semibold" htmlFor={name}>
			{label}
			{isRequired && <span className="font-normal text-red-500">{" *"}</span>}
		</label>
	);
};
