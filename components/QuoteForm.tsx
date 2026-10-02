"use client";

import { useActionState, useState } from "react";
import { solicitarCotizacion, type CotizacionState } from "@/app/(sitio)/cotizacion/actions";
import Icono, { type NombreIcono } from "@/components/Icono";
import type { Contenido } from "@/lib/contenido";
import { DIAS_ANTICIPACION, DIAS_REPARTO_TEXTO, fechaReparto } from "@/lib/entrega";
import { LINEAS } from "@/lib/lineas";

type Props = {
  opciones: Pick<Contenido["cotizacion"], "cantidades" | "presupuestos" | "personalizacion" | "notaEntrega">;
  lineas: Contenido["catalogo"]["lineas"];
  distritos: string[];
  /** Días de reparto disponibles (martes, jueves y sábados, desde hoy + 5 días). */
  fechas: string[];
};

const ICONOS_PERSONALIZACION: NombreIcono[] = ["logo", "lazo", "tarjeta", "caja"];

function Seccion({ n, titulo, nota, children }: { n: number; titulo: string; nota?: string; children: React.ReactNode }) {
  return (
    <fieldset className="cotSeccion" style={{ "--i": n } as React.CSSProperties}>
      <legend>
        <span className="cotNum">{String(n).padStart(2, "0")}</span>
        {titulo}
        {nota && <small>{nota}</small>}
      </legend>
      {children}
    </fieldset>
  );
}

export default function QuoteForm({ opciones, lineas, distritos, fechas }: Props) {
  const cantidades = opciones.cantidades;
  const [tipos, setTipos] = useState<string[]>([]);
  const [cantidad, setCantidad] = useState<number | "">("");
  const [exacta, setExacta] = useState("");
  const [presupuesto, setPresupuesto] = useState("");
  const [state, action, pending] = useActionState<CotizacionState, FormData>(solicitarCotizacion, {});
  // Estado ya mostrado y cerrado; sirve para volver al formulario y enviar otra solicitud.
  const [cerrado, setCerrado] = useState<CotizacionState | null>(null);

  const opcionesTipo = [
    ...LINEAS.map((l, n) => ({ id: l.titulo, titulo: lineas[n]?.titulo ?? l.titulo, imagen: lineas[n]?.imagen ?? "" })),
    { id: "Aún no lo tengo definido", titulo: "Aún no lo tengo definido", imagen: "" },
  ];
  const alternar = (id: string) =>
    setTipos((t) => (id === "Aún no lo tengo definido" ? (t.includes(id) ? [] : [id]) : t.includes(id) ? t.filter((x) => x !== id) : [...t.filter((x) => x !== "Aún no lo tengo definido"), id]));
  const cantidadFinal = exacta ? Number(exacta) : cantidad;

  if (state.enviada && state !== cerrado) {
    return (
      <div className="cotCard cotEnviada">
        <div className="successSeal" aria-hidden="true">
          <svg viewBox="0 0 52 52"><path d="m15 27 7.5 7.5L38 18.5" /></svg>
        </div>
        <h2>¡Solicitud <em>lista</em>!</h2>
        <p>
          {state.numero ? <>Registramos tu solicitud <strong>{state.numero}</strong>. </> : null}
          Te responderemos con una propuesta personalizada por WhatsApp o correo electrónico.
        </p>
        <button type="button" className="btn btnGhost" onClick={() => setCerrado(state)}>Enviar otra solicitud</button>
      </div>
    );
  }

  return (
    <form className="cotForm" action={action} key={cerrado ? cerrado.numero ?? "demo" : "nuevo"}>
      <input type="hidden" name="cantidad_estimada" value={cantidadFinal || ""} />
      <input type="hidden" name="presupuesto" value={presupuesto} />
      {tipos.map((t) => <input key={t} type="hidden" name="canastas_base" value={t} />)}

      <Seccion n={1} titulo="Datos de tu empresa" nota="Los campos marcados con * son obligatorios.">
        <div className="cotGrid">
          <label>Empresa / Razón social *<input className="input" name="empresa" autoComplete="organization" placeholder="Ej. Nombre de la empresa" required maxLength={200} /></label>
          <label>RUC *<input className="input" name="ruc" inputMode="numeric" pattern="\d{11}" title="11 dígitos" maxLength={11} placeholder="20XXXXXXXXX" required /></label>
          <label>Nombre de contacto *<input className="input" name="contacto" autoComplete="name" placeholder="Nombre completo" required maxLength={160} /></label>
          <label>Cargo (opcional)<input className="input" name="cargo" autoComplete="organization-title" placeholder="Ej. Jefa de RR. HH." maxLength={120} /></label>
          <label>Correo electrónico *<input className="input" name="email" type="email" autoComplete="email" placeholder="correo@empresa.com" required maxLength={160} /></label>
          <label>Celular / WhatsApp *
            <span className="cotTelefono"><span aria-hidden="true">🇵🇪 +51</span><input className="input" name="telefono" type="tel" autoComplete="tel" placeholder="999 999 999" required maxLength={40} /></span>
          </label>
        </div>
      </Seccion>

      <Seccion n={2} titulo="Cuéntanos sobre tu pedido">
        <p className="cotPregunta">¿Qué tipo de canasta estás buscando?</p>
        <div className="cotTipos">
          {opcionesTipo.map((o) => (
            <label key={o.id} className="cotTipo" data-activo={tipos.includes(o.id) || undefined}>
              <input type="checkbox" checked={tipos.includes(o.id)} onChange={() => alternar(o.id)} />
              <span className="cotTipoImg" aria-hidden="true">{o.imagen ? <img src={o.imagen} alt="" /> : <Icono nombre={o.id === "Aún no lo tengo definido" ? "chat" : "regalo"} />}</span>
              <span className="cotTipoTexto">{o.titulo}</span>
            </label>
          ))}
        </div>

        <div className="cotFila">
          <div>
            <p className="cotPregunta">¿Cuántas canastas necesitas?</p>
            <div className="chipRow" role="group" aria-label="Cantidades frecuentes">
              {cantidades.map((q, n) => (
                <button key={q} type="button" className="chip" aria-pressed={!exacta && cantidad === q} onClick={() => { setCantidad(q); setExacta(""); }}>
                  {q}{n === cantidades.length - 1 ? "+" : ""}
                </button>
              ))}
            </div>
          </div>
          <label className="cotExacta">Cantidad exacta (opcional)
            <span><input className="input" inputMode="numeric" value={exacta} onChange={(e) => setExacta(e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="Ej. 85" /> canastas</span>
          </label>
        </div>

        <p className="cotPregunta">¿Cuál es tu presupuesto aproximado por canasta?</p>
        <div className="cotPresupuestos">
          {opciones.presupuestos.map((b) => (
            <label key={b.etiqueta} className="cotRadio">
              <input type="radio" name="_presupuesto" checked={presupuesto === b.etiqueta} onChange={() => setPresupuesto(b.etiqueta)} />
              <span>{b.etiqueta}</span>
            </label>
          ))}
        </div>
      </Seccion>

      <Seccion n={3} titulo="¿Dónde y cuándo debemos entregar?">
        <div className="cotGrid">
          <label>Fecha requerida *
            <select className="select" name="fecha_requerida" required defaultValue="">
              <option value="" disabled>Elige un día de reparto</option>
              {fechas.map((f) => <option key={f} value={f}>{fechaReparto(f)}</option>)}
            </select>
            <small className="cotAyuda">Repartimos {DIAS_REPARTO_TEXTO}, con {DIAS_ANTICIPACION} días de anticipación como mínimo.</small>
          </label>
          <label>Dirección de entrega *<input className="input" name="direccion" autoComplete="street-address" placeholder="Av. / Calle / Jr. / Número" required maxLength={220} /></label>
          <label>Distrito *
            <select className="select" name="distrito" required defaultValue="">
              <option value="" disabled>Selecciona tu distrito</option>
              {distritos.map((d) => <option key={d} value={d}>{d}</option>)}
              <option value="Otro (provincia u otro distrito)">Otro (provincia u otro distrito)</option>
            </select>
          </label>
          <label>Referencia de entrega (opcional)<input className="input" name="referencia" placeholder="Ej. recepción, piso, oficina, etc." maxLength={160} /></label>
        </div>
        {opciones.notaEntrega && <p className="cotNota"><Icono nombre="camion" /> {opciones.notaEntrega}</p>}
      </Seccion>

      <Seccion n={4} titulo="Personalización">
        <p className="cotPregunta">¿Quieres agregar un detalle especial a tus canastas?</p>
        <div className="cotExtras">
          {opciones.personalizacion.map((x, n) => (
            <label key={x} className="cotExtra">
              <input type="checkbox" name="personalizacion" value={x} />
              <Icono nombre={ICONOS_PERSONALIZACION[n % ICONOS_PERSONALIZACION.length]} />
              <span>{x}</span>
            </label>
          ))}
        </div>
        <label className="cotArea">¿Tienes algún requerimiento especial? (opcional)
          <textarea className="textarea" name="requerimientos" maxLength={1500} placeholder="Cuéntanos qué necesitas…" />
          <small>Ej. colores de la empresa, mensaje, tipo de producto, restricciones alimentarias, etc.</small>
        </label>
      </Seccion>

      <Seccion n={5} titulo="Información adicional">
        <label className="cotArea">¿Hay algún otro detalle que debamos considerar? (opcional)
          <textarea className="textarea" name="adicional" maxLength={1000} placeholder="Cuéntanos cualquier detalle adicional sobre tu pedido…" />
        </label>
      </Seccion>

      {state.error && <p className="checkoutError" role="alert">{state.error}</p>}
      <button className="btn btnPrimary full cotEnviar" type="submit" disabled={pending}>
        <Icono nombre="flecha" /> {pending ? "Enviando…" : "Solicitar cotización"}
      </button>
      <p className="muted cotPie">Te responderemos con una propuesta personalizada por WhatsApp o correo electrónico.</p>
    </form>
  );
}
