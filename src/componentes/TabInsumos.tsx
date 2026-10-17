import type { Actualizar } from "../App";
import { TELAS, num, type Ficha } from "../datos/ficha";

function Renglon(props: { etiqueta: string; valor: number; unidad: string; onCambio: (v: number) => void }) {
  return (
    <label className="med insumo">
      <span>{props.etiqueta}</span>
      <input type="number" step="0.1" inputMode="decimal" value={props.valor} onChange={(e) => props.onCambio(num(e.target.value))} />
      <span className="half">{props.unidad}</span>
    </label>
  );
}

export function TabInsumos({ ficha, actualizar }: { ficha: Ficha; actualizar: Actualizar }) {
  return (
    <div className="sec">
      <h3>Insumos</h3>
      <div className="lista">
        {ficha.insumos.map((r, i) => (
          <Renglon
            key={r.nombre}
            etiqueta={r.nombre}
            valor={r.cantidad}
            unidad={r.unidad}
            onCambio={(v) =>
              actualizar((f) => ({ ...f, insumos: f.insumos.map((x, j) => (j === i ? { ...x, cantidad: v } : x)) }))
            }
          />
        ))}
      </div>
      <h3>Telas (metros)</h3>
      <div className="lista">
        {TELAS.map((t) => (
          <Renglon
            key={t}
            etiqueta={t}
            valor={ficha.telas[t] ?? 0}
            unidad="m"
            onCambio={(v) => actualizar((f) => ({ ...f, telas: { ...f.telas, [t]: v } }))}
          />
        ))}
      </div>
      <h3>Entretela (metros)</h3>
      <div className="lista">
        {ficha.entretelas.map((r, i) => (
          <Renglon
            key={r.nombre}
            etiqueta={r.nombre}
            valor={r.metros}
            unidad="m"
            onCambio={(v) =>
              actualizar((f) => ({ ...f, entretelas: f.entretelas.map((x, j) => (j === i ? { ...x, metros: v } : x)) }))
            }
          />
        ))}
      </div>
    </div>
  );
}
