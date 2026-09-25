"use client";

import { useEffect, useRef, useState } from "react";
import Biblioteca from "./Biblioteca";

type Props = {
  name: string;
  defaultValue?: string | null;
  label?: string;
  /** Aviso cuando cambia la imagen (por ejemplo, para enviar el formulario). */
  onChange?: (url: string) => void;
  compacto?: boolean;
};

/**
 * Campo de formulario para elegir una imagen de la biblioteca (o subir una
 * nueva). Guarda la dirección en un input oculto con el nombre indicado.
 */
export default function SelectorImagen({ name, defaultValue, label = "Imagen", onChange, compacto }: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const dialogo = useRef<HTMLDialogElement>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  const elegir = (nueva: string) => {
    setUrl(nueva);
    onChange?.(nueva);
    setAbierto(false);
  };

  return (
    <div className={`admPicker${compacto ? " admPickerCompacto" : ""}`}>
      <input type="hidden" name={name} value={url} />
      <button type="button" className="admPickerThumb" onClick={() => setAbierto(true)} aria-label={`${label}: ${url ? "cambiar" : "elegir"}`}>
        {url ? <img src={url} alt="" /> : <span>+</span>}
      </button>
      {!compacto && (
        <div className="admPickerInfo">
          <span className="admPickerLabel">{label}</span>
          <div className="admPickerBtns">
            <button type="button" className="admLinkMuted" onClick={() => setAbierto(true)}>{url ? "Cambiar" : "Elegir imagen"}</button>
            {url && <button type="button" className="admLinkDanger" onClick={() => elegir("")}>Quitar</button>}
          </div>
        </div>
      )}

      <dialog ref={dialogo} className="admDialog" onClose={() => setAbierto(false)} onClick={(e) => { if (e.target === e.currentTarget) setAbierto(false); }}>
        {abierto && (
          <div className="admDialogBody">
            <div className="admCardHead">
              <h2>Elegir imagen</h2>
              <button type="button" className="admLinkMuted" onClick={() => setAbierto(false)}>Cerrar ✕</button>
            </div>
            <Biblioteca onElegir={elegir} seleccionada={url} />
          </div>
        )}
      </dialog>
    </div>
  );
}
