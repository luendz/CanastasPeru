/** Íconos de línea de la web (trazo con el color del texto). */
const TRAZOS = {
  regalo: "M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1.5-3-5-3.5-5-1s3.5 1 5 1Zm0 0c1.5-3 5-3.5 5-1s-3.5 1-5 1Z",
  diamante: "M6 4h12l3 5-9 11L3 9zM3 9h18M9 4l3 16M15 4l-3 16",
  maletin: "M4 8h16v11H4zM9 8V5h6v3M4 13h16",
  caja: "M4 8l8-4 8 4v9l-8 4-8-4zM4 8l8 4 8-4M12 12v9",
  estrella: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z",
  lazo: "M12 12c-3-4-7-4-7-1s4 2 7 1Zm0 0c3-4 7-4 7-1s-4 2-7 1Zm0 0-3 8m3-8 3 8",
  grafico: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  persona: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c1-4 4-6 8-6s7 2 8 6",
  carrito: "M3 4h2l2.4 11h11L21 7H6.2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  documento: "M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5",
  tarjeta: "M3 6h18v12H3zM3 10h18M7 15h4",
  camion: "M2 7h11v9H2zM13 10h4l3 3v3h-7M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  ubicacion: "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  calendario: "M4 6h16v14H4zM4 10h16M8 3v5M16 3v5",
  logo: "M4 16c3 0 5-2 6-5 1 3 3 5 6 5M4 20h16M12 4v3",
  chat: "M4 5h16v11H9l-5 4z",
  correo: "M3 6h18v12H3zM3 7l9 6 9-6",
  telefono: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z",
  flecha: "M5 12h14M13 6l6 6-6 6",
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export default function Icono({ nombre, className }: { nombre: NombreIcono; className?: string }) {
  return (
    <svg className={className ?? "icono"} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
