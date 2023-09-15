import {
	useCallback,
	useEffect,
	type Dispatch,
	type RefObject,
	type SetStateAction,
} from "react";

/**
 * Hook that can be used to detect when the user clicks outside of a component or presses the Escape key.
 *
 * @param buttonRef Reference to the DOM element that opens the menu.
 * @param menuRef Reference to the DOM element that should be used to detect user interaction.
 * @param isOpen State value.
 * @param setIsOpen Update state function.
 * @param options Options object used to enable/disable event types. Both enabled by default.
 * @param [options.click = true] Boolean flag to enable click events. Enabled by default.
 * @param [options.key = true] Boolean flag to enable keyboard events. Enabled by default.
 */

export const useClose = (
	buttonRef: RefObject<HTMLElement>,
	ref: RefObject<HTMLElement>,
	isOpen: boolean,
	setIsOpen: Dispatch<SetStateAction<boolean>>,
	{
		click,
		key,
	}: {
		click?: boolean;
		key?: boolean;
	} = {
		click: true,
		key: true,
	}
) => {
	const handleClickOutside = useCallback(
		(event: MouseEvent) => {
			if (
				ref.current &&
				buttonRef.current &&
				!ref.current.contains(event.target as Node) &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		},
		[buttonRef, ref, setIsOpen]
	);

	const handleEscape = useCallback(
		(event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsOpen(false);
			}
		},
		[setIsOpen]
	);

	useEffect(() => {
		if (click) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		if (key) {
			document.addEventListener("keydown", handleEscape);
		}

		return () => {
			if (click) {
				document.removeEventListener("mousedown", handleClickOutside);
			}

			if (key) {
				document.removeEventListener("keydown", handleEscape);
			}
		};
	}, [isOpen, click, handleClickOutside, handleEscape, key]);
};
