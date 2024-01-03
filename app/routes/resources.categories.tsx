import { Status } from "@prisma/client";
import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";

import { MenuWrapper, useMenu } from "~/components/common/Menu/Menu";
import { Icon } from "~/components/common/UI/Icon";
import { MobileNavigationLink } from "~/components/header/MobileNavigationLink";
import { NavigationLink } from "~/components/header/NavigationLink";
import { LIMIT_FALLBACK, PAGE_FALLBACK } from "~/consts/pagination.const";
import {
	LanguageSchema,
	NonNullTranslatedContentSchema,
} from "~/schemas/common";
import { prisma } from "~/utils/prisma.server";

export const sitemap = () => ({
	exclude: true,
});

export const loader = async () => {
	const foundCategories = await prisma.category.findMany({
		where: { status: Status.PUBLISHED },
	});

	return json({ foundCategories });
};

export const CategoryMenu = () => {
	const categoryFetcher = useFetcher<typeof loader>();
	const categoryFetcherRef = useRef(categoryFetcher);

	const categories = useMemo(
		() => categoryFetcher.data?.foundCategories ?? [],
		[categoryFetcher.data?.foundCategories]
	);

	const [{ isOpen, buttonRef }] = useMenu();
	const {
		t,
		i18n: { language },
	} = useTranslation();

	const lang = LanguageSchema.parse(language);

	useEffect(() => {
		categoryFetcherRef.current = categoryFetcher;
	}, [categoryFetcher]);

	useEffect(() => {
		if (categoryFetcherRef.current.state === "idle") {
			categoryFetcherRef.current.load("/resources/categories");
		}
	}, []);

	return (
		<MenuWrapper
			aria-label={t("nav.categories")}
			className={clsx(!categories.length && "pointer-events-none")}
			customButton={
				<NavigationLink
					buttonClassName="gap-1"
					buttonProps={{ isDisabled: !categories.length }}
					id="category-menu"
					to="/recipes/c"
					onClick={(e) => e.preventDefault()}
				>
					{t("nav.categories")}
					<Icon
						className={clsx(
							"transition-transform",
							buttonRef.current?.id === "category-menu" && isOpen
								? "rotate-180"
								: "rotate-0"
						)}
						name="expand_more"
					/>
				</NavigationLink>
			}
			menuChildren={categories.map((category) => {
				const name = NonNullTranslatedContentSchema.parse(category.name);

				return (
					<NavigationLink
						key={`Category__Link__${category.id}`}
						buttonClassName="flex-1"
						buttonProps={{ align: "start" }}
						tabIndex={-1}
						to={`/recipes/c/${category.slug}?page=${PAGE_FALLBACK}&limit=${LIMIT_FALLBACK}`}
					>
						{name[lang]}
					</NavigationLink>
				);
			})}
		/>
	);
};

export const CategoryMenuMobile = () => {
	const [isExpanded, setIsExpanded] = useState<boolean>(false);

	const categoryFetcher = useFetcher<typeof loader>();
	const categoryFetcherRef = useRef(categoryFetcher);

	const categories = useMemo(
		() => categoryFetcher.data?.foundCategories ?? [],
		[categoryFetcher.data?.foundCategories]
	);

	const {
		t,
		i18n: { language },
	} = useTranslation();

	const lang = LanguageSchema.parse(language);

	const handleToggle = (e: MouseEvent) => {
		e.preventDefault();

		categories.length > 0 && setIsExpanded((prev) => !prev);
	};

	useEffect(() => {
		categoryFetcherRef.current = categoryFetcher;
	}, [categoryFetcher]);

	useEffect(() => {
		if (categoryFetcherRef.current.state === "idle") {
			categoryFetcherRef.current.load("/resources/categories");
		}
	}, []);

	return (
		<div className={clsx("flex flex-col")}>
			<MobileNavigationLink
				className={clsx(!categories.length && "opacity-50")}
				to="/recipes/c"
				onClick={handleToggle}
			>
				{t("nav.categories")}
				<Icon
					className={clsx(
						"transition-transform rounded-full",
						isExpanded ? "rotate-180" : "rotate-0"
					)}
					name="expand_more"
					size="24"
				/>
			</MobileNavigationLink>
			<motion.div
				animate={
					isExpanded
						? {
								display: "initial",
								opacity: 1,
								height: "auto",
							}
						: {
								opacity: 0,
								height: 0,
								transitionEnd: {
									display: "none",
								},
							}
				}
				className="pl-2"
				style={{
					opacity: 0,
					height: 0,
					transformOrigin: "top center",
				}}
			>
				{categories.map((category) => {
					const name = NonNullTranslatedContentSchema.parse(category.name);

					return (
						<MobileNavigationLink
							key={`Mobile__Category__Link__${category.id}`}
							size="xl"
							tabIndex={-1}
							to={`/recipes/c/${category.slug}?page=${PAGE_FALLBACK}&limit=${LIMIT_FALLBACK}`}
						>
							{name[lang]}
						</MobileNavigationLink>
					);
				})}
			</motion.div>
		</div>
	);
};
