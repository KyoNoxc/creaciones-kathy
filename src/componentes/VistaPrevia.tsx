import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

// Hoja carta a 96 ppp: 8.5 × 11 in.
const ANCHO = 816;
const ALTO = 1056;

/** Muestra la hoja escalada al espacio disponible. Al imprimir se quita la escala (ver styles.css). */
export function VistaPrevia({ children, onImprimir }: { children: ReactNode; onImprimir: () => void }) {
  const escenario = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1);

  useLayoutEffect(() => {
    const el = escenario.current;
    if (!el) return;
    const ajustar = () => setK(Math.min(1, (el.clientWidth - 36) / ANCHO));
    ajustar();
    const ro = new ResizeObserver(ajustar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section className="viewer" aria-label="Vista previa">
      <div className="bar">
        <p>
          <b>Vista previa, hoja carta.</b> Clic en un dato para corregirlo antes de imprimir.
        </p>
        <button className="btn" onClick={onImprimir} title="Guarda la ficha y la imprime">
          Imprimir
        </button>
      </div>
      <div className="stage" ref={escenario}>
        <div className="scaler" style={{ transform: `scale(${k})`, width: ANCHO * k, height: ALTO * k }}>
          {children}
        </div>
      </div>
    </section>
  );
}
