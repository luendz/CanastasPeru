"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import ProductComposition from "@/components/ProductComposition";
import type { BasketType, Product, ProductVisualItem } from "@/lib/mock-data";
import { guardarComposicion, type GuardarState } from "./actions";

type Variant = "card" | "detail";
export type InsumoVisual = { nombre: string; emoji: string; imagen: string | null };

const clamp = (value: number) => Math.min(100, Math.max(0, value));
const round = (value: number) => Math.round(value * 10) / 10;

type Props = { id: string; product: Product; basketTypes: BasketType[]; insumos: InsumoVisual[] };

export default function EditorComposicion({ id, product, basketTypes, insumos }: Props) {
  const [variant, setVariant] = useState<Variant>("detail");
  const [items, setItems] = useState<ProductVisualItem[]>(product.visualItems);
  const [selected, setSelected] = useState(0);
  const [guardado, setGuardado] = useState<GuardarState | null>(null);
  const [cambios, setCambios] = useState(false);
  const [guardando, startGuardar] = useTransition();
  const [basketImage, setBasketImage] = useState(product.baseImage ?? basketTypes[0]?.image ?? "");
  const [aAgregar, setAAgregar] = useState("");

  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ index: number; offsetX: number; offsetY: number } | null>(null);

  const multiplier = variant === "detail" ? 1.65 : 1;
  const draft = { ...product, visualItems: items };
  const current = items[selected];

  const marcar = () => { setGuardado(null); setCambios(true); };

  function patch(index: number, changes: Partial<ProductVisualItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...changes } : item)));
    marcar();
  }

  function onPointerDown(event: React.PointerEvent<HTMLButtonElement>, index: number) {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const centerX = rect.left + (items[index].left / 100) * rect.width;
    const centerY = rect.top + (items[index].top / 100) * rect.height;
    dragRef.current = { index, offsetX: event.clientX - centerX, offsetY: event.clientY - centerY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(index);
  }

  function onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    const rect = stage.getBoundingClientRect();
    patch(drag.index, {
      left: clamp(((event.clientX - drag.offsetX - rect.left) / rect.width) * 100),
      top: clamp(((event.clientY - drag.offsetY - rect.top) / rect.height) * 100),
    });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.shiftKey ? 2 : 0.5;
    const moves: Record<string, [number, number]> = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    patch(index, { left: clamp(items[index].left + move[0]), top: clamp(items[index].top + move[1]) });
  }

  function guardar() {
    setGuardado(null);
    startGuardar(async () => {
      const r = await guardarComposicion(id, items);
      setGuardado(r);
      if (r.ok) setCambios(false);
    });
  }

  function restablecer() {
    setItems(product.visualItems);
    setSelected(0);
    setGuardado(null);
    setCambios(false);
  }

  // Cualquier insumo registrado se puede sumar; la foto sale de Catálogo → Fotos de productos.
  const disponibles = insumos.filter((ins) => !items.some((x) => x.name === ins.nombre));

  function agregar() {
    const ins = disponibles.find((x) => x.nombre === aAgregar);
    if (!ins) return;
    setItems((prev) => [...prev, { name: ins.nombre, emoji: ins.emoji, ...(ins.imagen ? { image: ins.imagen } : {}), top: 60, left: 50, size: 90, rotate: 0, zIndex: 20 }]);
    setSelected(items.length);
    setAAgregar("");
    marcar();
  }

  function quitar(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setSelected(0);
    marcar();
  }

  return (
    <div className="devEditor">
      <div className="devToolbar">
        <label>
          Canasta de fondo
          <select className="select" onChange={(event) => setBasketImage(event.target.value)} value={basketImage}>
            {basketTypes.map((type) => <option key={type.id} value={type.image}>{type.label}</option>)}
          </select>
        </label>
        <label>
          Vista
          <select className="select" onChange={(event) => setVariant(event.target.value as Variant)} value={variant}>
            <option value="detail">Página de producto</option>
            <option value="card">Tarjeta del catálogo</option>
          </select>
        </label>
        <button className="btn btnGhost" onClick={restablecer} type="button" disabled={!cambios}>Deshacer cambios</button>
      </div>

      <div className="devLayout">
        <div className={variant === "card" ? "devStageWrap devStageCard" : "devStageWrap"}>
          <div className="devStage" ref={stageRef}>
            <ProductComposition baseImage={basketImage} product={draft} variant={variant} />
            <div className="devOverlay">
              {items.map((item, index) => (
                <button
                  aria-label={`Mover ${item.name}`}
                  className={index === selected ? "devHandle devHandleActive" : "devHandle"}
                  key={item.name}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  onPointerDown={(event) => onPointerDown(event, index)}
                  onPointerMove={onPointerMove}
                  onPointerUp={() => { dragRef.current = null; }}
                  style={{
                    top: `${item.top}%`,
                    left: `${item.left}%`,
                    width: `${item.size * multiplier}px`,
                    height: `${item.size * multiplier}px`,
                    transform: `translate(-50%, -50%) rotate(${item.rotate ?? 0}deg)`,
                  }}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>

        <aside className="devPanel">
          <h3>Productos</h3>
          {items.length === 0 && <p className="devHint">Esta canasta aún no tiene composición. Agrega sus productos.</p>}
          <div className="devList">
            {items.map((item, index) => (
              <button className={index === selected ? "devListItem devListItemActive" : "devListItem"} key={item.name} onClick={() => setSelected(index)} type="button">
                <span>{item.emoji} {item.name}</span>
                <small>{round(item.left)} · {round(item.top)}</small>
              </button>
            ))}
          </div>

          {disponibles.length > 0 && (
            <div className="devAdd">
              <select className="select" value={aAgregar} onChange={(e) => setAAgregar(e.target.value)} aria-label="Producto a agregar">
                <option value="">Agregar producto…</option>
                {disponibles.map((it) => <option key={it.nombre} value={it.nombre}>{it.emoji} {it.nombre}{it.imagen ? "" : " (sin foto)"}</option>)}
              </select>
              <button className="btn btnGhost" type="button" onClick={agregar} disabled={!aAgregar}>Agregar</button>
            </div>
          )}
          <p className="devHint">¿Falta una foto? Súbela en <Link href="/admin/catalogo#productos">Fotos de productos</Link>.</p>

          {current && (
            <div className="devControls">
              <h3>{current.name} <button className="devRemove" type="button" onClick={() => quitar(selected)}>Quitar</button></h3>
              <label>
                Tamaño <strong>{current.size}px</strong>
                <input max="160" min="20" onChange={(event) => patch(selected, { size: Number(event.target.value) })} step="1" type="range" value={current.size} />
              </label>
              <label>
                Giro <strong>{current.rotate ?? 0}°</strong>
                <input max="45" min="-45" onChange={(event) => patch(selected, { rotate: Number(event.target.value) })} step="1" type="range" value={current.rotate ?? 0} />
              </label>
              <label>
                Capa (adelante / atrás) <strong>{current.zIndex ?? 5}</strong>
                <input max="30" min="1" onChange={(event) => patch(selected, { zIndex: Number(event.target.value) })} step="1" type="range" value={current.zIndex ?? 5} />
              </label>
              <p className="devHint">Arrastra sobre la imagen, o usa las flechas con el recuadro enfocado. Shift acelera el paso.</p>
            </div>
          )}
        </aside>
      </div>

      <div className="admFormFootRow">
        <button className="admBtn admBtnPrimary" onClick={guardar} type="button" disabled={guardando || !cambios}>{guardando ? "Guardando…" : "Guardar y publicar"}</button>
        {cambios && !guardando && <span className="admMuted admSmall">Cambios sin guardar</span>}
        {guardado?.ok && <span className="admSuccess" role="status">Publicado en la tienda.</span>}
        {guardado?.error && <span className="admError" role="alert">{guardado.error}</span>}
      </div>
    </div>
  );
}
