import { useNavigate } from "@remix-run/react";
import clsx from "clsx";
import { useAnimate } from "framer-motion";
import {
	useEffect,
	useState,
	type ChangeEvent,
	type KeyboardEvent,
} from "react";
import { useTranslation } from "react-i18next";

import { Button } from "~/components/common/UI/Button";
import { Icon } from "~/components/common/UI/Icon";

interface SearchInputProps {
	isMobile?: boolean;
}

const inputWidth = 192;

const xsButtonGap = 8;
const mdButtonGap = 3;

const mdButtonWidth = 26;

const mdButtonsWidth = 2 * mdButtonWidth;

const mdButtonGaps = 2 * mdButtonGap;

const transition = {
	duration: 0.3,
};

export const SearchInput = ({ isMobile = true }: SearchInputProps) => {
	const [search, setSearch] = useState("");

	const { t } = useTranslation();
	const navigate = useNavigate();
	const [scope, animate] = useAnimate();

	const handleSearchInput = (e: ChangeEvent<HTMLInputElement>) => {
		setSearch(e.target.value);
	};

	const handleSearch = () => {
		if (search.trim().length) {
			navigate(`/recipes?q=${encodeURI(search.trim())}`);
		}
	};

	const handleSearchInputKeys = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.currentTarget.blur();
			handleSearch();
		}

		if (e.key === "Escape") {
			e.currentTarget.blur();
			setSearch("");
		}
	};

	useEffect(() => {
		if (search.length) {
			const enterAnimation = async () => {
				animate(
					"input",
					{
						...(!isMobile && {
							width: inputWidth - mdButtonsWidth - mdButtonGaps,
						}),
					},
					transition
				);

				await animate(
					'[data-animate-id="button-wrapper"]',
					{
						opacity: 1,
						width: "auto",
						x: 0,
						paddingLeft: isMobile ? xsButtonGap : mdButtonGap,
					},
					transition
				);
			};

			enterAnimation();
		} else {
			const exitAnimation = async () => {
				animate(
					"input",
					{
						...(!isMobile && {
							width: inputWidth,
						}),
					},
					transition
				);

				await animate(
					'[data-animate-id="button-wrapper"]',
					{
						opacity: 0,
						width: 0,
						x: isMobile ? xsButtonGap : mdButtonGap,
						paddingLeft: 0,
					},
					transition
				);
			};

			exitAnimation();
		}
	}, [animate, isMobile, search.length]);

	return (
		<div
			ref={scope}
			className="flex items-center p-2 md:p-[3px] bg-light dark:bg-dark rounded-lg overflow-hidden"
			role="search"
		>
			<input
				className={clsx(
					"bg-transparent text-dark dark:text-light placeholder:text-secondary placeholder:dark:text-primary text-xl md:text-base border-0 rounded-md transition-colors md:min-h-[26px] px-1 min-w-0 max-w-full basis-full shrink"
				)}
				placeholder={t("common.searchPlaceholder")}
				role="searchbox"
				style={{ ...(!isMobile && { width: inputWidth }) }}
				value={search}
				onChange={handleSearchInput}
				onKeyDown={handleSearchInputKeys}
			/>
			<div
				className={clsx(
					"grow-0 shrink-0 flex items-center gap-2 md:gap-[3px] overflow-hidden rounded-md",
					!search.length ? "pointer-events-none" : "pointer-events-auto"
				)}
				data-animate-id="button-wrapper"
				style={{
					opacity: 0,
					width: 0,
					paddingLeft: 0,
				}}
			>
				<Button
					className="focus-visible:-outline-offset-2"
					rounded="full"
					size="mediumSquare"
					tabIndex={!search.length ? -1 : 0}
					onClick={() => setSearch("")}
				>
					<Icon
						label={t("common.clear")}
						name="close"
						size={isMobile ? "16" : "14"}
					/>
				</Button>

				<Button
					className="focus-visible:-outline-offset-2"
					isDisabled={!search.trim().length}
					rounded="full"
					size="mediumSquare"
					tabIndex={!search.length ? -1 : 0}
					onClick={handleSearch}
				>
					<Icon
						label={t("common.search")}
						name="search"
						size={isMobile ? "16" : "14"}
					/>
				</Button>
			</div>
		</div>
	);
};
