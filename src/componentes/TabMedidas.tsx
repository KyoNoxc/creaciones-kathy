import type { Actualizar } from "../App";
import { num, type Ficha } from "../datos/ficha";
import { MEDIDAS } from "../datos/medidas";
import { TALLAS_PROVISIONALES, TIPOS_MEDIDA, medidasEfectivas, type TipoMedida } from "../datos/tallas";

export function TabMedidas({ ficha, actualizar }: { ficha: Ficha; actualizar: Actualizar }) {
  const aMedida = ficha.tipoMedida === "AM";
  const valores = medidasEfectivas(ficha.tipoMedida, ficha.medidas);

  return (
    <div className="sec">
      <label className="f">
        Tipo de medida
        <select
          value={ficha.tipoMedida}
          onChange={(e) => {
            const tipoMedida = e.target.value as TipoMedida;
            actualizar((f) => ({ ...f, tipoMedida }));
          }}
        >
          {TIPOS_MEDIDA.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.etiqueta}
            </option>
          ))}
        </select>
      </label>
      <p className="formula">
        {aMedida ? (
          "Medidas exactas de la clienta, en centímetros. En los contornos la app saca sola la mitad (½), igual que la columna chica de la hoja de papel."
        ) : (
          <>
            <b>Talla T-{ficha.tipoMedida}:</b> medidas industriales fijas, no se pueden cambiar aquí.{" "}
            {TALLAS_PROVISIONALES && <span className="chip">Valores provisionales</span>}
            {TALLAS_PROVISIONALES && " hasta tener la tabla de Kathy."}
          </>
        )}
      </p>
      <div className="lista">
        {MEDIDAS.map((m) => {
          const v = valores[m.clave] ?? 0;
          return (
            <div className="med" key={m.clave}>
              <span className="ab">{m.clave}</span>
              <label htmlFor={`m_${m.clave}`}>{m.nombre}</label>
              <input
                id={`m_${m.clave}`}
                type="number"
                step="0.5"
                inputMode="decimal"
                value={v}
                disabled={!aMedida}
                onChange={(e) => {
                  const x = num(e.target.value);
                  actualizar((f) => ({ ...f, medidas: { ...f.medidas, [m.clave]: x } }));
                }}
              />
              <span className="half">{m.mitad ? `½ ${v / 2}` : ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
