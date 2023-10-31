import { type User } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";
import clsx from "clsx";
import { AnimatePresence, motion, type AnimationProps } from "framer-motion";
import { t } from "i18next";
import { useMemo, type Dispatch, type SetStateAction } from "react";

import { AuthMenu } from "~/components/common/Menu/AuthMenu";
import { LanguageMenu } from "~/components/common/Menu/LanguageMenu";
import { ThemeSwitch } from "~/components/common/ThemeButton";
import { MobileNavigationLink } from "~/components/header/MobileNavigationLink";
import { SearchInput } from "~/components/header/SearchInput";

interface MobileNavigationProps {
	authData: SerializeFrom<User> | null;
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const transition = {
	ease: "easeInOut",
	duration: 0.3,
};

const backdropAnimationProps: AnimationProps = {
	animate: {
		opacity: 1,
	},
	exit: {
		opacity: 0,
	},
	initial: {
		opacity: 0,
	},
	transition,
};

const navAnimationProps: AnimationProps = {
	animate: {
		opacity: 1,
	},
	exit: {
		opacity: 0,
	},
	initial: {
		opacity: 0,
	},
	transition,
};

export const MobileNavigation = ({
	authData,
	isOpen,
	setIsOpen,
}: MobileNavigationProps) => {
	const containerAnimationProps: AnimationProps = useMemo(
		() => ({
			animate: isOpen
				? {
						translateY: 0,
				  }
				: {
						translateY: "calc(-100% + 64px + 16px)",
				  },
			transition,
		}),
		[isOpen]
	);

	return (
		<>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						className={clsx(
							"sm:hidden fixed inset-0 min-h-full backdrop-brightness-95 dark:backdrop-brightness-75 backdrop-blur-xl -z-10"
						)}
						{...backdropAnimationProps}
					/>
				)}
			</AnimatePresence>
			<AnimatePresence initial={false}>
				<motion.div
					className="sm:hidden inset-0 fixed pb-4 px-4 -z-10"
					onClick={() => setIsOpen(false)}
					{...containerAnimationProps}
				>
					<div
						className={clsx(
							"pt-20 px-4 pb-4 h-full rounded-b-2xl shadow-lg backdrop-blur-xl",
							"bg-primary/40 backdrop-brightness-110",
							"dark:bg-primary/75 dark:backdrop-brightness-125"
						)}
					>
						<AnimatePresence initial={false}>
							{isOpen && (
								<motion.nav
									className={clsx(
										"flex flex-col justify-between gap-6 min-h-full"
									)}
									onClick={(e) => e.stopPropagation()}
									{...navAnimationProps}
								>
									<div className="flex flex-col gap-6">
										<SearchInput />
										<MobileNavigationLink
											end
											closeMenu={setIsOpen}
											to={"/recipes"}
										>
											{t("nav.recipes")}
										</MobileNavigationLink>
										{authData?.isVerified && (
											<MobileNavigationLink
												closeMenu={setIsOpen}
												to={`/users/${authData?.id}`}
											>
												{t("nav.myRecipes")}
											</MobileNavigationLink>
										)}
										{authData?.isVerified && (
											<MobileNavigationLink
												closeMenu={setIsOpen}
												to={`/recipes/new`}
											>
												{t("nav.newRecipe")}
											</MobileNavigationLink>
										)}
										{!authData && (
											<MobileNavigationLink closeMenu={setIsOpen} to={"/login"}>
												{t("nav.login")}
											</MobileNavigationLink>
										)}
									</div>
									<div className="flex justify-end gap-2">
										<ThemeSwitch />
										<LanguageMenu isMobile />
										{authData && <AuthMenu isMobile />}
									</div>
								</motion.nav>
							)}
						</AnimatePresence>
					</div>
				</motion.div>
			</AnimatePresence>
		</>
	);
};
