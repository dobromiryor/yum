import { useNavigation } from "@remix-run/react";
import { useEffect, type Dispatch, type SetStateAction } from "react";

export const useSlowUpload = ({
	setIsUploadSlow,
}: {
	setIsUploadSlow: Dispatch<SetStateAction<boolean>>;
}) => {
	const { state, formMethod } = useNavigation();

	useEffect(() => {
		if (state === "submitting" && formMethod === "POST") {
			const timer = setTimeout(() => setIsUploadSlow(true), 5000);

			return () => clearTimeout(timer);
		}

		if (state === "idle") {
			setIsUploadSlow(false);
		}
	}, [state, formMethod, setIsUploadSlow]);
};
