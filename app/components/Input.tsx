import { type DetailedHTMLProps, type InputHTMLAttributes } from "react";

interface InputType
	extends DetailedHTMLProps<
		InputHTMLAttributes<HTMLInputElement>,
		HTMLInputElement
	> {
	name: string;
	label?: string;
}

export const Input = (props: InputType) => {
	const { name, label, ...rest } = props;

	return (
		<div className="flex flex-col items-start gap-2">
			{!!label && <label htmlFor={name}>{label}</label>}
			<input
				className="border border-red-500 rounded-sm focus:outline-offset-1"
				name={name}
				{...rest}
			/>
		</div>
	);
};
