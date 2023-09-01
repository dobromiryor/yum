import { resolve } from "node:path";

export const loadPath = resolve("./public/locales/{{lng}}/translation.json");

export default {
	// This is the list of languages your application supports
	supportedLngs: ["en", "bg"],
	// This is the language you want to use in case
	// if the user language is not in the supportedLngs
	fallbackLng: "en",
	// Disabling suspense is recommended
	react: { useSuspense: false },
};
