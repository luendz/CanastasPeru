export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  badge?: string;
  emoji: string;
  description: string;
  items: string[];
};

export const products: Product[] = [
  {
    slug: "canasta-clasica",
    name: "Canasta Clásica",
    category: "Económica",
    price: 89.9,
    oldPrice: 99.9,
    badge: "Más vendida",
    emoji: "🎁",
    description: "Una selección práctica y tradicional para regalos familiares o empresariales.",
    items: ["Panetón", "Chocolate", "Arroz", "Azúcar", "Aceite", "Conservas"],
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
  },
  {
    slug: "canasta-ejecutiva",
    name: "Canasta Ejecutiva",
    category: "Ejecutiva",
    price: 239.9,
    badge: "Empresas",
    emoji: "🎄",
    description: "Pensada para clientes, ejecutivos y equipos que buscan una presentación especial.",
    items: ["Vino reserva", "Panetón premium", "Bombones", "Café", "Snacks", "Conservas gourmet"],
  },
  {
    slug: "box-navideno",
    name: "Box Navideño",
    category: "Boxes",
    price: 119.9,
    emoji: "✨",
    description: "Formato compacto, moderno y fácil de personalizar para campañas corporativas.",
    items: ["Panetón", "Chocolate", "Galletas", "Café", "Snacks"],
  },
];

export const formatPrice = (value: number) => `S/ ${value.toFixed(2)}`;
