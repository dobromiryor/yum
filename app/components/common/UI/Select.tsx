import clsx from "clsx";
import { useSelect } from "downshift";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { type z } from "zod";

import { Error } from "~/components/common/UI/Error";
import { Label } from "~/components/common/UI/Label";
import { type OptionsSchema } from "~/schemas/option.schema";

type Options = z.infer<typeof OptionsSchema>;

interface SelectProps {
	isDisabled?: boolean;
	isRequired?: boolean;
	label: string;
	name: string;
	onChange: (data: string | null | undefined) => void;
	options: Options;
	placeholder?: string;
	selected: string | null | undefined;
}

export const Select = ({
	isDisabled = false,
	isRequired = false,
	label,
	name,
	onChange,
	options,
	placeholder,
	selected,
}: SelectProps) => {
	const ref = useRef<HTMLUListElement>(null);

	const { t } = useTranslation();

	const {
		getItemProps,
		getLabelProps,
		getMenuProps,
		getToggleButtonProps,
		highlightedIndex,
		isOpen,
		selectedItem,
		selectItem,
	} = useSelect({
		items: options,
		itemToString: (item) => item?.label ?? "",
		defaultSelectedItem: selected
			? options.find((item) => item.value === selected) ?? null
			: null,
		onSelectedItemChange: (changes) =>
			onChange(changes.selectedItem?.value ?? null),
		onIsOpenChange: () => {
			if (!isOpen) {
				if (ref.current) {
					let timeoutId: NodeJS.Timeout | null = null;

					if (timeoutId) {
						clearTimeout(timeoutId);
					}

					timeoutId = setTimeout(() => {
						ref.current?.scrollIntoView({
							behavior: "smooth",
							block: "end",
						});
					}, 301);
				}
			}
		},
	});

	const handleClear = (e?: MouseEvent<HTMLSpanElement>) => {
		e?.stopPropagation();
		selectItem(null);
	};

	return (
		<div className="relative w-0 min-w-full select-none">
			<div className="flex flex-col gap-2">
				<Label
					isRequired={isRequired}
					label={label}
					{...getLabelProps({ name })}
				/>
				<div
					className={clsx(
						"flex justify-between items-center gap-1 border rounded h-12 p-1 outline-offset-[-1px] z-10",
						"bg-light text-dark border-secondary",
						"dark:bg-dark dark:text-light dark:border-primary",
						isDisabled || !options.length
							? "opacity-50 pointer-events-none"
							: "opacity-100  pointer-events-auto"
					)}
					{...getToggleButtonProps({
						onKeyDown: (e) => {
							if (
								e.key === "Escape" ||
								e.key === "Delete" ||
								e.key === "Backspace"
							) {
								handleClear();
							}
						},
					})}
				>
					<span className="ml-2">
						{selectedItem ? selectedItem.label : placeholder ?? ""}
					</span>
					<div className={clsx("flex justify-center items-center h-10 w-10")}>
						{selectedItem ? (
							<span
								className="cursor-pointer text-xs hover:text-red-400 focus:text-red-500 transition-colors"
								onClick={handleClear}
							>
								&#10005;
							</span>
						) : (
							<span
								className={clsx(
									"transition-transform text-xs",
									isOpen ? "-rotate-180" : "rotate-0"
								)}
							>
								&#11206;
							</span>
						)}
					</div>
				</div>
			</div>

			<AnimatePresence initial={false}>
				<motion.ul
					animate={
						isOpen
							? {
									opacity: 1,
									height: "100%",
									maxHeight: "calc(40px*2.5)",
									display: "block",
									transitionEnd: {
										overflowY: "auto",
									},
							  }
							: {
									opacity: 0,
									height: "0%",
									maxHeight: 0,
									overflowY: "hidden",
									transitionEnd: { display: "none" },
							  }
					}
					className={clsx(
						"w-0 min-w-full -mt-1 pt-1 border border-t-0 rounded-b overflow-y-auto",
						"border-secondary dark:border-primary"
					)}
					transition={{ bounce: false }}
					{...getMenuProps({ ref })}
				>
					{options.length ? (
						options.map((item, index) => (
							<li
								key={`${item.value}${index}`}
								className={clsx(
									highlightedIndex === index
										? "bg-secondary dark:bg-primary"
										: "bg-light dark:bg-dark",
									selectedItem === item && "typography-medium",
									"py-2 px-3 flex flex-col"
								)}
								{...getItemProps({ item, index })}
							>
								{item.label}
							</li>
						))
					) : (
						<p className="py-2 px-3">{t("common.noOptionsAvailable")}</p>
					)}
				</motion.ul>
			</AnimatePresence>

			<Error className="mt-2" name={name} />
		</div>
	);
};
