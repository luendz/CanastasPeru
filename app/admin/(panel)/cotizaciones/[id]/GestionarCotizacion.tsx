"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { soles } from "@/lib/admin/format";
import { pdfCotizacion } from "@/lib/admin/pdf";
import { CANALES, type Canal } from "@/lib/admin/types";
import { actualizarCotizacion, datosPdfCotizacion, type EstadoForm } from "../actions";

type Props = {
  id: string;
  numero: string;
  estado: string;
  canal: Canal;
  validaHasta: string | null;
  notas: string | null;
  cliente: { contacto: string; telefono: string | null; email: string | null };
  resumen: { unidades: number; total: number };
  marca: string;
};

/** Celular peruano a formato internacional para WhatsApp (51 + 9 dígitos). */
const numeroWhatsApp = (tel: string | null) => {
  const d = (tel ?? "").replace(/\D/g, "");
  if (d.length === 9 && d.startsWith("9")) return `51${d}`;
  return d.length >= 10 ? d : "";
};

export default function GestionarCotizacion({ id, numero, estado, canal, validaHasta, notas, cliente, resumen, marca }: Props) {
  const [resultado, guardar, guardando] = useActionState<EstadoForm, FormData>(actualizarCotizacion, {});
  // Campos controlados: así no vuelven a su valor inicial después de guardar.
  const [valores, setValores] = useState({ estado, canal: canal as string, valida: validaHasta ?? "", notas: notas ?? "" });
  const [modal, setModal] = useState(false);
  const [pdf, setPdf] = useState<"" | "generando" | "error">("");
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (resultado.ok) setModal(true);
  }, [resultado.en, resultado.ok]);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (modal && !d.open) d.showModal();
    if (!modal && d.open) d.close();
  }, [modal]);

  const mensaje =
    `Hola ${cliente.contacto}, te saludamos de ${marca}. Te enviamos la cotización ${numero}` +
    (resumen.unidades ? ` por ${resumen.unidades} canastas (total ${soles(resumen.total)})` : "") +
    ". Te adjuntamos el PDF con el detalle. Quedamos atentos a tus comentarios.";

  async function generarPdf() {
    setPdf("generando");
    try {
      const r = await pdfCotizacion(await datosPdfCotizacion(id));
      setPdf("");
      return r;
    } catch {
      setPdf("error");
      return null;
    }
  }

  async function descargar() {
    const r = await generarPdf();
    r?.doc.save(r.nombre);
  }

  /** En celulares se comparte el PDF directo; si no, se descarga y se abre el chat o el correo. */
  async function enviar(via: "whatsapp" | "correo") {
    const r = await generarPdf();
    if (!r) return;
    const archivo = new File([r.doc.output("blob")], r.nombre, { type: "application/pdf" });
    if (via === "whatsapp" && navigator.canShare?.({ files: [archivo] }) && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ files: [archivo], text: mensaje });
        return;
      } catch {
        /* Cancelado: se sigue con la descarga. */
      }
    }
    r.doc.save(r.nombre);
    if (via === "whatsapp") {
      window.open(`https://wa.me/${numeroWhatsApp(cliente.telefono)}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener");
    } else {
      window.location.href = `mailto:${cliente.email ?? ""}?subject=${encodeURIComponent(`Cotización ${numero} · ${marca}`)}&body=${encodeURIComponent(mensaje)}`;
    }
  }

  return (
    <>
      <form action={guardar} className="admForm">
        <input type="hidden" name="id" value={id} />
        <label>Estado
          <select className="admInput" name="estado" value={valores.estado} onChange={(e) => setValores({ ...valores, estado: e.target.value })}>
            <option value="pendiente">Pendiente</option>
            <option value="enviada">Enviada al cliente</option>
            <option value="rechazada">Rechazada</option>
          </select>
        </label>
        <label>Origen
          <select className="admInput" name="canal" value={valores.canal} onChange={(e) => setValores({ ...valores, canal: e.target.value })}>
            {CANALES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label>Válida hasta
          <input className="admInput" type="date" name="valida_hasta" value={valores.valida} onChange={(e) => setValores({ ...valores, valida: e.target.value })} />
        </label>
        <label>Notas internas
          <textarea className="admInput" name="notas" rows={3} value={valores.notas} onChange={(e) => setValores({ ...valores, notas: e.target.value })} />
        </label>
        <button className="admBtn" type="submit" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</button>
        {resultado.error && <p className="admError" role="alert">{resultado.error}</p>}
      </form>

      <button type="button" className="admLinkMuted admPdfLink" onClick={descargar} disabled={pdf === "generando"}>
        {pdf === "generando" ? "Generando PDF…" : "⤓ Descargar PDF de la cotización"}
      </button>

      <dialog ref={dialogo} className="admDialog admDialogSmall" onClose={() => setModal(false)} onClick={(e) => { if (e.target === e.currentTarget) setModal(false); }}>
        <div className="admDialogBody admExito">
          <span className="admExitoIcono" aria-hidden="true">✓</span>
          <h2>Cotización guardada con éxito</h2>
          <p className="admMuted">{numero}{resumen.unidades ? ` · ${resumen.unidades} canastas · ${soles(resumen.total)}` : ""}</p>

          <div className="admExitoAcciones">
            <button type="button" className="admBtn admBtnPrimary" onClick={descargar} disabled={pdf === "generando"}>
              {pdf === "generando" ? "Generando PDF…" : "Descargar PDF"}
            </button>
            <button type="button" className="admBtn" onClick={() => enviar("whatsapp")} disabled={pdf === "generando" || !numeroWhatsApp(cliente.telefono)}
              title={numeroWhatsApp(cliente.telefono) ? undefined : "La cotización no tiene celular"}>
              Enviar por WhatsApp
            </button>
            <button type="button" className="admBtn" onClick={() => enviar("correo")} disabled={pdf === "generando" || !cliente.email}
              title={cliente.email ? undefined : "La cotización no tiene correo"}>
              Enviar por correo
            </button>
          </div>
          <p className="admMuted admSmall">
            Al enviar se descarga el PDF y se abre el chat o el correo con el mensaje listo: solo adjunta el archivo descargado.
            Luego cambia el estado a “Enviada al cliente”.
          </p>
          {pdf === "error" && <p className="admError">No se pudo generar el PDF. Intenta de nuevo.</p>}
          <button type="button" className="admLinkMuted" onClick={() => setModal(false)}>Cerrar</button>
        </div>
      </dialog>
    </>
  );
}
