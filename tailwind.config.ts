import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta "Aurora" -- baseada na paleta de marca fornecida (Indigo,
        // Watermelon, Golden Pollen, Turquoise, Jungle Green). Cada cor
        // mantém o hue exato do swatch original num stop "de identidade"
        // (o mais claro/vívido, usado em ícones, bordas e fundos), e usa um
        // tom mais escuro da MESMA família em stops que carregam texto ou
        // fundo sólido com texto branco em cima -- os tons originais do
        // swatch, sozinhos, não passam em contraste AA para essas funções.
        brand: {
          50: "#F0FAF5",
          100: "#DBF5EA",
          200: "#ABEDD0",
          300: "#6CEAB3",
          400: "#30E898",
          500: "#0EAD69", // Jungle Green (swatch exato)
          600: "#0F8753", // botões/links -- AA c/ texto branco
          700: "#0D7749", // texto sobre fundo claro -- AA
          800: "#0F5738",
          900: "#0C3B27",
        },
        // alerta/despesa: Watermelon
        coral: {
          400: "#F07590", // decorativo (bordas, ícones)
          500: "#E91644", // texto/fundo -- AA
        },
        // pendências: Golden Pollen
        sun: {
          400: "#FFD23F", // decorativo (swatch exato)
          500: "#917108", // texto -- AA (o amarelo puro não passa em contraste)
        },
        // investimentos: Indigo
        grape: {
          400: "#C874E7", // decorativo
          500: "#540D6E", // swatch exato -- já tem ótimo contraste como texto
          600: "#8E20B6", // tom médio p/ gráficos (barras, etc.)
          900: "#290836", // fim escuro de gradiente
        },
        // contas/informativo: Turquoise
        sky: {
          400: "#3BCEAC", // decorativo (swatch exato)
          500: "#1C856C", // texto -- AA (o turquesa puro não passa em contraste)
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
        pop: "0 10px 28px -8px rgba(13, 119, 73, 0.4)",
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
