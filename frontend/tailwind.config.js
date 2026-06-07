/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          "surface-elevated": "var(--bg-surface-elevated)",
          "surface-elevated-hover": "var(--bg-surface-elevated-hover)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          disabled: "var(--text-disabled)",
        },
        accent: {
          primary: "var(--accent-primary)",
          "primary-hover": "var(--accent-primary-hover)",
          secondary: "var(--accent-secondary)",
          "secondary-hover": "var(--accent-secondary-hover)",
          ai: "var(--accent-ai)",
          "ai-hover": "var(--accent-ai-hover)",
          warning: "var(--accent-warning)",
        },
        state: {
          error: "var(--state-error)",
          "error-hover": "var(--state-error-hover)",
        },
        border: {
          default: "var(--border-default)",
          hover: "var(--border-hover)",
          focus: "var(--border-focus)",
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      }
    },
  },
  plugins: [],
}

