"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Borrador de un formulario guardado en el navegador (sessionStorage de la
 * pestaña): si el cliente sale a editar el carrito o a ver canastas y vuelve,
 * encuentra sus datos tal como los dejó. Se borra al enviar el formulario y al
 * cerrar la pestaña. Nada sale del navegador.
 */

type Campos = Record<string, string | string[]>;
type Guardado<E> = { campos?: Campos; estado?: Partial<E> };
type Elemento = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function leer<E>(clave: string): Guardado<E> | null {
  try {
    return JSON.parse(sessionStorage.getItem(clave) ?? "null");
  } catch {
    return null;
  }
}

export function borrarBorrador(clave: string) {
  try {
    sessionStorage.removeItem(clave);
  } catch {
    /* Sin acceso al almacenamiento: no hay nada que borrar. */
  }
}

/** Campos del formulario que no dependen del estado de React (los que sí, van en `estado`). */
function elementos(form: HTMLFormElement): Elemento[] {
  return Array.from(form.elements).filter((el): el is Elemento => {
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return false;
    if (!el.name || el.name.startsWith("_") || el.dataset.borrador === "no") return false;
    return !(el instanceof HTMLInputElement && ["hidden", "radio", "password", "file"].includes(el.type));
  });
}

function leerCampos(form: HTMLFormElement): Campos {
  const campos: Campos = {};
  for (const el of elementos(form)) {
    if (el instanceof HTMLInputElement && el.type === "checkbox") {
      const marcados = (campos[el.name] as string[] | undefined) ?? [];
      campos[el.name] = el.checked ? [...marcados, el.value] : marcados;
    } else {
      campos[el.name] = el.value;
    }
  }
  return campos;
}

function aplicarCampos(form: HTMLFormElement, campos: Campos) {
  for (const el of elementos(form)) {
    const v = campos[el.name];
    if (v === undefined) continue;
    if (el instanceof HTMLInputElement && el.type === "checkbox") el.checked = Array.isArray(v) && v.includes(el.value);
    else if (typeof v === "string") el.value = v;
  }
}

/**
 * Guarda y recupera el borrador de un formulario. `estado` son los valores que
 * el formulario lleva en React (opciones elegidas, fecha…); `restaurar` los
 * vuelve a poner. Devuelve los manejadores para el <form>.
 */
export function useBorrador<E extends object>(clave: string, estado: E, restaurar: (e: Partial<E>) => void) {
  const form = useRef<HTMLFormElement>(null);
  const estadoActual = useRef(estado);
  estadoActual.current = estado;
  const listo = useRef(false);
  const [pendiente, setPendiente] = useState<Campos | null>(null);

  const guardar = () => {
    if (!listo.current || !form.current) return;
    try {
      sessionStorage.setItem(clave, JSON.stringify({ campos: leerCampos(form.current), estado: estadoActual.current }));
    } catch {
      /* Navegación privada o almacenamiento lleno: el formulario sigue funcionando. */
    }
  };

  // Al abrir: primero el estado de React; los campos, cuando ya se dibujaron (algunos aparecen según ese estado).
  useEffect(() => {
    const b = leer<E>(clave);
    if (!b) {
      listo.current = true;
      return;
    }
    if (b.estado) restaurar(b.estado);
    setPendiente(b.campos ?? {});
    // Solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pendiente) return;
    if (form.current) aplicarCampos(form.current, pendiente);
    setPendiente(null);
    listo.current = true;
  }, [pendiente]);

  const firma = JSON.stringify(estado);
  useEffect(() => {
    guardar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma]);

  return { ref: form, onInput: guardar, onChange: guardar };
}
