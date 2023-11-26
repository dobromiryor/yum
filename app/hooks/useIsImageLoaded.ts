import { useEffect, useState, type RefObject } from "react";

export const useIsImageLoaded = (imageRef: RefObject<HTMLImageElement>) => {
	const [isLoaded, setIsLoaded] = useState<boolean>(false);

	useEffect(() => {
		if (imageRef.current) {
			if (imageRef.current.complete) {
				setIsLoaded(true);
			}

			imageRef.current.onload = () => setIsLoaded(true);
		}
	}, [imageRef]);

	return isLoaded;
};
