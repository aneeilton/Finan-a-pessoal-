export const CATEGORIAS_GASTO = [
  { id: "mercado", label: "Mercado", emoji: "🛒" },
  { id: "alimentacao", label: "Alimentação", emoji: "🍔" },
  { id: "transporte", label: "Transporte", emoji: "🚗" },
  { id: "lazer", label: "Lazer", emoji: "🎮" },
  { id: "saude", label: "Saúde", emoji: "💊" },
  { id: "casa", label: "Casa", emoji: "🏠" },
  { id: "pet", label: "Pet", emoji: "🐾" },
  { id: "outros", label: "Outros", emoji: "🧾" },
] as const;

export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number]["id"];

export function categoriaEmoji(id: string): string {
  return CATEGORIAS_GASTO.find((c) => c.id === id)?.emoji ?? "🧾";
}

export function categoriaLabel(id: string): string {
  return CATEGORIAS_GASTO.find((c) => c.id === id)?.label ?? id;
}
