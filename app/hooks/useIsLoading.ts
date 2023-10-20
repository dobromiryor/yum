import { useLocation, useNavigation } from "@remix-run/react";

interface UseIsLoadingProps {
	state?: "idle" | "loading" | "submitting";
	formAction?: string;
	additionalCondition?: boolean;
}

export const useIsLoading = (props?: UseIsLoadingProps): [boolean] => {
	const { state, formAction } = useNavigation();
	const location = useLocation();

	const { pathname } = location;

	const checkState = props?.state ? state === props?.state : state !== "idle";

	const strippedFormAction = formAction?.includes("?index")
		? formAction.replace("?index", "")
		: formAction;

	const checkAction = strippedFormAction === (props?.formAction ?? pathname);

	const checkAdditionalCondition = props?.additionalCondition ?? true;

	const result = checkState && checkAction && checkAdditionalCondition;

	return [result];
};
