import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
        },
        neutral: {
          50:  "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
        },
        surface: {
          base:    "var(--color-surface-base)",
          card:    "var(--color-surface-card)",
          subtle:  "var(--color-surface-subtle)",
        },
        error: {
          50:  "var(--color-error-50)",
          100: "var(--color-error-100)",
          500: "var(--color-error-500)",
        },
        success: {
          50:  "var(--color-success-50)",
          100: "var(--color-success-100)",
          500: "var(--color-success-500)",
        },
        warning: {
          50:  "var(--color-warning-50)",
          100: "var(--color-warning-100)",
          500: "var(--color-warning-500)",
        },
      },
      fontFamily: {
        base: "var(--font-family-base)",
        mono: "var(--font-family-mono)",
      },
      fontSize: {
        xs:   "var(--font-size-xs)",
        sm:   "var(--font-size-sm)",
        base: "var(--font-size-base)",
        md:   "var(--font-size-md)",
        lg:   "var(--font-size-lg)",
        xl:   "var(--font-size-xl)",
        "2xl": "var(--font-size-2xl)",
      },
      spacing: {
        1:  "var(--space-1)",
        2:  "var(--space-2)",
        3:  "var(--space-3)",
        4:  "var(--space-4)",
        5:  "var(--space-5)",
        6:  "var(--space-6)",
        8:  "var(--space-8)",
        10: "var(--space-10)",
        12: "var(--space-12)",
        16: "var(--space-16)",
        20: "var(--space-20)",
      },
      borderRadius: {
        sm:   "var(--radius-sm)",
        md:   "var(--radius-md)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm:      "var(--shadow-sm)",
        md:      "var(--shadow-md)",
        lg:      "var(--shadow-lg)",
        primary: "var(--shadow-primary-lift)",
        fab:     "var(--shadow-fab)",
        card:    "var(--shadow-card)",
      },
      transitionTimingFunction: {
        soft: "var(--ease-soft)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
      },
    },
  },
  plugins: [],
};
export default config;
