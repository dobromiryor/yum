import clsx from "clsx";
import { useMultipleSelection, useSelect } from "downshift";
import { AnimatePresence, motion } from "framer-motion";
import { t } from "i18next";
import { useMemo, useRef } from "react";
import { type z } from "zod";

import { Error } from "~/components/common/UI/Error";
import { Label } from "~/components/common/UI/Label";
import { type OptionSchema, type OptionsSchema } from "~/schemas/option.schema";

type Option = z.infer<typeof OptionSchema>;
type Options = z.infer<typeof OptionsSchema>;

interface MultiselectProps {
	isRequired?: boolean;
	label: string;
	name: string;
	onChange: (data?: string[] | null | undefined) => void;
	options: Options;
	selected: string[] | null | undefined;
}

export const Multiselect = ({
	isRequired = false,
	label,
	name,
	onChange,
	options,
	selected,
}: MultiselectProps) => {
	const ref = useRef<HTMLUListElement>(null);

	const {
		getSelectedItemProps,
		getDropdownProps,
		addSelectedItem,
		removeSelectedItem,
		selectedItems,
	} = useMultipleSelection<Option>({
		defaultSelectedItems: selected
			? options.filter((item) => selected.indexOf(item.value) >= 0)
			: undefined,
		onSelectedItemsChange: ({ selectedItems }) =>
			onChange(selectedItems?.map((item) => item.value) ?? null),
	});

	const items = useMemo(
		() => options.filter((item) => selectedItems.indexOf(item) < 0),
		[options, selectedItems]
	);

	const {
		isOpen,
		getToggleButtonProps,
		getLabelProps,
		getMenuProps,
		highlightedIndex,
		getItemProps,
	} = useSelect({
		items,
		stateReducer: (_state, actionAndChanges) => {
			const { changes, type } = actionAndChanges;

			switch (type) {
				case useSelect.stateChangeTypes.ToggleButtonKeyDownEnter:
				case useSelect.stateChangeTypes.ToggleButtonKeyDownSpaceButton:
				case useSelect.stateChangeTypes.ItemClick:
					return {
						...changes,
						isOpen: true,
					};
			}

			return changes;
		},
		onStateChange: ({ type, selectedItem: newSelectedItem }) => {
			switch (type) {
				case useSelect.stateChangeTypes.ToggleButtonKeyDownEnter:
				case useSelect.stateChangeTypes.ToggleButtonKeyDownSpaceButton:
				case useSelect.stateChangeTypes.ItemClick:
				case useSelect.stateChangeTypes.ToggleButtonBlur:
					if (newSelectedItem) {
						addSelectedItem(newSelectedItem);
					}

					break;
				default:
					break;
			}
		},
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
						"flex flex-wrap gap-1 border rounded relative min-h-12 p-1 pr-12 outline-offset-[-1px]",
						"bg-light text-dark border-secondary",
						"dark:bg-dark dark:text-light dark:border-primary"
					)}
				>
					<div
						className={clsx(
							"absolute inset-0 flex justify-center items-center"
						)}
						{...getToggleButtonProps(
							getDropdownProps({
								preventKeyAction: isOpen,
							})
						)}
					/>
					{selectedItems.length > 0 ? (
						selectedItems.map(
							function renderSelectedItem(selectedItemForRender, index) {
								return (
									<div
										key={`selected-item-${index}`}
										className={clsx(
											"flex justify-center items-center gap-1 py-1 px-2 min-h-10 rounded border group z-[1]",
											"border-secondary",
											"dark:border-primary"
										)}
										{...getSelectedItemProps({
											selectedItem: selectedItemForRender,
											index,
										})}
									>
										{selectedItemForRender.label}
										<div
											className="flex justify-center items-center h-5 w-5 text-xs hover:text-red-400 group-focus:text-red-500 rounded-full cursor-pointer"
											onClick={(e) => {
												e.stopPropagation();
												removeSelectedItem(selectedItemForRender);
											}}
										>
											{/* delete icon */}
											&#10005;
										</div>
									</div>
								);
							}
						)
					) : (
						<div className="min-h-10" />
					)}
					<div className="absolute right-1 flex justify-center items-center w-10 h-10 pointer-events-none">
						<span
							className={clsx(
								"transition-transform text-xs",
								isOpen ? "-rotate-180" : "rotate-0"
							)}
						>
							{/* dropdown icon */}
							&#11206;
						</span>
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
									maxHeight: "calc(40px*3.5)",
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
						"border-secondary  dark:border-primary"
					)}
					transition={{ bounce: false }}
					{...getMenuProps({ ref })}
				>
					{items.length ? (
						items.map((item, index) => (
							<li
								key={`${item.value}${index}`}
								className={clsx(
									highlightedIndex === index
										? "bg-secondary dark:bg-primary"
										: "bg-light dark:bg-dark",
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
