import type { Actualizar } from "../App";
import { useConfig } from "../datos/contexto";
import { num, type Ficha } from "../datos/ficha";
import { TIPOS_MEDIDA, medidasEfectivas, type TipoMedida } from "../datos/tallas";

export function TabMedidas({ ficha, actualizar }: { ficha: Ficha; actualizar: Actualizar }) {
  const config = useConfig();
  const aMedida = ficha.tipoMedida === "AM";
  const valores = medidasEfectivas(ficha.tipoMedida, ficha.medidas, config.tallas);

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
            <b>Talla T-{ficha.tipoMedida}:</b> medidas industriales fijas, no se pueden cambiar aquí (se editan en Configuración).{" "}
            {config.tallasProvisionales && <span className="chip">Valores provisionales</span>}
            {config.tallasProvisionales && " hasta tener la tabla de Kathy."}
          </>
        )}
      </p>
      <div className="lista">
        {config.medidas.map((m) => {
          const v = valores[m.id] ?? 0;
          return (
            <div className="med" key={m.id}>
              <span className="ab">{m.clave}</span>
              <label htmlFor={`m_${m.id}`}>{m.nombre}</label>
              <input
                id={`m_${m.id}`}
                type="number"
                step="0.5"
                inputMode="decimal"
                value={v || ""}
                placeholder="—"
                disabled={!aMedida}
                onChange={(e) => {
                  const x = num(e.target.value);
                  actualizar((f) => ({ ...f, medidas: { ...f.medidas, [m.id]: x } }));
                }}
              />
              <span className="half">{m.mitad && v ? `½ ${v / 2}` : ""}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
