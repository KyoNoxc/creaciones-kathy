import { useState } from "react";
import { FORMULAS_INICIALES, type DefPieza } from "../calculo/config";
import { calcularFormula, revisarFormula } from "../calculo/formula";
import { PARAMETROS_FORMULA, PRENDAS, parametrosFormula, type Prenda } from "../calculo/piezas";
import { medidasParaFormulas, nombresParaFormulas } from "../datos/configuracion";
import type { PropsSeccion } from "./Configuracion";

/** Editor de las fórmulas de las piezas de cada prenda (Configuración → Tela y cálculo). */
export function EditorFormulas({ borrador, setBorrador }: PropsSeccion) {
  const [prenda, setPrenda] = useState<Prenda>("falda");
  const piezas = borrador.calculo.formulas[prenda];
  const validos = nombresParaFormulas(borrador.medidas);

  // Para que se vea el resultado mientras se escribe, se calcula con la talla T-M.
  const ejemplo = medidasParaFormulas(borrador.tallas.M, borrador.medidas);
  const vars = { ...ejemplo, ...parametrosFormula(prenda, "larga", ejemplo, borrador.calculo) };
  const resultado = (f: string) => {
    if (revisarFormula(f, validos)) return "";
    try {
      return `${Math.round(calcularFormula(f, vars) * 10) / 10} cm`;
    } catch {
      return "";
    }
  };

  const ponerPiezas = (cambio: (ps: DefPieza[]) => DefPieza[]) =>
    setBorrador((b) => ({
      ...b,
      calculo: { ...b.calculo, formulas: { ...b.calculo.formulas, [prenda]: cambio(b.calculo.formulas[prenda]) } },
    }));
  const cambiar = (i: number, c: Partial<DefPieza>) => ponerPiezas((ps) => ps.map((p, j) => (j === i ? { ...p, ...c } : p)));

  return (
    <>
      <h3>Fórmulas de las piezas</h3>
      <p className="formula">
        Cada pieza se corta al doblez. Escribe el ancho y el largo con las claves de las medidas (CCad, LF, CB…), números y{" "}
        <b>+ − × ÷</b> (también * y /), paréntesis, <b>½</b> o <b>/2</b> para la mitad, <b>mayor(CB, CCad)</b> y <b>menor(…)</b>. También
        puedes usar: {PARAMETROS_FORMULA.map((p) => (
          <span key={p.nombre}>
            <code>{p.nombre}</code> ({p.descripcion}){" "}
          </span>
        ))}
        . Junto a cada fórmula se ve cuánto da con la talla T-M.
      </p>
      <div className="chips-prenda" role="tablist">
        {PRENDAS.map((p) => (
          <button key={p.valor} role="tab" aria-selected={prenda === p.valor} onClick={() => setPrenda(p.valor)}>
            {p.etiqueta}
          </button>
        ))}
      </div>
      <div className="tabla-rep">
        <table className="cfg-formulas">
          <thead>
            <tr>
              <th>Pieza</th>
              <th>Ancho (cm)</th>
              <th>Largo (cm)</th>
              <th title="Solo se corta si la prenda lleva manga">¿Manga?</th>
              <th>
                <span className="sr">Quitar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {piezas.map((p, i) => (
              <tr key={i}>
                <td>
                  <input value={p.nombre} aria-label="Nombre de la pieza" onChange={(e) => cambiar(i, { nombre: e.target.value })} />
                </td>
                {(["ancho", "largo"] as const).map((campo) => {
                  const error = revisarFormula(p[campo], validos);
                  return (
                    <td key={campo}>
                      <input
                        className={error ? "mal" : undefined}
                        value={p[campo]}
                        spellCheck={false}
                        aria-label={`${campo} de ${p.nombre}`}
                        aria-invalid={!!error}
                        onChange={(e) => cambiar(i, { [campo]: e.target.value })}
                      />
                      <small className={error ? "err-formula" : "res-formula"}>{error || `= ${resultado(p[campo])}`}</small>
                    </td>
                  );
                })}
                <td className="centro">
                  <input
                    type="checkbox"
                    checked={!!p.esManga}
                    aria-label="Es manga"
                    onChange={(e) => cambiar(i, { esManga: e.target.checked || undefined })}
                  />
                </td>
                <td>
                  <button
                    className="btn chico peligro"
                    onClick={() => {
                      if (confirm(`¿Quitar la pieza "${p.nombre}"?`)) ponerPiezas((ps) => ps.filter((_, j) => j !== i));
                    }}
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="respaldo">
        <button className="btn sec-btn" onClick={() => ponerPiezas((ps) => [...ps, { nombre: "", ancho: "", largo: "" }])}>
          + Agregar pieza
        </button>
        <button className="btn sec-btn" onClick={() => ponerPiezas(() => structuredClone(FORMULAS_INICIALES[prenda]))}>
          Regresar a las fórmulas originales de esta prenda
        </button>
      </div>
    </>
  );
}
