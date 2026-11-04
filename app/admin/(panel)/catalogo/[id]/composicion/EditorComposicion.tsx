"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import ProductComposition, { AJUSTE_NEUTRO, anchoProducto, hitsVisiblePixel, marco } from "@/components/ProductComposition";
import type { AjusteEnvase, BasketType, Product, ProductVisualItem } from "@/lib/mock-data";
import { guardarComposicion, type GuardarState } from "./actions";

type Variant = "card" | "detail";
export type InsumoVisual = { nombre: string; emoji: string; imagen: string | null };

const normalizar = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const clamp = (value: number) => Math.min(100, Math.max(0, value));
/** En la selección, el envase va aparte de los productos. */
const SEL_ENVASE = -1;
/** Lo que se ve en la tienda: el recuadro cuadrado (tarjeta, detalle, carrito) y el del inicio (4:3). */
const MARCOS = [
  { etiqueta: "Catálogo y detalle", ...marco(1) },
  { etiqueta: "Inicio", ...marco(0.75) },
];

/** `basketTypes` son los envases de la canasta; `product.ajustesEnvase` va por id de envase. */
type Props = { id: string; product: Product; basketTypes: BasketType[]; insumos: InsumoVisual[] };

export default function EditorComposicion({ id, product, basketTypes, insumos }: Props) {
  const [variant, setVariant] = useState<Variant>("detail");
  const [items, setItems] = useState<ProductVisualItem[]>(product.visualItems);
  const [selected, setSelected] = useState(0);
  const [encima, setEncima] = useState<number | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [guardado, setGuardado] = useState<GuardarState | null>(null);
  const [cambios, setCambios] = useState(false);
  const [guardando, startGuardar] = useTransition();
  const [envaseId, setEnvaseId] = useState(basketTypes.find((t) => t.id === product.baseType)?.id ?? basketTypes[0]?.id ?? "");
  const [ajustes, setAjustes] = useState(product.ajustesEnvase ?? {});
  // Recuadro de la foto del envase sin ajustar, en % del lienzo: depende de la forma de cada foto.
  const [cajaEnvase, setCajaEnvase] = useState({ left: 18.5, top: 26, width: 63, height: 63 });
  const [busqueda, setBusqueda] = useState("");
  const [desplegado, setDesplegado] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ index: number; offsetX: number; offsetY: number } | null>(null);
  const envaseRef = useRef<HTMLButtonElement>(null);

  const envase = basketTypes.find((t) => t.id === envaseId);
  const basketImage = envase?.image ?? "";
  const nombreEnvase = envase?.label ?? "Envase";
  const ajuste = ajustes[envaseId] ?? AJUSTE_NEUTRO;
  const draft = { ...product, visualItems: items, ajustesEnvase: ajustes };
  const current = items[selected];
  const centroEnvase = { left: cajaEnvase.left + cajaEnvase.width / 2, top: cajaEnvase.top + cajaEnvase.height / 2 };
  const centro = (index: number) => (index === SEL_ENVASE ? { left: centroEnvase.left + ajuste.x, top: centroEnvase.top + ajuste.y } : items[index]);

  useEffect(() => {
    const foto = stageRef.current?.querySelector("img");
    const lienzo = foto?.parentElement;
    if (!foto || !lienzo) return;
    const medir = () => setCajaEnvase({
      left: (foto.offsetLeft / lienzo.offsetWidth) * 100,
      top: (foto.offsetTop / lienzo.offsetHeight) * 100,
      width: (foto.offsetWidth / lienzo.offsetWidth) * 100,
      height: (foto.offsetHeight / lienzo.offsetHeight) * 100,
    });
    if (foto.complete) requestAnimationFrame(medir);
    else foto.addEventListener("load", medir, { once: true });
  }, [basketImage]);

  const marcar = () => { setGuardado(null); setCambios(true); };

  function patch(index: number, changes: Partial<ProductVisualItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...changes } : item)));
    marcar();
  }

  function patchEnvase(changes: Partial<AjusteEnvase>) {
    setAjustes((prev) => ({ ...prev, [envaseId]: { ...(prev[envaseId] ?? AJUSTE_NEUTRO), ...changes } }));
    marcar();
  }

  function mover(index: number, left: number, top: number) {
    if (index === SEL_ENVASE) patchEnvase({ x: clamp(left) - centroEnvase.left, y: clamp(top) - centroEnvase.top });
    else patch(index, { left: clamp(left), top: clamp(top) });
  }

  /** Lo que hay bajo el puntero: el producto por su silueta (el de más adelante primero) o, si no, el envase. */
  function elegir(clientX: number, clientY: number): number | null {
    const stage = stageRef.current;
    if (!stage) return null;
    const capas = new Map([...stage.querySelectorAll<HTMLElement>("[data-indice]")].map((el) => [Number(el.dataset.indice), el]));
    const orden = items.map((item, index) => ({ index, z: item.zIndex ?? 5, giro: item.rotate ?? 0 })).sort((a, b) => b.z - a.z || b.index - a.index);
    const hit = orden.find(({ index, giro }) => {
      const capa = capas.get(index);
      return capa ? hitsVisiblePixel(capa, giro, clientX, clientY) : false;
    });
    if (hit) return hit.index;
    const caja = envaseRef.current?.getBoundingClientRect();
    return caja && clientX >= caja.left && clientX <= caja.right && clientY >= caja.top && clientY <= caja.bottom ? SEL_ENVASE : null;
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const stage = stageRef.current;
    const index = elegir(event.clientX, event.clientY);
    if (!stage || index === null) return;
    const rect = stage.getBoundingClientRect();
    const centerX = rect.left + (centro(index).left / 100) * rect.width;
    const centerY = rect.top + (centro(index).top / 100) * rect.height;
    dragRef.current = { index, offsetX: event.clientX - centerX, offsetY: event.clientY - centerY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelected(index);
    setArrastrando(true);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) {
      setEncima(elegir(event.clientX, event.clientY));
      return;
    }
    const rect = stage.getBoundingClientRect();
    mover(drag.index, ((event.clientX - drag.offsetX - rect.left) / rect.width) * 100, ((event.clientY - drag.offsetY - rect.top) / rect.height) * 100);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.shiftKey ? 2 : 0.5;
    const moves: Record<string, [number, number]> = { ArrowUp: [0, -step], ArrowDown: [0, step], ArrowLeft: [-step, 0], ArrowRight: [step, 0] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    mover(index, centro(index).left + move[0], centro(index).top + move[1]);
  }

  function guardar() {
    setGuardado(null);
    startGuardar(async () => {
      const r = await guardarComposicion(id, items, ajustes);
      setGuardado(r);
      if (r.ok) setCambios(false);
    });
  }

  function restablecer() {
    setItems(product.visualItems);
    setAjustes(product.ajustesEnvase ?? {});
    setSelected(0);
    setGuardado(null);
    setCambios(false);
  }

  // Solo se suman productos del contenido de la canasta; la foto sale de su ficha en Artículos.
  // Sin texto muestra todos; al escribir filtra por cualquier parte del nombre (sin tildes ni mayúsculas, varias palabras).
  const resultados = useMemo(() => {
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);
    return insumos
      .filter((ins) => !items.some((x) => x.name === ins.nombre))
      .filter((ins) => palabras.every((w) => normalizar(ins.nombre).includes(w)));
  }, [busqueda, insumos, items]);

  function agregar(ins: InsumoVisual) {
    setItems((prev) => [...prev, { name: ins.nombre, emoji: ins.emoji, ...(ins.imagen ? { image: ins.imagen } : {}), top: 60, left: 50, size: 90, rotate: 0, zIndex: 20 }]);
    setSelected(items.length);
    setBusqueda("");
    setDesplegado(false);
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
          <select className="select" onChange={(event) => setEnvaseId(event.target.value)} value={envaseId}>
            {basketTypes.map((type) => <option key={type.id} value={type.id}>{type.label}{type.id === product.baseType ? " (principal)" : ""}</option>)}
          </select>
        </label>
        <label>
          Vista
          <select className="select" onChange={(event) => setVariant(event.target.value as Variant)} value={variant}>
            <option value="detail">Grande</option>
            <option value="card">Tamaño de tarjeta</option>
          </select>
        </label>
        <button className="admBtn" onClick={restablecer} type="button" disabled={!cambios}>Deshacer cambios</button>
        <div className="devGuardar">
          {cambios && !guardando && <span className="admMuted admSmall">Cambios sin guardar</span>}
          {guardado?.ok && <span className="admSuccess" role="status">Publicado en la tienda.</span>}
          {guardado?.error && <span className="admError" role="alert">{guardado.error}</span>}
          <button className="admBtn admBtnPrimary" onClick={guardar} type="button" disabled={guardando || !cambios}>{guardando ? "Guardando…" : "Guardar y publicar"}</button>
        </div>
      </div>

      <div className="devLayout">
        <div className="devColumna">
        <div className={variant === "card" ? "devStageWrap devStageCard" : "devStageWrap"}>
          <div className="devStage" ref={stageRef}>
            <ProductComposition
              baseImage={basketImage}
              envaseId={envaseId}
              product={draft}
              variant={variant}
              encuadrar={false}
              resaltado={encima !== null && encima !== SEL_ENVASE ? encima : selected >= 0 ? selected : null}
            />
            <div className="devOverlay">
              {MARCOS.map((m) => (
                <div
                  aria-hidden="true"
                  className="devMarco"
                  key={m.etiqueta}
                  style={{ left: `${m.izquierda}%`, width: `${m.ancho}%`, top: `${(m.arriba / 75) * 100}%`, height: `${(m.alto / 75) * 100}%` }}
                >
                  <span>{m.etiqueta}</span>
                </div>
              ))}
              {/* El envase se marca con su recuadro; los productos, con su silueta. Los botones sirven para el teclado. */}
              <button
                aria-label={`Mover envase ${nombreEnvase}`}
                className={`devHandle devHandleEnvase${selected === SEL_ENVASE ? " devHandleActive" : encima === SEL_ENVASE ? " devHandleEncima" : ""}`}
                onFocus={() => setSelected(SEL_ENVASE)}
                onKeyDown={(event) => onKeyDown(event, SEL_ENVASE)}
                ref={envaseRef}
                style={{
                  top: `${centro(SEL_ENVASE).top}%`,
                  left: `${centro(SEL_ENVASE).left}%`,
                  width: `${cajaEnvase.width * ajuste.escala / 100}%`,
                  height: `${cajaEnvase.height * ajuste.escala / 100}%`,
                  transform: `translate(-50%, -50%) rotate(${ajuste.giro}deg)`,
                }}
                type="button"
              />
              {items.map((item, index) => (
                <button
                  aria-label={`Mover ${item.name}`}
                  className="devHandle devHandleTeclado"
                  key={item.name}
                  onFocus={() => setSelected(index)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  style={{
                    top: `${item.top}%`,
                    left: `${item.left}%`,
                    width: anchoProducto(item.size),
                    height: anchoProducto(item.size),
                    transform: `translate(-50%, -50%) rotate(${item.rotate ?? 0}deg)`,
                  }}
                  type="button"
                />
              ))}
              <div
                className="devCaptura"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={() => { dragRef.current = null; setArrastrando(false); }}
                onPointerLeave={() => setEncima(null)}
                style={{ cursor: arrastrando ? "grabbing" : encima !== null ? "grab" : "default" }}
              />
              {/* La ✕ va encima de todo, solo en el producto elegido. */}
              {items.map((item, index) => index === selected && (
                <div
                  className="devQuitarCaja"
                  key={item.name}
                  style={{
                    top: `${item.top}%`,
                    left: `${item.left}%`,
                    width: anchoProducto(item.size),
                    height: anchoProducto(item.size),
                    transform: `translate(-50%, -50%) rotate(${item.rotate ?? 0}deg)`,
                  }}
                >
                  <button className="devQuitar" type="button" aria-label={`Quitar ${item.name}`} title={`Quitar ${item.name}`} onClick={() => quitar(index)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
          {selected === SEL_ENVASE && (
            <div className="devControls">
              <h3>Envase: {nombreEnvase} <button className="devRemove" type="button" onClick={() => patchEnvase(AJUSTE_NEUTRO)}>Restablecer</button></h3>
              <div className="devSliders">
                <label>
                  Tamaño <strong>{ajuste.escala}%</strong>
                  <input max="200" min="40" onChange={(event) => patchEnvase({ escala: Number(event.target.value) })} step="1" type="range" value={ajuste.escala} />
                </label>
                <label>
                  Giro <strong>{ajuste.giro}°</strong>
                  <input max="45" min="-45" onChange={(event) => patchEnvase({ giro: Number(event.target.value) })} step="1" type="range" value={ajuste.giro} />
                </label>
              </div>
              <p className="devHint">Arrastra sobre la imagen, o usa las flechas con el recuadro enfocado. Este ajuste vale solo para este envase en esta canasta.</p>
            </div>
          )}
          {current && (
            <div className="devControls">
              <h3>{current.name} <button className="devRemove" type="button" onClick={() => quitar(selected)}>Quitar</button></h3>
              <div className="devSliders">
                <label>
                  Tamaño <strong>{current.size}</strong>
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
              </div>
              <p className="devHint">Arrastra sobre la imagen, o usa las flechas con el recuadro enfocado. Shift acelera el paso.</p>
            </div>
          )}
        </div>

        <aside className="devPanel">
          <h3>Envase</h3>
          <div className="devList">
            <button className={selected === SEL_ENVASE ? "devListItem devListItemActive" : "devListItem"} onClick={() => setSelected(SEL_ENVASE)} type="button">
              <span>🧺 {nombreEnvase}</span>
            </button>
          </div>
          <h3>Productos</h3>
          {items.length === 0 && <p className="devHint">Esta canasta aún no tiene composición. Agrega sus productos.</p>}
          <div className="devList">
            {items.map((item, index) => (
              <button className={index === selected ? "devListItem devListItemActive" : "devListItem"} key={item.name} onClick={() => setSelected(index)} type="button">
                <span>{item.emoji} {item.name}</span>
                {!insumos.some((ins) => ins.nombre === item.name) && <small className="admWarn"> · no está en el contenido</small>}
              </button>
            ))}
          </div>

          <div className="admBuscador devDesplegable">
            <input
              className="admInput"
              type="text"
              role="combobox"
              aria-expanded={desplegado}
              aria-label="Agregar producto: elige de la lista o escribe para buscar"
              placeholder="Agregar producto…"
              autoComplete="off"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setDesplegado(true); }}
              onClick={() => setDesplegado((d) => !d)}
              onBlur={() => setDesplegado(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (desplegado && resultados[0]) agregar(resultados[0]);
                  else setDesplegado(true);
                }
                if (e.key === "Escape") setDesplegado(false);
                if (e.key === "ArrowDown") setDesplegado(true);
              }}
            />
            {desplegado && (
              <ul className="admBuscadorLista" role="listbox">
                {resultados.length ? resultados.map((ins) => (
                  <li key={ins.nombre}>
                    {/* onMouseDown evita que el campo pierda el foco y cierre la lista antes del clic. */}
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => agregar(ins)}>
                      <span>{ins.emoji} {ins.nombre}</span>
                      {!ins.imagen && <small>sin foto</small>}
                    </button>
                  </li>
                )) : <li className="admMuted admSmall">{busqueda ? "Sin resultados." : insumos.length ? "Todos los productos del contenido ya están en la imagen." : "Esta canasta aún no tiene contenido."}</li>}
              </ul>
            )}
          </div>
          <p className="devHint">Solo se pueden agregar los productos del contenido (pestaña Contenido y envases). ¿Falta una foto? Súbela en <Link href="/admin/productos">Artículos</Link>.</p>

        </aside>
      </div>

    </div>
  );
}
