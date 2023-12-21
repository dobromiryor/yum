import { useNavigation } from "@remix-run/react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
	type Dispatch,
	type MouseEvent,
	type ReactNode,
	type SetStateAction,
} from "react";

interface TooltipProviderProps {
	children: ReactNode;
}
interface TooltipWrapperProps {
	className?: string;
	children: ReactNode;
	content: string | undefined;
}

type TooltipContextType = [
	{
		isShowing: boolean;
		content: string | null;
		rect: DOMRect;
	},
	{
		setIsShowing: Dispatch<SetStateAction<boolean>>;
		setContent: Dispatch<SetStateAction<string | null>>;
		setRect: Dispatch<SetStateAction<DOMRect>>;
	},
];

const TooltipContext = createContext<TooltipContextType | undefined>(undefined);

export const TooltipProvider = ({ children }: TooltipProviderProps) => {
	const [content, setContent] = useState<string | null>(null);
	const [isShowing, setIsShowing] = useState<boolean>(false);
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

	return (
		<TooltipContext.Provider
			value={[
				{ content, isShowing, rect },
				{ setContent, setIsShowing, setRect },
			]}
		>
			{children}
		</TooltipContext.Provider>
	);
};

const useTooltip = () => {
	const context = useContext(TooltipContext);

	if (context === undefined) {
		throw new Error("useTooltip must be used within a TooltipProvider");
	}

	return context;
};

const TOOLTIP_MARGIN = 8;

export const Tooltip = () => {
	const [translateX, setTranslateX] = useState<string | number | undefined>(
		undefined
	);
	const [translateY, setTranslateY] = useState<string | number | undefined>(
		undefined
	);

	const [{ isShowing, rect, content }, { setIsShowing }] = useTooltip();
	const { location, state } = useNavigation();

	const tooltipRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let active = true;
		let tooltipWidth = 0;
		let tooltipHeight = 0;
		let overflowPosition: "left" | "right" | null = null;

		const isOverflowing = async () => {
			if (tooltipRef.current) {
				const tooltipRect = tooltipRef.current.getBoundingClientRect();

				if (
					rect.left + rect.width + tooltipRect.width + TOOLTIP_MARGIN >
					window.innerWidth
				) {
					overflowPosition = "right";
					tooltipWidth = tooltipRect.width;
				}

				if (rect.left + rect.width - tooltipRect.width - TOOLTIP_MARGIN < 0) {
					overflowPosition = "left";
					tooltipWidth = tooltipRect.width;
				}

				if (
					rect.top + rect.height + tooltipRect.height + 2 * TOOLTIP_MARGIN >
					window.innerHeight
				) {
					tooltipHeight = tooltipRect.height;
				}
			}
		};

		const getTranslate = async () => {
			await isOverflowing();

			if (!active) {
				return;
			}

			tooltipWidth > 0
				? setTranslateX(
						overflowPosition === "left"
							? `calc(${rect.left}px)`
							: `calc(${rect.left}px + ${rect.width}px - ${tooltipWidth}px)`
				  )
				: setTranslateX(`calc(-50% + ${rect.left + rect.width / 2}px)`);
			tooltipHeight > 0
				? setTranslateY(rect.top - tooltipHeight - TOOLTIP_MARGIN)
				: setTranslateY(rect.top + rect.height + TOOLTIP_MARGIN);
		};

		getTranslate();

		return () => {
			active = false;
		};
	}, [rect]);

	/* close on resize/scroll */
	useEffect(() => {
		const hideTooltip = () => setIsShowing(false);

		window.addEventListener("resize", hideTooltip);
		window.addEventListener("scroll", hideTooltip);

		return () => {
			window.removeEventListener("resize", hideTooltip);
			window.removeEventListener("scroll", hideTooltip);
		};
	}, [setIsShowing]);

	/* close on location/state change */
	useEffect(() => {
		if (location || state !== "idle") {
			setIsShowing(false);
		}
	}, [location, setIsShowing, state]);

	return (
		<AnimatePresence initial={false}>
			{isShowing && content && (
				<motion.div
					ref={tooltipRef}
					animate={{
						opacity: 1,
						translateX,
						translateY,
					}}
					className="fixed drop-shadow-md backdrop-blur bg-primary/40 dark:bg-primary/75 backdrop-brightness-110 dark:backdrop-brightness-125 text-dark dark:text-light py-1 px-2 rounded-lg pointer-events-none z-50"
					exit={{
						opacity: 0,
						translateX,
						translateY,
					}}
					initial={{
						opacity: 0,
						translateX,
						translateY,
					}}
					style={{
						opacity: 0,
						top: 0,
						left: 0,
					}}
					transition={{
						ease: "easeInOut",
					}}
				>
					{content}
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export const TooltipWrapper = ({
	className,
	content,
	children,
}: TooltipWrapperProps) => {
	const [, { setIsShowing, setContent, setRect }] = useTooltip();

	const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
		setContent(content ?? "");
		setRect(e.currentTarget.getBoundingClientRect());
		setIsShowing(true);
	};

	const handleMouseLeave = () => {
		setIsShowing(false);
	};

	return (
		<div
			className={clsx("flex shrink", className)}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{children}
		</div>
	);
};
