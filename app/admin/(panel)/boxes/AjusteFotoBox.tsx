"use client";

import { useRef } from "react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/mock-data";
import { AJUSTE_FOTO_NEUTRO, FOTO_DESPLAZA, FOTO_ESCALA_MAX, FOTO_ESCALA_MIN, type AjusteFoto } from "./foto";

type Props = {
  ajuste: AjusteFoto;
  onAjuste: (a: AjusteFoto) => void;
  /** Datos del box tal como se ven en la tarjeta del catálogo. */
  nombre: string;
  precio: number;
  imagen: string;
  incluye: string[];
};

const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)));

/**
 * Vista previa con la tarjeta real del catálogo (mismo tamaño) y controles
 * para agrandar, achicar y mover la foto. Se arrastra la foto para moverla.
 */
export default function AjusteFotoBox({ ajuste, onAjuste, nombre, precio, imagen, incluye }: Props) {
  const arrastre = useRef<{ px: number; py: number; x: number; y: number; ancho: number; alto: number } | null>(null);

  const producto: Product = {
    slug: "vista-previa",
    name: nombre || "Nombre del box",
    category: "Box Navideño",
    price: precio > 0 ? precio : 0,
    emoji: "🎁",
    baseType: "box",
    ajustesEnvase: { box: { ...ajuste, giro: 0 } },
    description: "",
    items: incluye.length ? incluye : ["Productos que incluye"],
    visualItems: [],
    ...(imagen ? { foto: imagen } : {}),
  };

  function empezar(e: React.PointerEvent<HTMLDivElement>) {
    const visual = (e.target as HTMLElement).closest(".productVisual") as HTMLElement | null;
    if (!visual || !imagen) return;
    e.preventDefault();
    const r = visual.getBoundingClientRect();
    arrastre.current = { px: e.clientX, py: e.clientY, x: ajuste.x, y: ajuste.y, ancho: r.width, alto: r.height };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function mover(e: React.PointerEvent<HTMLDivElement>) {
    const a = arrastre.current;
    if (!a) return;
    // El desplazamiento es en % del recuadro (se aplica antes de escalar).
    const f = 100;
    onAjuste({
      ...ajuste,
      x: limitar(a.x + ((e.clientX - a.px) / a.ancho) * f, -FOTO_DESPLAZA, FOTO_DESPLAZA),
      y: limitar(a.y + ((e.clientY - a.py) / a.alto) * f, -FOTO_DESPLAZA, FOTO_DESPLAZA),
    });
  }

  const soltar = () => { arrastre.current = null; };

  return (
    <fieldset className="admBoxAjuste">
      <legend>Cómo se ve en el catálogo <small className="admMuted">Tarjeta real, al tamaño de la web. La ficha del box usa el mismo encuadre.</small></legend>
      <div className="admBoxAjusteGrid">
        <div
          className={`admBoxPreview${imagen ? " admBoxPreviewMovible" : ""}`}
          onPointerDown={empezar}
          onPointerMove={mover}
          onPointerUp={soltar}
          onPointerCancel={soltar}
          onClickCapture={(e) => e.preventDefault()}
          inert={!imagen}
        >
          <ProductCard product={producto} />
        </div>

        <div className="admForm">
          {!imagen && <p className="admMuted">Elige la foto del box para ajustarla.</p>}
          <label className="admRango">
            <span>Tamaño <strong>{ajuste.escala}%</strong></span>
            <input type="range" min={FOTO_ESCALA_MIN} max={FOTO_ESCALA_MAX} step={1} value={ajuste.escala} disabled={!imagen} onChange={(e) => onAjuste({ ...ajuste, escala: Number(e.target.value) })} />
          </label>
          <label className="admRango">
            <span>Horizontal <strong>{ajuste.x > 0 ? "+" : ""}{ajuste.x}</strong></span>
            <input type="range" min={-FOTO_DESPLAZA} max={FOTO_DESPLAZA} step={1} value={ajuste.x} disabled={!imagen} onChange={(e) => onAjuste({ ...ajuste, x: Number(e.target.value) })} />
          </label>
          <label className="admRango">
            <span>Vertical <strong>{ajuste.y > 0 ? "+" : ""}{ajuste.y}</strong></span>
            <input type="range" min={-FOTO_DESPLAZA} max={FOTO_DESPLAZA} step={1} value={ajuste.y} disabled={!imagen} onChange={(e) => onAjuste({ ...ajuste, y: Number(e.target.value) })} />
          </label>
          <p className="admMuted admSmall">También puedes arrastrar la foto en la tarjeta para moverla. Por debajo de 100% se ve el fondo de la tarjeta alrededor.</p>
          <div>
            <button type="button" className="admLinkMuted" disabled={!imagen} onClick={() => onAjuste(AJUSTE_FOTO_NEUTRO)}>Restablecer</button>
          </div>
        </div>
      </div>
    </fieldset>
  );
}
