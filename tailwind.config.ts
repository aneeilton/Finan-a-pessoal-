import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // "Jade" -- verde-esmeralda profundo, tom autoral (não é o teal
        // padrão do Tailwind): remete a crescimento/confiança sem soar
        // gritante feito app-brinquedo.
        brand: {
          50: "#EFFBF7",
          100: "#D9F3EA",
          200: "#B3E7D6",
          300: "#82D3BC",
          400: "#52BB9F",
          500: "#2FA084",
          600: "#1F8570",
          700: "#17685A",
          800: "#144F47",
          900: "#0F3B36",
        },
        // alerta/despesa: terracota-vermelho quente, evita o rosa neon
        coral: {
          400: "#F0897C",
          500: "#E15D4C",
        },
        // pendências: ocre amarelado, mais terroso que amber puro
        sun: {
          400: "#EFB35C",
          500: "#D6912A",
        },
        // investimentos: ameixa/violeta profundo
        grape: {
          400: "#A78BDB",
          500: "#7B5BB8",
        },
        // contas/informativo: azul-aço, menos ciano-neon
        sky: {
          400: "#6FAFCB",
          500: "#3A85A8",
        },
        // neutro com leve tom esverdeado (não é slate azulado padrão)
        ink: {
          50: "#F6F8F7",
          100: "#EBEFED",
          400: "#8B9995",
          500: "#5F706C",
          700: "#33413E",
          800: "#202B29",
          900: "#121917",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl2: "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 1px 2px -1px rgba(18, 25, 23, 0.06), 0 4px 16px -6px rgba(18, 25, 23, 0.10)",
        pop: "0 10px 28px -8px rgba(23, 104, 90, 0.4)",
      },
      keyframes: {
        "pop-in": {
          "0%": { opacity: "0", transform: "translateY(6px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.18s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
