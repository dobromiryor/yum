import { useEffect, useState } from "react";

/**
 * Hook that can be used to time out a state change. Useful for animations and transitions.
 *
 * @param condition State change condition that initiates the timeout.
 * @param {number} [timer = 1000] Time out duration in ms. By default is set to 1000.
 * @returns {boolean} Timed out boolean state.
 */

export const useTransitionState = <T>(condition: T, timer = 1000) => {
	const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

	useEffect(() => {
		if (condition) {
			setIsTransitioning(true);
			const timeout = setTimeout(() => setIsTransitioning(false), timer);

			return () => {
				setIsTransitioning(false);

				return clearTimeout(timeout);
			};
		} else {
			setIsTransitioning(false);
		}
	}, [condition, timer]);

	return isTransitioning;
};
