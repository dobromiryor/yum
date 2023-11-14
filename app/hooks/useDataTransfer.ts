import { useEffect, type RefObject } from "react";

export const useDataTransfer = ({
	acceptedFiles,
	inputRef,
}: {
	acceptedFiles: File[];
	inputRef: RefObject<HTMLInputElement>;
}) => {
	useEffect(() => {
		if (inputRef.current) {
			const dataTransfer = new DataTransfer();

			acceptedFiles.forEach((file) => {
				dataTransfer.items.add(file);
			});

			inputRef.current.files = dataTransfer.files;

			// Help Safari out
			if (inputRef.current.webkitEntries.length) {
				inputRef.current.dataset.file = `${dataTransfer.files[0].name}`;
			}
		}
	}, [acceptedFiles, inputRef]);
};
