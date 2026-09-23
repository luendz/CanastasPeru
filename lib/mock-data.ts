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
    slug: "box-navideno",
    name: "Box Navideño",
    category: "Boxes",
    price: 89.9,
    oldPrice: 99.9,
    emoji: "🎁",
    baseImage: "/canastas/caja.png",
    description: "Formato compacto, moderno y fácil de personalizar para campañas corporativas.",
    items: ["Panetón", "Galletas navideñas", "Leche", "Fideos", "Azúcar"],
    visualItems: [
      { name: "Panetón", emoji: "🍞", image: "/productos/paneton.png", top: 72.4, left: 33.3, size: 137, rotate: -7, zIndex: 12 },
      { name: "Galletas navideñas", emoji: "🍪", image: "/productos/galletas-navidad.png", top: 80.8, left: 52, size: 130, rotate: 9, zIndex: 17 },
      { name: "Leche", emoji: "🥛", image: "/productos/leche.png", top: 81, left: 41.2, size: 93, rotate: -5, zIndex: 19 },
      { name: "Fideos", emoji: "🍝", image: "/productos/fideos.png", top: 71.5, left: 47.9, size: 85, zIndex: 15 },
      { name: "Azúcar", emoji: "🧂", image: "/productos/azucar.png", top: 73, left: 59, size: 108, rotate: 13, zIndex: 15 },
    ],
  },
  {
    slug: "canasta-clasica",
    name: "Canasta Clásica",
    category: "Económica",
    price: 119.9,
    badge: "Más vendida",
    emoji: "🧺",
    baseImage: "/canastas/cesta.png",
    description: "Una selección práctica y tradicional para regalos familiares o empresariales.",
    items: ["Panetón", "Arroz", "Azúcar", "Aceite", "Atún", "Fideos"],
    visualItems: [
      { name: "Panetón", emoji: "🍞", image: "/productos/paneton.png", top: 73.3, left: 40.6, size: 134, rotate: -7, zIndex: 10 },
      { name: "Aceite", emoji: "🫗", image: "/productos/aceite.png", top: 65.6, left: 50, size: 133, zIndex: 11 },
      { name: "Arroz", emoji: "🍚", image: "/productos/arroz.png", top: 74.7, left: 34.4, size: 99, rotate: -13, zIndex: 13 },
      { name: "Azúcar", emoji: "🧂", image: "/productos/azucar.png", top: 75.2, left: 62.8, size: 103, rotate: 13, zIndex: 14 },
      { name: "Atún", emoji: "🥫", image: "/productos/atun.png", top: 81.2, left: 49.6, size: 75, zIndex: 15 },
      { name: "Fideos", emoji: "🍝", image: "/productos/fideos.png", top: 72.8, left: 57.5, size: 77, rotate: 4, zIndex: 9 },
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
      { name: "Panetón", emoji: "🍞", image: "/productos/paneton.png", top: 76.4, left: 41.7, size: 145, rotate: -6, zIndex: 12 },
      { name: "Champagne", emoji: "🍾", image: "/productos/chanpagne.png", top: 64.4, left: 50.5, size: 160, zIndex: 11 },
      { name: "Galletas navideñas", emoji: "🍪", image: "/productos/galletas-navidad.png", top: 75.6, left: 56.4, size: 116, rotate: 4, zIndex: 14 },
      { name: "Duraznos", emoji: "🍑", image: "/productos/durazno.png", top: 81.2, left: 39.2, size: 86, rotate: -5, zIndex: 15 },
      { name: "Atún", emoji: "🥫", image: "/productos/atun.png", top: 82.7, left: 50.2, size: 52, zIndex: 15 },
      { name: "Leche", emoji: "🥛", image: "/productos/leche.png", top: 80.9, left: 59.4, size: 79, rotate: 10, zIndex: 16 },
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
      { name: "Champagne", emoji: "🍾", image: "/productos/chanpagne.png", top: 68.9, left: 49.7, size: 129, rotate: -9, zIndex: 11 },
      { name: "Panetón", emoji: "🍞", image: "/productos/paneton.png", top: 79.6, left: 42.2, size: 108, rotate: -6, zIndex: 12 },
      { name: "Galletas navideñas", emoji: "🍪", image: "/productos/galletas-navidad.png", top: 77.2, left: 62.2, size: 112, rotate: 8, zIndex: 13 },
      { name: "Aceite", emoji: "🫗", image: "/productos/aceite.png", top: 69.8, left: 54, size: 128, rotate: 4, zIndex: 13 },
      { name: "Duraznos", emoji: "🍑", image: "/productos/durazno.png", top: 82.7, left: 48.8, size: 74, rotate: -6, zIndex: 15 },
      { name: "Leche", emoji: "🥛", image: "/productos/leche.png", top: 84.3, left: 52.3, size: 55, rotate: -2, zIndex: 16 },
      { name: "Atún", emoji: "🥫", image: "/productos/atun.png", top: 85, left: 58.3, size: 52, rotate: 5, zIndex: 16 },
    ],
  },
];

export type BasketType = {
  id: string;
  label: string;
  image: string;
  hint: string;
  priceDelta: number;
};

export const basketTypes: BasketType[] = [
  {
    id: "cesta-azul",
    label: "Cesta azul",
    image: "/canastas/cesta.png",
    hint: "Abierta y ligera",
    priceDelta: 0,
  },
  {
    id: "caja-navidena",
    label: "Caja navideña",
    image: "/canastas/caja.png",
    hint: "Estampado festivo",
    priceDelta: 8,
  },
  {
    id: "cesta-gris",
    label: "Cesta gris con tapa",
    image: "/canastas/cesta-2.png",
    hint: "Con tapa, reutilizable",
    priceDelta: 10,
  },
  {
    id: "cesta-ratan",
    label: "Cesta símil ratán",
    image: "/canastas/cesta-3.png",
    hint: "Acabado tejido, con tapa",
    priceDelta: 20,
  },
];

export const formatPrice = (value: number) =>
  `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const findBasketType = (image?: string) =>
  basketTypes.find((item) => item.image === image) ?? basketTypes[0];

/** Carrito de prueba compartido por carrito y checkout mientras no haya persistencia. */
export const mockCart = [
  { slug: "canasta-premium", qty: 2 },
  { slug: "box-navideno", qty: 1 },
];

/** Tarifas de delivery de prueba por distrito de Lima. */
export const deliveryZones = [
  { district: "Miraflores", fee: 15 },
  { district: "San Isidro", fee: 15 },
  { district: "Santiago de Surco", fee: 18 },
  { district: "San Borja", fee: 15 },
  { district: "La Molina", fee: 22 },
  { district: "Jesús María", fee: 15 },
  { district: "Lince", fee: 12 },
  { district: "San Miguel", fee: 18 },
];
