import clsx from "clsx";
import { useEffect, useState } from "react";

type IconSize = "14" | "16" | "20" | "36";

interface IconProps {
	name: string;
	label?: string;
	className?: string;
	size?: IconSize;
}

export const Icon = ({ name, label, className, size = "14" }: IconProps) => {
	const [isLoaded, setIsLoaded] = useState(false);
	const sizeStyles = {
		"14": "text-sm leading-[14px] h-[14px] w-[14px]",
		"16": "text-base leading-4 h-4 w-4",
		"20": "text-xl leading-5 h-5 w-5",
		"36": "text-4xl leading-9 h-9 w-9",
	};

	useEffect(() => {
		const isFontLoaded = async () => {
			await document.fonts.ready.then(async (fonts) =>
				fonts.forEach(async (font) => {
					if (font.family === "Material Symbols Rounded") {
						await font.load();
						await font.loaded.then(() => setIsLoaded(true));
					}
				})
			);
		};

		isFontLoaded();
	}, []);

	return (
		<div
			aria-hidden={!label}
			aria-label={label}
			className="flex justify-center items-center"
		>
			<span
				aria-hidden
				className={clsx(
					sizeStyles[size],
					"material-symbols-rounded select-none",
					className
				)}
			>
				{isLoaded ? name : ""}
			</span>
		</div>
	);
};
