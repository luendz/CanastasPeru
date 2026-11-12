"use client";

import { useActionState, useState } from "react";
import SelectorImagen from "../medios/SelectorImagen";
import AjusteFotoBox from "./AjusteFotoBox";
import { AJUSTE_FOTO_NEUTRO, type AjusteFoto } from "./foto";
import { guardarBox, type BoxState } from "./actions";

export type BoxDatos = { id?: string; nombre: string; precio: number | null; imagen: string | null; descripcion: string; incluye: string[]; activo: boolean; ajuste?: AjusteFoto };

/** Formulario simple de un box: foto, nombre, precio y lo que incluye (en orden). */
export default function BoxForm({ box, puedeActivar }: { box: BoxDatos; puedeActivar: boolean }) {
  const [estado, accion, enviando] = useActionState<BoxState, FormData>(guardarBox, {});
  // Cada fila lleva una clave propia para que React no confunda filas al moverlas.
  const [filas, setFilas] = useState(() => (box.incluye.length ? box.incluye : [""]).map((texto, n) => ({ k: n, texto })));
  const [sig, setSig] = useState(filas.length);
  // Lo que se ve en la vista previa de la tarjeta.
  const [imagen, setImagen] = useState(box.imagen ?? "");
  const [nombre, setNombre] = useState(box.nombre);
  const [precio, setPrecio] = useState(box.precio == null ? "" : String(box.precio));
  const [ajuste, setAjuste] = useState<AjusteFoto>(box.ajuste ?? AJUSTE_FOTO_NEUTRO);

  const cambiar = (k: number, texto: string) => setFilas((f) => f.map((x) => (x.k === k ? { ...x, texto } : x)));
  const quitar = (k: number) => setFilas((f) => (f.length > 1 ? f.filter((x) => x.k !== k) : [{ ...f[0], texto: "" }]));
  const mover = (n: number, d: number) => setFilas((f) => {
    const m = n + d;
    if (m < 0 || m >= f.length) return f;
    const c = [...f];
    [c[n], c[m]] = [c[m], c[n]];
    return c;
  });
  const agregar = () => { setFilas((f) => [...f, { k: sig, texto: "" }]); setSig((s) => s + 1); };

  return (
    <form action={accion} className="admForm admBoxForm">
      {box.id && <input type="hidden" name="id" value={box.id} />}
      <div className="admBoxGrid">
        <div className="admBoxFoto">
          <SelectorImagen name="imagen" defaultValue={box.imagen} label="Foto del box (imagen completa)" onChange={setImagen} />
          <p className="admMuted admSmall">Ajusta su tamaño y posición abajo, viendo la tarjeta del catálogo.</p>
        </div>
        <div className="admForm">
          <label>Nombre<input className="admInput" name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={120} placeholder="Ej. Box Corporate Premium" required /></label>
          <label>Precio (S/, incluye IGV)<input className="admInput" name="precio" inputMode="decimal" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Ej. 129.90" required /></label>
          <label>Descripción corta (opcional)<textarea className="admInput" name="descripcion" defaultValue={box.descripcion} maxLength={300} rows={2} placeholder="Ej. Regalo empresarial elegante, ideal para colaboradores y clientes." /></label>
          <label className="admCheck">
            <input type="checkbox" name="activo" defaultChecked={box.activo} disabled={!puedeActivar} />
            Activo: se muestra en la web
          </label>
        </div>
      </div>

      <input type="hidden" name="foto_x" value={ajuste.x} />
      <input type="hidden" name="foto_y" value={ajuste.y} />
      <input type="hidden" name="foto_escala" value={ajuste.escala} />
      <AjusteFotoBox
        ajuste={ajuste}
        onAjuste={setAjuste}
        nombre={nombre.trim()}
        precio={Number(precio.replace(",", ".")) || 0}
        imagen={imagen}
        incluye={filas.map((f) => f.texto.trim()).filter(Boolean)}
      />

      <fieldset className="admBoxIncluye">
        <legend>¿Qué incluye? <small className="admMuted">Una línea por producto, en el orden en que se verá.</small></legend>
        <ol>
          {filas.map((f, n) => (
            <li key={f.k}>
              <span className="admBoxNum">{n + 1}</span>
              <input className="admInput" name="incluye" value={f.texto} onChange={(e) => cambiar(f.k, e.target.value)} maxLength={160} placeholder="Ej. 01 Vino Intipalka 375 ml" aria-label={`Producto ${n + 1}`} />
              <button type="button" className="admIconBtn" onClick={() => mover(n, -1)} disabled={n === 0} aria-label="Subir">↑</button>
              <button type="button" className="admIconBtn" onClick={() => mover(n, 1)} disabled={n === filas.length - 1} aria-label="Bajar">↓</button>
              <button type="button" className="admLinkDanger" onClick={() => quitar(f.k)} aria-label={`Quitar producto ${n + 1}`}>Quitar</button>
            </li>
          ))}
        </ol>
        <button type="button" className="admLinkMuted" onClick={agregar}>+ Agregar producto</button>
      </fieldset>

      {estado.error && <p className="admError" role="alert">{estado.error}</p>}
      {estado.ok && <p className="admSuccess" role="status">Guardado.</p>}
      <div className="admFormFootRow">
        <button className="admBtn" type="submit" disabled={enviando}>{enviando ? "Guardando…" : box.id ? "Guardar cambios" : "Crear box"}</button>
      </div>
    </form>
  );
}
