"use client";

import { useEffect, useRef, useState } from "react";
import AgregarLinea, { type CanastaOpcion, type EnvaseOpcion, type LineaGuardada, type ProductoOpcion } from "./AgregarLinea";

type Props = {
  cotizacionId: string;
  linea: LineaGuardada;
  canastas: CanastaOpcion[];
  envases: EnvaseOpcion[];
  productos: ProductoOpcion[];
};

/** Botón "Editar" de una línea de la propuesta: abre el mismo formulario de costeo con sus datos. */
export default function EditarLinea({ cotizacionId, linea, canastas, envases, productos }: Props) {
  const [abierto, setAbierto] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <>
      <button type="button" className="admLinkMuted" onClick={() => setAbierto(true)}>Editar</button>
      <dialog ref={dialogo} className="admDialog admDialogMedio admDialogLinea" onClose={() => setAbierto(false)}>
        {abierto && (
          <div className="admDialogBody">
            <div className="admCardHead">
              <h2>Editar línea · {linea.nombre}</h2>
              <button type="button" className="admLinkMuted" onClick={() => setAbierto(false)}>Cerrar ✕</button>
            </div>
            <AgregarLinea
              cotizacionId={cotizacionId}
              cantidadInicial={linea.cantidad}
              canastas={canastas}
              envases={envases}
              productos={productos}
              linea={linea}
              onGuardado={() => setAbierto(false)}
            />
          </div>
        )}
      </dialog>
    </>
  );
}
