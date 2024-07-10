import clsx from "clsx";
import { motion, type AnimationProps } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { TooltipWrapper } from "~/components/common/Tooltip";

const Eyeball = ({ isEnabled }: { isEnabled: boolean }) => {
	const eyelidStyles =
		"absolute left-1/2 w-24 h-24 bg-stone-300 border-4 border-stone-800 rounded-full";

	const defaultStyles = {
		translateX: "-50%",
		scaleX: 3,
	};

	const isEnabledAnimation = (lid: "top" | "bottom"): AnimationProps => {
		const translateYKeyframes = [
			["-75%", "-100%", "-100%"],
			["-75%", "-100%", "-100%"],
			["-75%", "-100%", "-100%"],
			["-75%", "-100%", "-100%"],
			"-75%",
		].flat();

		return {
			animate: {
				scaleX: [[3, 1, 1], [3, 1, 1], [3, 1, 1], [3, 1, 1], 3].flat(),
				translateY:
					lid === "top"
						? translateYKeyframes
						: translateYKeyframes.map((item) => item.substring(1)),
			},
			transition: {
				duration: 20,
				ease: "easeOut",
				repeat: Infinity,
				repeatDelay: 0.1,
				repeatType: "mirror",
				times: [
					[0, 0.01, 0.2],
					[0.21, 0.22, 0.4],
					[0.41, 0.42, 0.8],
					[0.81, 0.82, 0.99],
					1,
				].flat(),
			},
		};
	};

	return (
		<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-stone-200 border-4 border-stone-800 rounded-full overflow-hidden pointer-events-none">
			<motion.div
				className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-stone-800 rounded-full"
				style={{ translateY: "-50%", translateX: "-50%", scale: 1 }}
				{...(isEnabled && {
					animate: {
						translateY: [
							["-50%", "-75%", "-50%"],
							["-50%", "-66%", "-50%"],
							["-50%", "-75%", "-50%"],
							["-50%", "-50%", "-50%"],
						].flat(),
						translateX: [
							["-50%", "-75%", "-50%"],
							["-50%", "-50%", "-50%"],
							["-50%", "-75%", "-50%"],
							["-50%", "-75%", "-50%"],
						].flat(),
						scale: [
							[1, 0.9, 1],
							[1, 0.95, 1],
							[1, 0.9, 1],
							[1, 0.9, 1],
						].flat(),
					},
					transition: {
						duration: 30,
						ease: "anticipate",
						repeat: Infinity,
						repeatDelay: 1,
						times: [
							[0, 0.05, 0.1],
							[0.3, 0.35, 0.4],
							[0.55, 0.6, 0.65],
							[0.9, 0.95, 1],
						].flat(),
					},
				})}
			/>
			<div className="absolute top-1.5 left-1.5 w-3 h-3 blur-[1px] bg-white/10  -skew-x-12 -skew-y-12 rounded-full" />
			<div className="absolute top-2 left-2 w-2.5 h-2.5 bg-white/10 -skew-x-12 -skew-y-12 rounded-full" />
			<motion.div
				className={eyelidStyles}
				style={{ bottom: 0, translateY: "75%", ...defaultStyles }}
				{...(isEnabled && isEnabledAnimation("bottom"))}
			/>
			<motion.div
				className={eyelidStyles}
				style={{ translateY: "-75%", ...defaultStyles }}
				{...(isEnabled && isEnabledAnimation("top"))}
			/>
		</div>
	);
};

export const ScreenWakeLock = () => {
	const [isSupported, setIsSupported] = useState<boolean>(false);
	const [isEnabled, setIsEnabled] = useState<boolean>(false);
	const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

	const { t } = useTranslation();

	useEffect(() => {
		if (typeof document !== "undefined") {
			if ("wakeLock" in navigator) {
				setIsSupported(true);
			}
		}
	}, []);

	useEffect(() => {
		if (isSupported) {
			if (wakeLock) {
				const release = () => setIsEnabled(false);

				wakeLock.addEventListener("release", release);

				return () => wakeLock.removeEventListener("release", release);
			}
		}
	}, [isSupported, wakeLock]);

	const handleEnable = async () => {
		if (isSupported) {
			if ("wakeLock" in navigator) {
				try {
					setWakeLock(await navigator.wakeLock.request("screen"));
					setIsEnabled(true);
				} catch (err) {
					console.error("ScreenWakeLockAPI", err);
				}
			}
		}
	};

	const handleDisable = async () => {
		if (isSupported) {
			if ("wakeLock" in navigator) {
				await wakeLock?.release().then(() => {
					setIsEnabled(false);
				});
			}
		}
	};

	const handleClick = async () => {
		if (isSupported) {
			if (isEnabled) {
				await handleDisable();
			} else {
				await handleEnable();
			}
		}
	};

	return (
		isSupported && (
			<motion.button
				animate={{ opacity: 1, translateY: 0 }}
				aria-label={
					isEnabled ? t("screenWakeLock.disable") : t("screenWakeLock.enable")
				}
				className={clsx(
					"fixed bottom-8 right-8 aspect-square w-12 rounded-full shadow-lg"
				)}
				exit={{ opacity: 0, translateY: 8 }}
				initial={{ opacity: 0, translateY: 8 }}
				onClick={async () => await handleClick()}
			>
				<TooltipWrapper
					className="w-12 aspect-square rounded-full"
					content={t("common.cookingMode")}
				>
					<Eyeball isEnabled={isEnabled} />
				</TooltipWrapper>
			</motion.button>
		)
	);
};
