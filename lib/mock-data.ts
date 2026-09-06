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
    baseImage: "/canastas/cesta.png",
    description: "Una selección práctica y tradicional para regalos familiares o empresariales.",
    items: ["Panetón", "Arroz", "Azúcar", "Aceite", "Atún", "Fideos"],
    visualItems: [
      { name: "Panetón", emoji: "🍞", image: "/productos/paneton.png", top: 27, left: 28, size: 78, rotate: -7, zIndex: 12 },
      { name: "Aceite", emoji: "🫗", image: "/productos/aceite.png", top: 25, left: 72, size: 45, rotate: 4, zIndex: 11 },
      { name: "Arroz", emoji: "🍚", image: "/productos/arroz.png", top: 45, left: 48, size: 64, rotate: -3, zIndex: 13 },
      { name: "Azúcar", emoji: "🧂", image: "/productos/azucar.png", top: 53, left: 70, size: 58, rotate: 5, zIndex: 14 },
      { name: "Atún", emoji: "🥫", image: "/productos/atun.png", top: 59, left: 34, size: 52, rotate: -5, zIndex: 15 },
      { name: "Fideos", emoji: "🍝", image: "/productos/fideos.png", top: 63, left: 56, size: 58, rotate: 4, zIndex: 16 },
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
    baseImage: "/canastas/cesta-2.png",
    description: "Presentación premium con productos seleccionados y lista para regalar.",
    items: ["Panetón", "Champagne", "Galletas navideñas", "Duraznos", "Atún", "Leche"],
    visualItems: [
      { name: "Panetón", emoji: "🍞", image: "/productos/paneton.png", top: 27, left: 29, size: 82, rotate: -6, zIndex: 12 },
      { name: "Champagne", emoji: "🍾", image: "/productos/chanpagne.png", top: 24, left: 70, size: 48, rotate: 5, zIndex: 11 },
      { name: "Galletas navideñas", emoji: "🍪", image: "/productos/galletas-navidad.png", top: 45, left: 50, size: 72, rotate: 4, zIndex: 14 },
      { name: "Duraznos", emoji: "🍑", image: "/productos/durazno.png", top: 57, left: 27, size: 56, rotate: -5, zIndex: 15 },
      { name: "Atún", emoji: "🥫", image: "/productos/atun.png", top: 59, left: 70, size: 52, rotate: 6, zIndex: 15 },
      { name: "Leche", emoji: "🥛", image: "/productos/leche.png", top: 64, left: 49, size: 54, rotate: -2, zIndex: 16 },
    ],
  },
  {
    slug: "canasta-ejecutiva",
    name: "Canasta Ejecutiva",
    category: "Ejecutiva",
    price: 239.9,
    badge: "Empresas",
    emoji: "🧺",
    baseImage: "/canastas/cesta-3.png",
    description: "Pensada para clientes, ejecutivos y equipos que buscan una presentación especial.",
    items: ["Champagne", "Panetón", "Galletas navideñas", "Duraznos", "Aceite", "Leche", "Atún"],
    visualItems: [
      { name: "Champagne", emoji: "🍾", image: "/productos/chanpagne.png", top: 21, left: 72, size: 50, rotate: 5, zIndex: 11 },
      { name: "Panetón", emoji: "🍞", image: "/productos/paneton.png", top: 25, left: 27, size: 84, rotate: -6, zIndex: 12 },
      { name: "Galletas navideñas", emoji: "🍪", image: "/productos/galletas-navidad.png", top: 40, left: 49, size: 75, rotate: 2, zIndex: 13 },
      { name: "Aceite", emoji: "🫗", image: "/productos/aceite.png", top: 43, left: 79, size: 43, rotate: 6, zIndex: 13 },
      { name: "Duraznos", emoji: "🍑", image: "/productos/durazno.png", top: 59, left: 24, size: 57, rotate: -6, zIndex: 15 },
      { name: "Leche", emoji: "🥛", image: "/productos/leche.png", top: 61, left: 51, size: 55, rotate: -2, zIndex: 16 },
      { name: "Atún", emoji: "🥫", image: "/productos/atun.png", top: 60, left: 73, size: 52, rotate: 5, zIndex: 16 },
    ],
  },
  {
    slug: "box-navideno",
    name: "Box Navideño",
    category: "Boxes",
    price: 119.9,
    emoji: "🎁",
    baseImage: "/canastas/caja.png",
    description: "Formato compacto, moderno y fácil de personalizar para campañas corporativas.",
    items: ["Panetón", "Galletas navideñas", "Leche", "Fideos", "Azúcar"],
    visualItems: [
      { name: "Panetón", emoji: "🍞", image: "/productos/paneton.png", top: 29, left: 27, size: 78, rotate: -7, zIndex: 12 },
      { name: "Galletas navideñas", emoji: "🍪", image: "/productos/galletas-navidad.png", top: 38, left: 63, size: 69, rotate: 5, zIndex: 13 },
      { name: "Leche", emoji: "🥛", image: "/productos/leche.png", top: 56, left: 28, size: 54, rotate: -5, zIndex: 14 },
      { name: "Fideos", emoji: "🍝", image: "/productos/fideos.png", top: 60, left: 53, size: 58, rotate: 3, zIndex: 15 },
      { name: "Azúcar", emoji: "🧂", image: "/productos/azucar.png", top: 57, left: 75, size: 54, rotate: 6, zIndex: 15 },
    ],
  },
];

export const formatPrice = (value: number) => `S/ ${value.toFixed(2)}`;
