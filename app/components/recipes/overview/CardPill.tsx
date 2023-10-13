interface CardPillProps {
	icon: string;
	label: string;
}

export const CardPill = ({ icon, label }: CardPillProps) => {
	return (
		<div className="flex justify-center items-center gap-1.5 p-1.5 bg-light dark:bg-dark rounded-xl text-xs leading-[14px]">
			<span
				className="text-sm leading-[14px] material-symbols-rounded"
				style={{
					fontVariationSettings: "'FILL' 0,'wght' 300,'GRAD' -25,'opsz' 48",
				}}
			>
				{icon}
			</span>
			<span className="typography-light">{label}</span>
		</div>
	);
};
