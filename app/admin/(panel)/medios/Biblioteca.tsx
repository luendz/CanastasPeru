"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BUCKET_MEDIOS, MAX_BYTES_IMAGEN, TIPOS_IMAGEN, rutaParaSubir, urlPublicaMedio, type Medio } from "@/lib/medios";
import { createClient } from "@/lib/supabase/client";
import { eliminarMedio, listarMedios } from "./actions";

const kb = (b?: number) => (b ? (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`) : "");

type Props = {
  /** Si se pasa, la biblioteca funciona como selector: al elegir una imagen se llama con su URL. */
  onElegir?: (url: string) => void;
  seleccionada?: string;
};

/**
 * Biblioteca de imágenes: sube directo del navegador a Supabase Storage con la
 * sesión del administrador (las políticas de la base lo exigen), y lista las
 * imágenes subidas junto con las que ya trae la web.
 */
export default function Biblioteca({ onElegir, seleccionada }: Props) {
  const [medios, setMedios] = useState<Medio[] | null>(null);
  const [filtro, setFiltro] = useState<"todas" | "subida" | "web">("todas");
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [subiendo, setSubiendo] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const cargar = useCallback(async () => {
    try {
      setMedios(await listarMedios());
    } catch (e) {
      setAviso({ tipo: "error", texto: e instanceof Error ? e.message : "No se pudo cargar la biblioteca." });
      setMedios([]);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function subir(archivos: FileList | File[]) {
    const lista = [...archivos];
    const invalidos = lista.filter((f) => !TIPOS_IMAGEN.includes(f.type) || f.size > MAX_BYTES_IMAGEN);
    if (invalidos.length) {
      setAviso({ tipo: "error", texto: `Solo PNG, JPG, WebP o GIF de hasta 5 MB. No se subió: ${invalidos.map((f) => f.name).join(", ")}.` });
    }
    const validos = lista.filter((f) => !invalidos.includes(f));
    if (!validos.length) return;

    const supabase = createClient();
    setSubiendo(validos.length);
    let ultima = "";
    for (const archivo of validos) {
      const ruta = rutaParaSubir(archivo.name, archivo.type);
      const { error } = await supabase.storage.from(BUCKET_MEDIOS).upload(ruta, archivo, { contentType: archivo.type, cacheControl: "31536000", upsert: false });
      if (error) {
        setAviso({ tipo: "error", texto: `No se pudo subir ${archivo.name}: ${error.message}` });
      } else {
        ultima = urlPublicaMedio(ruta);
      }
      setSubiendo((n) => n - 1);
    }
    if (ultima) {
      if (!invalidos.length) setAviso({ tipo: "ok", texto: validos.length > 1 ? `${validos.length} imágenes subidas.` : "Imagen subida." });
      await cargar();
      if (onElegir && validos.length === 1) onElegir(ultima);
    }
  }

  async function borrar(m: Medio) {
    if (!m.ruta || !window.confirm(`¿Borrar "${m.nombre}"? No se puede deshacer.`)) return;
    const r = await eliminarMedio(m.ruta);
    setAviso(r.error ? { tipo: "error", texto: r.error } : { tipo: "ok", texto: "Imagen borrada." });
    if (r.ok) cargar();
  }

  async function copiar(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setAviso({ tipo: "ok", texto: "Dirección copiada." });
    } catch {
      setAviso({ tipo: "error", texto: url });
    }
  }

  const visibles = (medios ?? []).filter((m) => filtro === "todas" || m.origen === filtro);

  return (
    <div className="admMedia">
      <div
        className="admDrop"
        data-activo={arrastrando || undefined}
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastrando(false); subir(e.dataTransfer.files); }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg>
        <p><strong>Arrastra imágenes aquí</strong> o</p>
        <button type="button" className="admBtn" onClick={() => input.current?.click()} disabled={subiendo > 0}>
          {subiendo > 0 ? `Subiendo ${subiendo}…` : "Elegir archivos"}
        </button>
        <small>PNG, JPG, WebP o GIF · hasta 5 MB · PNG o WebP con fondo transparente para productos</small>
        <input ref={input} type="file" accept={TIPOS_IMAGEN.join(",")} multiple hidden onChange={(e) => { if (e.target.files) subir(e.target.files); e.target.value = ""; }} />
      </div>

      {aviso && <p className={aviso.tipo === "ok" ? "admSuccess" : "admError"} role={aviso.tipo === "ok" ? "status" : "alert"}>{aviso.texto}</p>}

      <nav className="admTabs" aria-label="Filtrar imágenes">
        {(["todas", "subida", "web"] as const).map((f) => (
          <button key={f} type="button" className="admTabBtn" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
            {f === "todas" ? "Todas" : f === "subida" ? "Subidas" : "De la web"}
          </button>
        ))}
      </nav>

      {medios === null ? (
        <p className="admEmpty">Cargando imágenes…</p>
      ) : visibles.length === 0 ? (
        <p className="admEmpty">No hay imágenes {filtro === "subida" ? "subidas todavía" : ""}.</p>
      ) : (
        <ul className="admMediaGrid">
          {visibles.map((m) => (
            <li key={m.url} data-elegida={seleccionada === m.url || undefined}>
              {onElegir ? (
                <button type="button" className="admMediaThumb" onClick={() => onElegir(m.url)} title={`Elegir ${m.nombre}`}>
                  <img src={m.url} alt="" loading="lazy" />
                </button>
              ) : (
                <a className="admMediaThumb" href={m.url} target="_blank" rel="noreferrer" title="Abrir en otra pestaña">
                  <img src={m.url} alt="" loading="lazy" />
                </a>
              )}
              <div className="admMediaInfo">
                <span title={m.nombre}>{m.nombre}</span>
                <small>{m.origen === "web" ? "De la web" : kb(m.bytes)}</small>
              </div>
              {!onElegir && (
                <div className="admMediaActions">
                  <button type="button" className="admLinkMuted" onClick={() => copiar(m.url)}>Copiar dirección</button>
                  {m.origen === "subida" && <button type="button" className="admLinkDanger" onClick={() => borrar(m)}>Borrar</button>}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
