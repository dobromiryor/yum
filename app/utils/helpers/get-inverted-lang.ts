import { Language } from "~/enums/language.enum";

export const getInvertedLang = (lang: Language) =>
	lang === Language.BG ? Language.EN : Language.BG;
