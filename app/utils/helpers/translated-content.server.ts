import { type z } from "zod";

import { type Language } from "~/enums/language.enum";
import i18next from "~/modules/i18next.server";
import { SessionDataStorageSchema } from "~/schemas/common";
import { getDataSession } from "~/utils/dataStorage.server";
import { parseWithMessage } from "~/utils/helpers/parse-with-message.server";

interface TranslatedContentProps {
	request: Request;
	key: keyof z.infer<typeof SessionDataStorageSchema>;
	lang: Language;
	value: string | null;
}

export const translatedContent = async ({
	request,
	key,
	lang,
	value,
}: TranslatedContentProps) => {
	const t = await i18next.getFixedT(request.clone());

	const { getData } = await getDataSession(request.clone());

	const translationData = await parseWithMessage(
		SessionDataStorageSchema,
		getData(),
		t("error.dataMissing")
	);

	return {
		[key]: {
			...translationData[key],
			...{ [lang]: value?.trim() ?? null },
		},
	};
};

export const nullishTranslatedContent = async ({
	request,
	key,
	lang,
	value,
}: Omit<TranslatedContentProps, "value"> & {
	value: string | null | undefined;
}) => {
	if (typeof value === "undefined") {
		return undefined;
	}

	if (!value) {
		return await translatedContent({ request, key, lang, value: null });
	}

	return await translatedContent({ request, key, lang, value });
};
