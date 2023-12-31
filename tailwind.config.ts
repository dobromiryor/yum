import plugin from "tailwindcss/plugin";

import type { Config } from "tailwindcss";

/** @type {import('tailwindcss').Config} */

export default {
	content: ["./app/**/*.{js,jsx,ts,tsx}"],
	theme: {
		fontFamily: {
			sans: ["Rubik", "sans-serif"],
		},
		extend: {
			colors: {
				dark: {
					DEFAULT: "#352F44",
					50: "#CFCADB",
					100: "#C4BED2",
					200: "#AEA6C2",
					300: "#988EB1",
					400: "#8276A0",
					500: "#6D618C",
					600: "#5B5074",
					700: "#48405C",
					800: "#352F44", // ⬅️
					900: "#1B1823",
					950: "#0E0D12",
				},
				primary: {
					DEFAULT: "#5C5470",
					50: "#E5E3EA",
					100: "#DAD7E1",
					200: "#C5C0D0",
					300: "#AFA9BE",
					400: "#9992AD",
					500: "#847A9B",
					600: "#6F6587",
					700: "#5C5470", // ⬅️
					800: "#423C50",
					900: "#272430",
					950: "#1A1820",
				},
				secondary: {
					DEFAULT: "#B9B4C7", // maybe #C5B9D8
					50: "#F0EEF3",
					100: "#E5E3EA",
					200: "#CFCBD8",
					300: "#B9B4C7", // ⬅️
					400: "#9B94AF",
					500: "#7D7497",
					600: "#625A79",
					700: "#484259",
					800: "#2E2A38",
					900: "#141218",
					950: "#070608",
				},
				light: {
					DEFAULT: "#FAF0E6",
					50: "#FDFAF7",
					100: "#FAF0E6", // ⬅️
					200: "#F1D4B7",
					300: "#E7B888",
					400: "#DE9C5A",
					500: "#D5802B",
					600: "#A66421",
					700: "#774818",
					800: "#492C0F",
					900: "#1A1005",
					950: "#030201",
				},
			},
			screens: {
				xs: "384px",
			},
			minHeight: ({ theme }) => ({ ...theme("spacing") }),
			minWidth: ({ theme }) => ({ ...theme("spacing") }),
			maxWidth: ({ theme }) => ({ ...theme("spacing") }),
			maxHeight: ({ theme }) => ({ ...theme("spacing") }),
			flexBasis: ({ theme }) => ({
				...theme("screens"),
				min: "min-content",
			}),
			animation: {
				blink: "blink 2s step-start 0s infinite",
				malfunction: "malfunction 2s linear infinite alternate",
			},
			keyframes: {
				blink: {
					"50%": { opacity: "0" },
				},
				malfunction: {
					"10%": { opacity: "0" },
					"11%": { opacity: "1" },
					"12%": { opacity: "0" },
					"19%": { opacity: "0" },
					"20%": { opacity: "1" },
					"21%": { opacity: "0" },
					"60%": { opacity: "0" },
					"61%": { opacity: "1" },
					"80%": { opacity: "1" },
					"81%": { opacity: "0" },
					"82%": { opacity: "1" },
					"99%": { opacity: "1" },
					"100%": { opacity: "0" },
				},
			},
		},
	},
	plugins: [
		plugin(({ addComponents, theme }) => {
			addComponents({
				".typography-light": {
					"@apply font-light": "",
				},
				".typography-normal": {
					"@apply font-normal": "",
				},
				".typography-medium": {
					"@apply font-medium": "",
				},
				".typography-semibold": {
					"@apply font-semibold": "",
				},
				".typography-bold": {
					"@apply font-bold": "",
				},
				".typography-extrabold": {
					"@apply font-extrabold tracking-wide": "",
				},
				".typography-black": {
					"@apply font-black tracking-wider": "",
				},
				".bg-eyeline": {
					"background-image": `radial-gradient(ellipse 66% 133% at 0% 0%, transparent 65%,	${theme(
						"colors.stone.800"
					)} 66%), radial-gradient(ellipse 66% 133% at 100% 0%, transparent 65%, ${theme(
						"colors.stone.800"
					)} 66%), radial-gradient(ellipse 66% 133% at 100% 100%, transparent 65%, ${theme(
						"colors.stone.800"
					)} 66%), radial-gradient(ellipse 66% 133% at 0% 100%, transparent 65%, ${theme(
						"colors.stone.800"
					)} 66%)`,
					"background-size": "50% 50%",
					"background-repeat": "no-repeat",
					"background-position":
						"top left, top right, bottom right, bottom left",
				},
			});
		}),
	],
	darkMode: "class",
} satisfies Config;
