import { type Recipe } from "@prisma/client";
import { type SerializeFrom } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import { Pill } from "~/components/common/Pill";
import { Image } from "~/components/common/UI/Image";
import { type Language } from "~/enums/language.enum";
import { CloudinaryUploadApiResponseWithBlurHashSchema } from "~/schemas/cloudinary.schema";
import { OptionalTranslatedContentSchema } from "~/schemas/common";
import { formatTime } from "~/utils/helpers/format-time";
import { getInvertedLang } from "~/utils/helpers/get-inverted-lang";

interface OverviewCardProps {
	recipe: SerializeFrom<Recipe & { totalTime: number }>;
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

	const { name: n, servings, difficulty, totalTime, photo: p } = recipe;

	const name = OptionalTranslatedContentSchema.parse(n);
	const invertedLang = getInvertedLang(lang);

	if (!name && !isUnrestricted) {
		return null;
	}

	const photo =
		CloudinaryUploadApiResponseWithBlurHashSchema.nullable().parse(p);

	return (
		<Link
			className="flex rounded-2xl"
			to={
				linkTo === "edit"
					? `/recipes/${recipe.id}/${lang}`
					: `/recipes/${recipe.id}`
			}
		>
			<div
				key={`Recipe__${recipe.id}`}
				className="flex-1 flex flex-col justify-between gap-3 p-3 bg-secondary dark:bg-primary rounded-2xl shadow-lg hover:scale-[1.01] hover:shadow-xl transition-all"
			>
				<div className="flex flex-col gap-3">
					<div className="bg-light dark:bg-dark aspect-square rounded-xl overflow-hidden transition-colors">
						{photo && (
							<Image className="rounded-xl overflow-hidden" photo={photo} />
						)}
					</div>
					<span className="text-xl typography-medium">
						{name?.[lang] ?? name?.[invertedLang]}
					</span>
				</div>
				<div className="flex gap-2 flex-wrap">
					<Pill
						icon="readiness_score"
						label={t(`recipe.difficulty.${difficulty}`)}
						tooltip={t("recipe.field.difficulty")}
					/>
					{servings && (
						<Pill
							icon="group"
							label={servings}
							tooltip={t("recipe.field.servings")}
						/>
					)}
					{totalTime > 0 && (
						<Pill
							icon="timer"
							label={String(formatTime(totalTime, t))}
							tooltip={t("recipe.field.totalTime")}
						/>
					)}
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
