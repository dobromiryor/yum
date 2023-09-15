import { LANGUAGES } from "./consts/languages.const";
import { Language } from "./enums/language.enum";

export default {
	// debug: process.env.NODE_ENV === "development",
	supportedLngs: LANGUAGES,
	fallbackLng: Language.EN,
	defaultNS: "translation",
	react: { useSuspense: false },
};
