export const debounce = (fn: Function, ms = 1000) => {
	let timeoutId: NodeJS.Timeout | null;

	return function (this: unknown, ...args: unknown[]) {
		const effect = () => {
			timeoutId = null;

			return fn.apply(this, args);
		};

		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(effect, ms);
	};
};
