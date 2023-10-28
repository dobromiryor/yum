import { type Recipe } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Pill } from "~/components/common/Pill";
import { type Language } from "~/enums/language.enum";
import { OptionalTranslatedContentSchema } from "~/schemas/common";
import { getInvertedLang } from "~/utils/helpers/get-inverted-lang";

interface OverviewCardProps {
	recipe: SerializeFrom<Recipe>;
	lang: Language;
	isUnrestricted?: boolean;
	linkTo?: "page" | "edit";
}

export const OverviewCard = ({
	recipe,
	lang,
	isUnrestricted = false,
	linkTo = "page",
}: OverviewCardProps) => {
	const { t } = useTranslation();

	const { name: n, servings, difficulty } = recipe;

	const name = OptionalTranslatedContentSchema.parse(n);
	const invertedLang = getInvertedLang(lang);

	if (!name && !isUnrestricted) {
		return null;
	}

	const src = null; // TODO: Recipe photo

	return (
		<Link
			to={
				linkTo === "edit"
					? `/recipes/${recipe.id}/${lang}`
					: `/recipes/${recipe.id}`
			}
		>
			<div
				key={`Recipe__${recipe.id}`}
				className="flex flex-col items-stretch gap-3 p-3 bg-secondary dark:bg-primary rounded-2xl shadow-lg hover:scale-[1.01] hover:shadow-xl transition-all"
			>
				<div className="bg-light dark:bg-dark aspect-square rounded-xl overflow-hidden">
					{src && <img alt="" className="aspect-square rounded-xl" src={src} />}
				</div>
				<span className="text-xl typography-medium">
					{name?.[lang] ?? name?.[invertedLang]}
				</span>
				<div className="flex gap-2 flex-wrap">
					{/* TODO: Replace times */}
					{/* {minutes > 0 && (
						<Pill icon="timer" label={String(formatTime(minutes))} />
					)} */}
					{servings && (
						<Pill
							icon="group"
							label={t("recipe.field.countServings", { count: servings })}
						/>
					)}
					<Pill
						icon="readiness_score"
						label={t(`recipe.difficulty.${difficulty}`)}
					/>
				</div>
			</div>
		</Link>
	);
};

export const NoRecipes = () => {
	const { t } = useTranslation();

	return (
		<div className="flex flex-col gap-3 justify-center items-center p-6 bg-secondary dark:bg-primary rounded-2xl shadow-lg transition-colors">
			<span className="text-lg typography-medium">
				{t("recipe.card.emptyRecipes")}
			</span>
		</div>
	);
};
