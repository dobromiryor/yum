import clsx from "clsx";
import { type DetailedHTMLProps, type TextareaHTMLAttributes } from "react";
import { useRemixFormContext } from "remix-hook-form";

import { Error } from "~/components/common/UI/Error";
import { Label } from "~/components/common/UI/Label";
import { TranslationHelper } from "~/components/recipes/crud/TranslationHelper";

interface TextAreaProps
	extends DetailedHTMLProps<
		TextareaHTMLAttributes<HTMLTextAreaElement>,
		HTMLTextAreaElement
	> {
	isRequired?: boolean;
	label: string;
	name: string;
	translationContent?: string | null;
	translationValidation?: boolean;
}

export const Textarea = ({
	className,
	isRequired = false,
	label,
	name,
	translationContent,
	translationValidation,
	...rest
}: TextAreaProps) => {
	const {
		register,
		formState: { errors },
	} = useRemixFormContext();

	return (
		<div className="flex flex-col gap-2">
			<TranslationHelper content={translationContent}>
				<Label isRequired={isRequired} label={label} name={name} />
			</TranslationHelper>
			<textarea
				className={clsx(
					"bg-light dark:bg-dark text-dark dark:text-light border px-2 py-1 rounded transition-colors w-full min-h-9 max-h-32 outline-offset-[-1px]",
					errors[name]?.message || translationValidation === false
						? "border-red-700"
						: "border-secondary dark:border-primary",
					className
				)}
				required={isRequired}
				{...rest}
				{...register(name)}
			/>
			<Error name={name} translationValidation={translationValidation} />
		</div>
	);
};
