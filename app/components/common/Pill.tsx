import { Icon } from "~/components/common/UI/Icon";

interface CardPillProps {
	icon?: string;
	label: string;
}

export const Pill = ({ icon, label }: CardPillProps) => {
	return (
		<div className="flex justify-center items-center gap-1.5 p-1.5 bg-light dark:bg-dark rounded-xl text-xs leading-[14px] transition-colors select-none">
			{icon && <Icon icon={icon} size="small" />}
			<span className="typography-light">{label}</span>
		</div>
	);
};
