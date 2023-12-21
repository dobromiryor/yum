import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { TooltipWrapper } from "~/components/common/Tooltip";
import { Star } from "~/components/recipes/detail/Star";
import { RATING_ARR } from "~/consts/rating.const";

interface RatingProps {
	isAuthenticated: boolean;
	handleRating: (value: number) => void;
	avgRating: number;
}

export const Rating = ({
	avgRating,
	handleRating,
	isAuthenticated,
}: RatingProps) => {
	const { t } = useTranslation();

	return (
		<div className="flex items-center gap-2">
			<div className="flex items-center gap-1">
				{RATING_ARR.map((item, index) => (
					<TooltipWrapper
						key={`Recipe__Rating__${item}`}
						className={clsx(!isAuthenticated && "pointer-events-none")}
						content={
							t("recipe.section.reviews.rating.description", {
								returnObjects: true,
							})[index]
						}
					>
						<button
							aria-label={
								t("recipe.section.reviews.rating.description", {
									returnObjects: true,
								})[index]
							}
							className="hover:backdrop-brightness-90 rounded-lg"
							disabled={!isAuthenticated}
							onClick={() => isAuthenticated && handleRating(item)}
						>
							<Star currentValue={avgRating} value={item} />
						</button>
					</TooltipWrapper>
				))}
			</div>
			<p className="typography-medium text-lg leading-5">{avgRating}</p>
		</div>
	);
};
