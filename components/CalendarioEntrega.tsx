"use client";

import { useEffect, useRef, useState } from "react";
import { DIAS_REPARTO_TEXTO, fechaReparto } from "@/lib/entrega";

const DIAS = ["lu", "ma", "mi", "ju", "vi", "sá", "do"];

/** "2026-10" → primer día del mes en UTC. */
const inicioMes = (iso: string) => new Date(`${iso.slice(0, 7)}-01T00:00:00Z`);
const aIso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Calendario de fecha de entrega: solo se pueden elegir las fechas de reparto
 * (martes, jueves y sábados con anticipación) que llegan desde el servidor.
 */
export default function CalendarioEntrega({ name, fechas }: { name: string; fechas: string[] }) {
  const [valor, setValor] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [mes, setMes] = useState(() => inicioMes(fechas[0]));
  const caja = useRef<HTMLDivElement>(null);
  const disponibles = new Set(fechas);
  const primerMes = inicioMes(fechas[0]).getTime();
  const ultimoMes = inicioMes(fechas[fechas.length - 1]).getTime();

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierto(false); };
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => { document.removeEventListener("pointerdown", fuera); document.removeEventListener("keydown", tecla); };
  }, [abierto]);

  const moverMes = (delta: number) => setMes((m) => new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + delta, 1)));

  // Celdas del mes, semanas de lunes a domingo.
  const celdas: (Date | null)[] = Array((mes.getUTCDay() + 6) % 7).fill(null);
  const total = new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth() + 1, 0)).getUTCDate();
  for (let dia = 1; dia <= total; dia++) celdas.push(new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth(), dia)));

  return (
    <div className="calEntrega" ref={caja}>
      <button type="button" className={`select calTrigger${valor ? "" : " calVacio"}`} aria-haspopup="dialog" aria-expanded={abierto} onClick={() => setAbierto((a) => !a)}>
        {valor ? fechaReparto(valor) : "Elige un día de reparto"}
      </button>
      {/* Input real para que el navegador exija la fecha antes de enviar. */}
      <input className="calValidar" name={name} value={valor} onChange={() => {}} onFocus={() => setAbierto(true)} required tabIndex={-1} aria-hidden="true" />
      {abierto && (
        <div className="calPopover" role="dialog" aria-label="Elegir fecha de entrega">
          <div className="calHead">
            <button type="button" className="calNav" onClick={() => moverMes(-1)} disabled={mes.getTime() <= primerMes} aria-label="Mes anterior">‹</button>
            <strong>{mes.toLocaleDateString("es-PE", { month: "long", year: "numeric", timeZone: "UTC" })}</strong>
            <button type="button" className="calNav" onClick={() => moverMes(1)} disabled={mes.getTime() >= ultimoMes} aria-label="Mes siguiente">›</button>
          </div>
          <div className="calGrid">
            {DIAS.map((d) => <span key={d} className="calDow">{d}</span>)}
            {celdas.map((d, i) => {
              if (!d) return <span key={`v${i}`} />;
              const iso = aIso(d);
              const libre = disponibles.has(iso);
              return (
                <button
                  key={iso}
                  type="button"
                  className={`calDia${iso === valor ? " calSel" : ""}`}
                  disabled={!libre}
                  aria-pressed={iso === valor}
                  aria-label={fechaReparto(iso)}
                  onClick={() => { setValor(iso); setAbierto(false); }}
                >
                  {d.getUTCDate()}
                </button>
              );
            })}
          </div>
          <p className="calNota">Repartimos {DIAS_REPARTO_TEXTO}.</p>
        </div>
      )}
    </div>
  );
}
