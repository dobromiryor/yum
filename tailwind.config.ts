import tailwindColors from "./node_modules/tailwindcss/colors";

import type { Config } from "tailwindcss";

const colorSafeList = [];
const extendedColors: { [key: string]: string | { [key: string]: string } } =
	{};
const shades = [500, 600, 700, 800, 900];

for (const color in tailwindColors) {
	// exclude deprecated and unwanted colors
	if (
		![
			"inherit",
			"current",
			"transparent",
			"black",
			"white",
			"lightBlue",
			"warmGray",
			"trueGray",
			"coolGray",
			"blueGray",
		].includes(color)
	) {
		extendedColors[color] =
			tailwindColors[color as keyof typeof tailwindColors];
		for (const shadeKey in shades) {
			colorSafeList.push(`text-${color}-100`);
			colorSafeList.push(`bg-${color}-${shades[shadeKey]}`);
		}
	}
}

export default {
	content: ["./app/**/*.{js,jsx,ts,tsx}"],
	safelist: colorSafeList,
	theme: {
		extend: {
			colors: {
				dark: "#352F44",
				primary: "#5C5470",
				secondary: "#B9B4C7",
				light: "#FAF0E6",
			},
			fontFamily: {
				sans: ["Rubik", "sans-serif"],
				heading: ["Lora", "serif"],
			},
		},
	},
	plugins: [],
	darkMode: "class",
} satisfies Config;
