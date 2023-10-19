import { LANGUAGES } from "~/consts/languages.const";
import { NAMESPACES } from "~/consts/namespaces.const";
import { Language } from "~/enums/language.enum";

export default {
	// debug: process.env.NODE_ENV === "development",
	supportedLngs: LANGUAGES,
	fallbackLng: Language.EN,
	defaultNS: NAMESPACES,
	react: { useSuspense: true },
};
