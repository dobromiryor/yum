import { AnimatePresence, motion } from "framer-motion";
import {
	createContext,
	useContext,
	useMemo,
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
	const [{ isShowing, rect, content }] = useTooltip();

	const sharedStyles = useMemo(
		() => ({
			top: rect.top + rect.height + TOOLTIP_MARGIN,
			left: rect.left + rect.width / 2,
			translateX: "-50%",
		}),
		[rect]
	);

	return (
		<AnimatePresence initial={false}>
			{isShowing && content && (
				<motion.div
					animate={{
						opacity: 1,
						translateY: 0,
						...sharedStyles,
					}}
					className="fixed drop-shadow-md backdrop-blur bg-primary/40 dark:bg-primary/75 backdrop-brightness-110 dark:backdrop-brightness-125 text-dark dark:text-light py-1 px-2 rounded-lg pointer-events-none"
					exit={{
						opacity: 0,
						translateY: 4,
						...sharedStyles,
					}}
					initial={{
						opacity: 0,
						translateY: 4,
						...sharedStyles,
					}}
				>
					{content}
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export const TooltipWrapper = ({ content, children }: TooltipWrapperProps) => {
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
			className="relative"
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{children}
		</div>
	);
};
