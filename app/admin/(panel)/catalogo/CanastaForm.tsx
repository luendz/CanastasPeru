"use client";

import { useActionState, useState } from "react";
import { soles } from "@/lib/admin/format";
import type { TipoCanasta } from "@/lib/admin/types";
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
  emoji: string;
  tipo_canasta_base: string;
  orden: number;
  activo: boolean;
};

const slugDe = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function CanastaForm({ canasta, tipos, categorias }: { canasta: CanastaEditable; tipos: TipoCanasta[]; categorias: string[] }) {
  const nueva = !canasta.id;
  const [state, action, pending] = useActionState<FormState, FormData>(nueva ? crearCanasta : guardarCanasta, {});
  const [nombre, setNombre] = useState(canasta.nombre);
  const [slug, setSlug] = useState(canasta.slug ?? "");
  const [slugTocado, setSlugTocado] = useState(false);
  const [precio, setPrecio] = useState(canasta.precio?.toString() ?? "");
  const [anterior, setAnterior] = useState(canasta.precio_anterior?.toString() ?? "");
  const [insignia, setInsignia] = useState(canasta.insignia ?? "");

  const p = Number(precio);
  const a = Number(anterior);
  const ahorro = anterior && a > p ? a - p : 0;

  return (
    <form action={action} className="admForm admFormGrid">
      {canasta.id && <input type="hidden" name="id" value={canasta.id} />}

      <label className="admSpan2">Nombre
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

      <label>Categoría
        <input className="admInput" name="categoria" required maxLength={60} defaultValue={canasta.categoria} list="categorias" />
        <datalist id="categorias">{categorias.map((c) => <option key={c} value={c} />)}</datalist>
      </label>
      <label>Tipo de canasta
        <select className="admInput" name="tipo_canasta_base" defaultValue={canasta.tipo_canasta_base} required>
          {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
      </label>

      <label>Precio (S/)
        <input className="admInput" name="precio" type="number" min="0.01" step="0.01" required value={precio} onChange={(e) => setPrecio(e.target.value)} />
      </label>
      <label>Precio tachado (opcional)
        <input className="admInput" name="precio_anterior" type="number" min="0.01" step="0.01" value={anterior} onChange={(e) => setAnterior(e.target.value)} placeholder="Ej. 179.90" />
      </label>

      <label>Insignia (opcional)
        <input className="admInput" name="insignia" maxLength={40} value={insignia} onChange={(e) => setInsignia(e.target.value)} placeholder="Más vendida, Recomendada…" />
      </label>
      <label>Orden en el catálogo
        <input className="admInput" name="orden" type="number" step="1" defaultValue={canasta.orden} />
      </label>

      <label className="admSpan2">Descripción
        <textarea className="admInput" name="descripcion" rows={3} maxLength={400} defaultValue={canasta.descripcion} />
      </label>

      <label>Emoji de respaldo
        <input className="admInput" name="emoji" maxLength={8} defaultValue={canasta.emoji} />
      </label>
      {!nueva && (
        <label className="admCheck">
          <input type="checkbox" name="activo" defaultChecked={canasta.activo} />
          <span>Visible en la tienda</span>
        </label>
      )}

      <div className="admSpan2 admPreview" aria-label="Vista previa del precio">
        {insignia && <span className="admBadge">{insignia}</span>}
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
