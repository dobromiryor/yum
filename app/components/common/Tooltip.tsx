import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface TooltipWrapperProps {
	label: string | undefined;
	children: ReactNode;
}

export const TooltipWrapper = ({ label, children }: TooltipWrapperProps) => {
	const [x, setX] = useState<"left" | "center">("center");
	const [y, setY] = useState<"top" | "bottom">("top");
	const [isHovered, setIsHovered] = useState(false);

	const tooltipRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (tooltipRef.current) {
			const tooltipObserver = new IntersectionObserver((entries) => {
				const { isIntersecting, boundingClientRect } = entries[0];

				if (isIntersecting && boundingClientRect.x < 0) {
					setX("left");
				} else {
					setX("center");
				}

				if (isIntersecting && boundingClientRect.y < 64) {
					setY("bottom");
				} else {
					setY("top");
				}
			});

			tooltipObserver.observe(tooltipRef.current);

			return () => tooltipObserver.disconnect();
		}
	}, [tooltipRef]);

	const tooltipYStyles = {
		top: "bottom-[calc(100%+10px)]",
		bottom: "top-[calc(100%+10px)]",
	};

	const arrowYStyles = {
		top: "border-l-8 border-r-8 border-t-8 border-x-transparent border-t-light dark:border-t-dark",
		bottom:
			"border-l-8 border-r-8 border-b-8 border-x-transparent border-b-light dark:border-b-dark",
	};

	return label ? (
		<div
			className="relative"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{children}
			<AnimatePresence initial={false}>
				<motion.div
					key="Tooltip"
					ref={tooltipRef}
					animate={
						isHovered
							? {
									opacity: 1,
									translateY: 0,
									display: "block",
									visibility: "visible",
							  }
							: {
									opacity: 0,
									translateY: y === "bottom" ? "4px" : "-4px",
									transitionEnd: { display: "none", visibility: "hidden" },
							  }
					}
					className={clsx(
						"px-2 py-1 rounded shadow-lg bg-light dark:bg-dark z-40",
						"absolute select-none",
						tooltipYStyles[y]
					)}
					role="tooltip"
					style={{
						left: x === "center" ? "50%" : 0,
						translateX: x === "center" ? "-50%" : 0,
					}}
					transition={{ duration: 0.1 }}
				>
					{label}
				</motion.div>
				<motion.div
					/* arrow */
					key="Tooltip__Arrow"
					animate={
						isHovered
							? {
									opacity: 1,
									translateY: 0,
									display: "block",
									visibility: "visible",
							  }
							: {
									opacity: 0,
									translateY: y === "bottom" ? "4px" : "-4px",
									transitionEnd: { display: "none", visibility: "hidden" },
							  }
					}
					className={clsx(
						"absolute w-0 h-0 z-40",
						"left-[calc(50%-(8px*0.866))]",
						arrowYStyles[y]
					)}
					style={{
						...(y === "bottom"
							? { top: "calc(100% + 2px)" }
							: { bottom: "calc(100% + 2px)" }),
						translateX: `calc(-50% + 8px)`,
					}}
					transition={{ duration: 0.1 }}
				/>
			</AnimatePresence>
		</div>
	) : (
		<>{children}</>
	);
};
