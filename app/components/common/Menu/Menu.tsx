import { useNavigation } from "@remix-run/react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
	Children,
	cloneElement,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type Dispatch,
	type FocusEvent,
	type KeyboardEvent,
	type MouseEvent,
	type ReactElement,
	type ReactNode,
	type RefObject,
	type SetStateAction,
} from "react";

type PositionX = "left" | "center" | "right";
type PositionY = "top" | "bottom";

type MenuContextType = [
	{
		isOpen: boolean;
		children: ReactNode[] | null;
		rect: DOMRect;
		positionX: PositionX;
		positionY: PositionY;
		menuRef: RefObject<HTMLElement | null>;
		buttonRef: RefObject<HTMLButtonElement | null>;
	},
	{
		setIsOpen: Dispatch<SetStateAction<boolean>>;
		setChildren: Dispatch<SetStateAction<ReactNode[] | null>>;
		setRect: Dispatch<SetStateAction<DOMRect>>;
		setPositionX: Dispatch<SetStateAction<PositionX>>;
		setPositionY: Dispatch<SetStateAction<PositionY>>;
		setButtonRef: Dispatch<RefObject<HTMLButtonElement>>;
	},
];

interface MenuWrapperProps {
	children?: ReactNode;
	customButton?: ReactNode;
	menuChildren: ReactNode[];
	x?: PositionX;
	y?: PositionY;
	className?: string;
	ariaLabel?: string;
}
interface MenuWrapperWithCustomButtonProps {
	children?: ReactNode;
	customButton: ReactNode;
	menuChildren: ReactNode[];
	x?: PositionX;
	y?: PositionY;
	className?: string;
	ariaLabel: string;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider = ({ children }: { children: ReactNode }) => {
	const menuRef = useRef<HTMLElement>(null);
	const bRef = useRef<HTMLButtonElement>(null);

	const [buttonRef, setButtonRef] =
		useState<RefObject<HTMLButtonElement>>(bRef);
	const [menuChildren, setChildren] = useState<ReactNode[] | null>(null);
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [rect, setRect] = useState<DOMRect>({
		bottom: 0,
		height: 0,
		left: 0,
		right: 0,
		top: 0,
		width: 0,
		x: 0,
		y: 0,
		toJSON: () => undefined,
	});
	const [positionX, setPositionX] = useState<PositionX>("center");
	const [positionY, setPositionY] = useState<PositionY>("bottom");

	return (
		<MenuContext.Provider
			value={[
				{
					children: menuChildren,
					isOpen,
					rect,
					positionX,
					positionY,
					menuRef,
					buttonRef,
				},
				{
					setChildren,
					setIsOpen,
					setRect,
					setPositionX,
					setPositionY,
					setButtonRef,
				},
			]}
		>
			{children}
		</MenuContext.Provider>
	);
};

export const useMenu = () => {
	const context = useContext(MenuContext);

	if (context === undefined) {
		throw new Error("useMenu must be used within a MenuProvider");
	}

	return context;
};

const MENU_MARGIN = 8;

export const Menu = () => {
	const { location, state } = useNavigation();
	const [
		{ children, isOpen, rect, positionX, positionY, menuRef, buttonRef },
		{ setIsOpen },
	] = useMenu();

	const firstMenuItemRef = useRef<HTMLDivElement>(null);

	const sharedMenuStyles = useMemo(
		() => ({
			...(positionY === "bottom"
				? { top: rect.top + rect.height + MENU_MARGIN }
				: {
						top: rect.top - rect.height / 2 + MENU_MARGIN,
						translateY: "-100%",
				  }),
			...(positionX === "left"
				? { left: 8 }
				: positionX === "right"
				  ? { left: rect.left + rect.width, translateX: "-100%" }
				  : {
							left: rect.left + rect.width / 2,
							translateX: "-50%",
				    }),
		}),
		[positionX, positionY, rect]
	);

	const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
		const target = e.relatedTarget as Node;

		if (menuRef.current && !menuRef.current.contains(target)) {
			setIsOpen(false);
		}
	};

	const renderChildren = useCallback(() => {
		if (!children || children.length === 0) {
			return null;
		}

		return Children.map(children, (child, index) => {
			const clonedElement = cloneElement(child as ReactElement, {
				role: "menuitem",
				tabIndex: 0,
				ref: index === 0 ? firstMenuItemRef : null,
			});

			return clonedElement;
		});
	}, [children]);

	/* close on Escape and focus on last buttonRef */
	useEffect(() => {
		if (isOpen && menuRef.current) {
			const menu = menuRef.current;
			const close = (e: globalThis.KeyboardEvent) => {
				if (e.target instanceof Node) {
					if (menu.contains(e.target)) {
						if (e.code === "Escape") {
							setIsOpen(false);
							buttonRef.current?.focus();
						}
					}
				}
			};

			menu.addEventListener("keydown", close);

			return () => menu.removeEventListener("keydown", close);
		}
	}, [buttonRef, isOpen, menuRef, setIsOpen]);

	/* close on resize/scroll */
	useEffect(() => {
		const closeOnResize = () => setIsOpen(false);

		window.addEventListener("resize", closeOnResize);
		window.addEventListener("scroll", closeOnResize);

		return () => {
			window.removeEventListener("resize", closeOnResize);
			window.removeEventListener("scroll", closeOnResize);
		};
	}, [setIsOpen]);

	/* close on location/state change */
	useEffect(() => {
		if (location || state !== "idle") {
			setIsOpen(false);
		}
	}, [location, setIsOpen, state]);

	/* focus first child */
	useEffect(() => {
		if (isOpen && firstMenuItemRef.current) {
			firstMenuItemRef.current.focus();
		}
	}, [isOpen]);

	if (!children?.length) {
		return null;
	}

	return (
		<AnimatePresence initial={false}>
			{isOpen && (
				<motion.div
					ref={menuRef as RefObject<HTMLDivElement>}
					animate={{
						opacity: 1,
						translateY: 0,
						...sharedMenuStyles,
					}}
					className="fixed flex flex-col gap-2 p-2 rounded-lg drop-shadow-md backdrop-blur bg-primary/40 dark:bg-primary/75 backdrop-brightness-110 dark:backdrop-brightness-125 z-50"
					exit={{
						opacity: 0,
						translateY: 4,
						...sharedMenuStyles,
					}}
					initial={{
						opacity: 0,
						translateY: 4,
						...sharedMenuStyles,
					}}
					role="menu"
					onBlur={handleBlur}
				>
					{renderChildren()}
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export const MenuWrapper = ({
	menuChildren,
	customButton,
	children,
	x = "center",
	y = "bottom",
	className,
	ariaLabel,
}: MenuWrapperProps | MenuWrapperWithCustomButtonProps) => {
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [
		{ isOpen, menuRef },
		{
			setIsOpen,
			setChildren,
			setRect,
			setPositionX,
			setPositionY,
			setButtonRef,
		},
	] = useMenu();

	const open = useCallback(
		(e: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>) => {
			if (!isOpen && !menuRef.current) {
				setChildren(menuChildren);
				setRect(e.currentTarget.getBoundingClientRect());
				setIsOpen(true);
				setPositionX(x);
				setPositionY(y);
				setButtonRef(buttonRef);
			}
		},
		[
			isOpen,
			menuRef,
			setChildren,
			menuChildren,
			setRect,
			setIsOpen,
			setPositionX,
			x,
			setPositionY,
			y,
			setButtonRef,
		]
	);

	const close = useCallback(() => {
		if (isOpen) {
			setIsOpen(false);
		}
	}, [isOpen, setIsOpen]);

	const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();

		if (!isOpen) {
			open(e);
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
		switch (e.key) {
			case "Escape":
				close();
				break;
		}
	};

	if (!customButton && !children) {
		return null;
	}

	return !!customButton && !children ? (
		cloneElement(customButton as ReactElement, {
			ref: buttonRef as RefObject<HTMLAnchorElement | HTMLButtonElement>,
			"aria-haspopup": true,
			"aria-label": { ariaLabel },
			className: clsx("relative", className),
			onClick: handleClick,
			onKeyDown: handleKeyDown,
		})
	) : (
		<button
			ref={buttonRef as RefObject<HTMLButtonElement>}
			aria-haspopup
			aria-label={ariaLabel}
			className={clsx("relative rounded-full", className)}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
		>
			{children}
		</button>
	);
};
