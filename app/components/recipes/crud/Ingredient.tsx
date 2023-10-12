import { type Unit } from "@prisma/client";
import { useParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { type z } from "zod";

import {
	LanguageSchema,
	type OptionalTranslatedContentSchema,
} from "~/schemas/common";

interface IngredientStringProps {
	name: z.infer<typeof OptionalTranslatedContentSchema>;
	quantity: string | null;
	unit: Unit | null;
}

export const IngredientString = ({
	name,
	quantity,
	unit,
}: IngredientStringProps) => {
	const {
		t,
		i18n: { language: la },
	} = useTranslation();

	const params = useParams();
	const { lang: l } = params;

	const lang = LanguageSchema.optional().nullable().parse(l);
	const language = LanguageSchema.parse(la);

	let string = name?.[lang ?? language];

	if (!string) {
		string = t("error.translationMissing");
	}

	if (quantity && unit) {
		string = `${quantity} ${unit.replace("_", " ")} ${string}`;
	}

	if (quantity && !unit) {
		string = `${quantity} ${string}`;
	}

	if (!quantity && unit === "to_taste") {
		string = `${string} ${unit.replace("_", " ")}`;
	}

	return string;
};
