import { useSubmit, type SubmitOptions } from "@remix-run/react";
import { type FieldValues } from "react-hook-form";
import { createFormData } from "remix-hook-form";

interface UseFilteredValues {
	submitOptions?: SubmitOptions;
}

export const useFilteredValues = <T extends FieldValues>(
	props?: UseFilteredValues
) => {
	const submit = useSubmit();

	const filterUndefined = (data: T) => {
		return Object.fromEntries(
			Object.entries(data).filter(([, value]) => typeof value !== "undefined")
		);
	};

	const onValid = (data: T) => {
		const noUndefined = filterUndefined(data);

		submit(
			createFormData<Partial<FormData>>(noUndefined),
			props?.submitOptions ?? { method: "POST" }
		);
	};

	return { onValid, filterUndefined };
};
