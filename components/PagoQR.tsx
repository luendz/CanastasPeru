"use client";

import { useActionState, useRef, useState } from "react";
import { enviarComprobante, type ComprobanteState } from "@/app/(sitio)/confirmacion/actions";
import { formatPrice } from "@/lib/mock-data";

/** Las capturas grandes se reducen en el navegador antes de enviarlas. */
async function reducir(archivo: File): Promise<File> {
  if (archivo.size <= 900 * 1024 || !archivo.type.startsWith("image/")) return archivo;
  try {
    const img = await createImageBitmap(archivo);
    const escala = Math.min(1, 1800 / Math.max(img.width, img.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(img.width * escala);
    lienzo.height = Math.round(img.height * escala);
    lienzo.getContext("2d")?.drawImage(img, 0, 0, lienzo.width, lienzo.height);
    const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, "image/jpeg", 0.85));
    return blob ? new File([blob], archivo.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : archivo;
  } catch {
    return archivo;
  }
}

type Props = { total: number; qr: string; nota: string; metodo: string; enviado?: boolean };

/** Pago con QR (Yape / Plin): QR con el monto, nota importante y subida del comprobante. */
export default function PagoQR({ total, qr, nota, metodo, enviado }: Props) {
  const [estado, accion, enviando] = useActionState<ComprobanteState, FormData>(enviarComprobante, enviado ? { ok: true } : {});
  const [vista, setVista] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0];
    if (vista) URL.revokeObjectURL(vista);
    if (!original) return setVista(null);
    setPreparando(true);
    const listo = await reducir(original);
    if (listo !== original && input.current) {
      const dt = new DataTransfer();
      dt.items.add(listo);
      input.current.files = dt.files;
    }
    setVista(URL.createObjectURL(listo));
    setPreparando(false);
  }

  return (
    <section className="formCard pagoQR">
      <div className="pagoQRHead">
        <h3 className="confirmTitle">Completa tu pago</h3>
        <span className="pagoQREstado" data-ok={estado.ok ? "" : undefined}>{estado.ok ? "Comprobante enviado" : "Pendiente de pago"}</span>
      </div>

      <div className="pagoQRMonto">
        <strong>{formatPrice(total)}</strong>
        <small>Monto exacto a pagar</small>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pagoQRImagen" src={qr} alt={`Código QR para pagar con ${metodo}`} width={220} height={220} />
        <b>Escanea el QR con {metodo} para pagar</b>
        <a className="pagoQRGuardar" href={qr} download="QR-pago-MKA.png">¿Pagas desde este celular? Guarda la imagen del QR</a>
      </div>

      <div className="pagoQRNota" role="note">
        <strong>Importante</strong>
        <p>{nota}</p>
      </div>

      <p className="pagoQRDespues">Después de realizar el pago:</p>
      {estado.ok ? (
        <div className="pagoQRListo" role="status">
          <strong>¡Recibimos tu comprobante!</strong>
          <p>Lo verificaremos y te avisaremos cuando confirmemos el pago.</p>
        </div>
      ) : (
        <form action={accion} className="pagoQRSubir">
          <strong className="pagoQRSubirTitulo">Adjunta tu comprobante</strong>
          <label className="pagoQRZona" data-vista={vista ? "" : undefined}>
            <input ref={input} type="file" name="comprobante" accept="image/jpeg,image/png,image/webp" onChange={elegir} required />
            {vista ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={vista} alt="Vista previa del comprobante" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0-5 5m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>
                <span>Subir captura de pago</span>
                <small>JPG o PNG</small>
              </>
            )}
          </label>
          {vista && <button type="button" className="pagoQRCambiar" onClick={() => input.current?.click()}>Cambiar imagen</button>}
          {estado.error && <p className="pagoQRError" role="alert">{estado.error}</p>}
          <button className="btn btnPrimary" type="submit" disabled={!vista || enviando || preparando}>
            {enviando ? "Enviando…" : "Enviar comprobante"}
          </button>
        </form>
      )}
    </section>
  );
}
