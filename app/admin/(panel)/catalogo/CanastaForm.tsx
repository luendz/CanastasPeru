"use client";

import { useActionState, useState } from "react";
import { soles } from "@/lib/admin/format";
import type { TipoCanasta } from "@/lib/admin/types";
import { separarInsignias } from "@/lib/mock-data";
import { crearCanasta, guardarCanasta, type FormState } from "./actions";

export type CanastaEditable = {
  id?: string;
  slug?: string;
  nombre: string;
  categoria: string;
  precio: number | null;
  precio_anterior: number | null;
  insignia: string | null;
  descripcion: string;
  descripcion_completa: string;
  emoji: string;
  tipo_canasta_base: string;
  orden: number;
  activo: boolean;
};

const MAX_INSIGNIAS = 3;

const slugDe = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function CanastaForm({ canasta, tipos, categorias, insignias }: { canasta: CanastaEditable; tipos: TipoCanasta[]; categorias: string[]; insignias: string[] }) {
  const nueva = !canasta.id;
  const [state, action, pending] = useActionState<FormState, FormData>(nueva ? crearCanasta : guardarCanasta, {});
  const [nombre, setNombre] = useState(canasta.nombre);
  const [slug, setSlug] = useState(canasta.slug ?? "");
  const [slugTocado, setSlugTocado] = useState(false);
  const [precio, setPrecio] = useState(canasta.precio?.toString() ?? "");
  const [anterior, setAnterior] = useState(canasta.precio_anterior?.toString() ?? "");
  const [lista, setLista] = useState(() => separarInsignias(canasta.insignia).slice(0, MAX_INSIGNIAS));
  const [textoInsignia, setTextoInsignia] = useState("");
  const [activo, setActivo] = useState(canasta.activo);

  function confirmarInsignia(valor: string) {
    const nuevas = separarInsignias(valor);
    setLista((l) => [...new Set([...l, ...nuevas])].slice(0, MAX_INSIGNIAS));
    setTextoInsignia("");
  }

  const p = Number(precio);
  const a = Number(anterior);
  const ahorro = anterior && a > p ? a - p : 0;

  return (
    <form action={action} className="admForm admFormGrid">
      {canasta.id && <input type="hidden" name="id" value={canasta.id} />}

      <label className="admSpan2">Nombre del modelo
        <input className="admInput" name="nombre" required maxLength={120} value={nombre}
          onChange={(e) => { setNombre(e.target.value); if (nueva && !slugTocado) setSlug(slugDe(e.target.value)); }} />
      </label>

      {nueva ? (
        <label className="admSpan2">Dirección web
          <span className="admSlug"><span>/producto/</span>
            <input className="admInput" name="slug" required maxLength={60} value={slug} onChange={(e) => { setSlugTocado(true); setSlug(slugDe(e.target.value)); }} />
          </span>
        </label>
      ) : (
        <p className="admSpan2 admMuted admSmall">Dirección web: <code>/producto/{canasta.slug}</code> (no se puede cambiar para no romper enlaces).</p>
      )}

      <div className="admFormColumna">
        <label>Categoría
          <input className="admInput" name="categoria" required maxLength={60} defaultValue={canasta.categoria} list="categorias" />
          <datalist id="categorias">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label>Descripción corta
          <textarea className="admInput" name="descripcion" rows={3} maxLength={400} defaultValue={canasta.descripcion} />
          <small className="admMuted">Se muestra debajo del nombre, en la página del producto.</small>
        </label>
        {nueva && (
          <label>Precio de ese envase (S/)
            <input className="admInput" name="precio" type="number" min="0.01" step="0.01" required value={precio} onChange={(e) => setPrecio(e.target.value)} />
          </label>
        )}
        <label>Precio tachado (opcional)
          <input className="admInput" name="precio_anterior" type="number" min="0.01" step="0.01" value={anterior} onChange={(e) => setAnterior(e.target.value)} placeholder="Ej. 179.90" />
        </label>
        <label>Insignia (opcional)
          <input type="hidden" name="insignia" value={lista.join(", ")} />
          <span className="admTagCampo">
            {lista.map((i) => (
              <span className="admTag" key={i}>
                {i}
                <button type="button" aria-label={`Quitar insignia ${i}`} onClick={() => setLista((l) => l.filter((x) => x !== i))}>×</button>
              </span>
            ))}
            {lista.length < MAX_INSIGNIAS && (
              <input
                maxLength={30}
                list="insignias"
                value={textoInsignia}
                aria-label="Agregar insignia"
                placeholder={lista.length ? "Agregar otra…" : "Más vendida, Recomendada…"}
                onChange={(e) => {
                  // Elegir una sugerencia o escribir una coma la agrega directamente.
                  if (e.target.value.includes(",") || insignias.includes(e.target.value)) confirmarInsignia(e.target.value);
                  else setTextoInsignia(e.target.value);
                }}
                onBlur={() => confirmarInsignia(textoInsignia)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    confirmarInsignia(textoInsignia);
                  }
                  if (e.key === "Backspace" && !textoInsignia) setLista((l) => l.slice(0, -1));
                }}
              />
            )}
          </span>
          <datalist id="insignias">{insignias.filter((i) => !lista.includes(i)).map((i) => <option key={i} value={i} />)}</datalist>
          <small className="admMuted">Escribe y presiona Enter. Hasta {MAX_INSIGNIAS} por canasta.</small>
        </label>
        <label>Emoji de respaldo
          <input className="admInput" name="emoji" maxLength={8} defaultValue={canasta.emoji} />
        </label>
      </div>

      <div className="admFormColumna">
        <label>{nueva ? "Envase" : "Envase principal"}
          <select className="admInput" name="tipo_canasta_base" defaultValue={canasta.tipo_canasta_base} required>
            {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </label>
        <label>Descripción completa
          <textarea className="admInput" name="descripcion_completa" rows={6} maxLength={2000} defaultValue={canasta.descripcion_completa} />
          <small className="admMuted">Información adicional. Se muestra debajo de la foto, en la página del producto.</small>
        </label>
        <label>Orden en el catálogo
          <input className="admInput" name="orden" type="number" step="1" defaultValue={canasta.orden} />
        </label>
        {!nueva && (
          <div className="admField">
            <span className="admFieldLabel">Estado</span>
            {activo && <input type="hidden" name="activo" value="on" />}
            <button type="button" className="admToggle" aria-pressed={activo} aria-label="Estado de la canasta en la tienda" onClick={() => setActivo((a) => !a)}>
              <span />{activo ? "Activa" : "Inactiva"}
            </button>
            <small className="admMuted">Si está activa, se muestra en la tienda.</small>
          </div>
        )}
      </div>

      <div className="admSpan2 admPreview" aria-label="Vista previa del precio">
        {lista.map((i) => <span className="admBadge" key={i}>{i}</span>)}
        <strong>{nombre || "Nombre de la canasta"}</strong>
        <span>{soles(p || 0)}</span>
        {ahorro > 0 && <><del>{soles(a)}</del><small>Ahorras {soles(ahorro)}</small></>}
      </div>

      <div className="admSpan2 admFormFoot">
        {state.error && <p className="admError" role="alert">{state.error}</p>}
        {state.ok && <p className="admSuccess" role="status">Cambios guardados. Ya se ven en la tienda.</p>}
        {nueva && <p className="admMuted admSmall">La canasta se crea <strong>oculta</strong>. Actívala cuando tenga receta y composición.</p>}
        <button className="admBtn admBtnPrimary" type="submit" disabled={pending}>{pending ? "Guardando…" : nueva ? "Crear canasta" : "Guardar cambios"}</button>
      </div>
    </form>
  );
}
