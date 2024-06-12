import type {Config} from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"

export default {
	content: ["./app/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				cal: ["var(--font-cal)", ...defaultTheme.fontFamily.sans],
			},
			fontSize: {
				xss: "11px",
				smm: "13px",
			},
		},
	},
	corePlugins: {
		preflight: true,
	},
	// important: true,
} satisfies Config
