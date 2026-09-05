export type ProductVisualItem = {
  name: string;
  emoji: string;
  image?: string;
  top: number;
  left: number;
  size: number;
  rotate?: number;
  zIndex?: number;
};

export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  badge?: string;
  emoji: string;
  baseImage?: string;
  description: string;
  items: string[];
  visualItems: ProductVisualItem[];
};

export const products: Product[] = [
  {
    slug: "canasta-clasica",
    name: "Canasta Clásica",
    category: "Económica",
    price: 89.9,
    oldPrice: 99.9,
    badge: "Más vendida",
    emoji: "🧺",
    description: "Una selección práctica y tradicional para regalos familiares o empresariales.",
    items: ["Panetón", "Chocolate", "Arroz", "Azúcar", "Aceite", "Conservas"],
    visualItems: [
      { name: "Panetón", emoji: "🍞", top: 28, left: 34, size: 42, rotate: -8, zIndex: 4 },
      { name: "Chocolate", emoji: "🍫", top: 35, left: 57, size: 34, rotate: 8, zIndex: 5 },
      { name: "Arroz", emoji: "🍚", top: 50, left: 26, size: 31, rotate: -4, zIndex: 6 },
      { name: "Azúcar", emoji: "🧂", top: 52, left: 72, size: 29, rotate: 5, zIndex: 6 },
      { name: "Aceite", emoji: "🫗", top: 30, left: 76, size: 32, rotate: 5, zIndex: 3 },
      { name: "Conservas", emoji: "🥫", top: 58, left: 48, size: 29, rotate: -5, zIndex: 7 },
    ],
  },
  {
    slug: "canasta-premium",
    name: "Canasta Premium",
    category: "Premium",
    price: 159.9,
    oldPrice: 179.9,
    badge: "Recomendada",
    emoji: "🧺",
    description: "Presentación premium con productos seleccionados y lista para regalar.",
    items: ["Panetón premium", "Vino", "Chocolate", "Aceitunas", "Atún", "Galletas", "Café"],
    visualItems: [
      { name: "Panetón premium", emoji: "🍞", top: 28, left: 34, size: 42, rotate: -8, zIndex: 4 },
      { name: "Vino", emoji: "🍷", top: 24, left: 64, size: 42, rotate: 5, zIndex: 5 },
      { name: "Chocolate", emoji: "🍫", top: 43, left: 50, size: 31, rotate: 8, zIndex: 6 },
      { name: "Aceitunas", emoji: "🫒", top: 52, left: 25, size: 28, rotate: -5, zIndex: 7 },
      { name: "Atún", emoji: "🥫", top: 56, left: 69, size: 29, rotate: 7, zIndex: 7 },
      { name: "Galletas", emoji: "🍪", top: 62, left: 43, size: 28, rotate: -8, zIndex: 8 },
      { name: "Café", emoji: "☕", top: 63, left: 58, size: 27, rotate: 4, zIndex: 8 },
    ],
  },
  {
    slug: "canasta-ejecutiva",
    name: "Canasta Ejecutiva",
    category: "Ejecutiva",
    price: 239.9,
    badge: "Empresas",
    emoji: "🧺",
    description: "Pensada para clientes, ejecutivos y equipos que buscan una presentación especial.",
    items: ["Vino reserva", "Panetón premium", "Bombones", "Café", "Snacks", "Conservas gourmet"],
    visualItems: [
      { name: "Vino reserva", emoji: "🍷", top: 23, left: 68, size: 44, rotate: 5, zIndex: 4 },
      { name: "Panetón premium", emoji: "🍞", top: 28, left: 34, size: 43, rotate: -7, zIndex: 5 },
      { name: "Bombones", emoji: "🍬", top: 45, left: 52, size: 31, rotate: 6, zIndex: 6 },
      { name: "Café", emoji: "☕", top: 58, left: 28, size: 29, rotate: -5, zIndex: 7 },
      { name: "Snacks", emoji: "🥨", top: 60, left: 69, size: 30, rotate: 7, zIndex: 7 },
      { name: "Conservas gourmet", emoji: "🥫", top: 62, left: 49, size: 28, rotate: -4, zIndex: 8 },
    ],
  },
  {
    slug: "box-navideno",
    name: "Box Navideño",
    category: "Boxes",
    price: 119.9,
    emoji: "🎁",
    description: "Formato compacto, moderno y fácil de personalizar para campañas corporativas.",
    items: ["Panetón", "Chocolate", "Galletas", "Café", "Snacks"],
    visualItems: [
      { name: "Panetón", emoji: "🍞", top: 30, left: 33, size: 40, rotate: -7, zIndex: 4 },
      { name: "Chocolate", emoji: "🍫", top: 38, left: 61, size: 31, rotate: 8, zIndex: 5 },
      { name: "Galletas", emoji: "🍪", top: 55, left: 30, size: 29, rotate: -6, zIndex: 6 },
      { name: "Café", emoji: "☕", top: 58, left: 55, size: 29, rotate: 5, zIndex: 7 },
      { name: "Snacks", emoji: "🥨", top: 54, left: 74, size: 28, rotate: 8, zIndex: 6 },
    ],
  },
];

export const formatPrice = (value: number) => `S/ ${value.toFixed(2)}`;
