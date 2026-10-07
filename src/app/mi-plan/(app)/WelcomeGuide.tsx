"use client";

import { useEffect, useState } from "react";

const KEY = "cb-guide-dismissed";

/**
 * First-run "how this works" card for the student app — four lines, one
 * per tab, closable for good (remembered in localStorage; if storage is
 * blocked it just shows again next time, which is harmless).
 */
export function WelcomeGuide() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(KEY) === "1";
    } catch {
      // storage blocked — show it
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after mount
    setVisible(!dismissed);
  }, []);

  if (!visible) return null;

  function close() {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  return (
    <section aria-label="Cómo funciona" className="relative border border-tide/40 bg-tide/5 p-4 pr-10">
      <button
        type="button"
        onClick={close}
        aria-label="Cerrar la guía"
        className="absolute right-3 top-3 font-mono text-sm text-steel hover:text-chalk"
      >
        ✕
      </button>
      <p className="font-mono text-xs uppercase tracking-widest text-tide">Cómo funciona</p>
      <ol className="mt-3 flex flex-col gap-2 text-sm text-chalk">
        <li>
          <strong>Semana:</strong> tu rutina de esta semana. Toca <em>⏱ Empezar rutina</em>, marca cada ejercicio y anota
          cuánto hiciste.
        </li>
        <li>
          <strong>Plan:</strong> todas tus semanas y cuánto cumpliste en cada una.
        </li>
        <li>
          <strong>Progreso:</strong> cada 2–4 semanas haz tu prueba de máximo (flexiones, dominadas, fondos, plancha).
        </li>
        <li>
          <strong>Biblioteca:</strong> el video y los pasos de cada ejercicio, para hacerlo bien.
        </li>
      </ol>
      <p className="mt-3 text-xs text-steel">
        Tip: en el celular, usa «Agregar a pantalla de inicio» en el menú del navegador para abrirla como una app.
      </p>
    </section>
  );
}
