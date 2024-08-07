import clsx from "clsx";
import { type DetailedHTMLProps, type InputHTMLAttributes } from "react";
import { useRemixFormContext } from "remix-hook-form";

import { Error } from "~/components/common/UI/Error";
import { Label } from "~/components/common/UI/Label";
import { TranslationHelper } from "~/components/recipes/crud/TranslationHelper";

interface InputProps
	extends DetailedHTMLProps<
		InputHTMLAttributes<HTMLInputElement>,
		HTMLInputElement
	> {
	isRequired?: boolean;
	label: string;
	name: string;
	translationContent?: string | null;
	translationValidation?: boolean;
	explanation?: string;
	explanationIcon?: string;
}

export const Input = ({
	className,
	isRequired = false,
	label,
	name,
	type,
	translationContent,
	translationValidation,
	explanation,
	explanationIcon,
	...rest
}: InputProps) => {
	const {
		register,
		formState: { errors },
	} = useRemixFormContext();

	return (
		<div className="flex flex-col gap-2">
			<TranslationHelper content={translationContent}>
				<Label
					explanation={explanation}
					explanationIcon={explanationIcon}
					isRequired={isRequired}
					label={label}
					name={name}
				/>
			</TranslationHelper>
			<input
				aria-labelledby={`${name}-${label}`}
				className={clsx(
					"bg-light dark:bg-dark text-dark dark:text-light border px-2 py-1 rounded transition-colors w-full",
					errors[name]?.message || translationValidation === false
						? "border-red-700"
						: "border-secondary dark:border-primary",
					className
				)}
				required={isRequired}
				type={type}
				{...rest}
				{...register(name, {
					...(type === "number" && { valueAsNumber: true }),
				})}
			/>
			<Error name={name} translationValidation={translationValidation} />
		</div>
	);
};
