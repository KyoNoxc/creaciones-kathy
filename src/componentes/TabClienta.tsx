import type { Actualizar } from "../App";
import { TIPOS_FICHA, type Ficha, type TipoFicha } from "../datos/ficha";

type CampoTexto = "nombre" | "tel" | "fecha" | "prueba" | "entrega" | "prendaTxt" | "obs";

export function TabClienta({ ficha, actualizar }: { ficha: Ficha; actualizar: Actualizar }) {
  const campo = (k: CampoTexto) => ({
    value: ficha[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      actualizar((f) => ({ ...f, [k]: v }));
    },
  });

  return (
    <div className="sec">
      <label className="f">
        Nombre y apellidos
        <input {...campo("nombre")} />
      </label>
      <div className="g2">
        <label className="f">
          Teléfono
          <input type="tel" {...campo("tel")} />
        </label>
        <label className="f">
          Tipo de ficha
          <select
            value={ficha.tipo}
            onChange={(e) => {
              const tipo = e.target.value as TipoFicha;
              actualizar((f) => ({ ...f, tipo }));
            }}
          >
            {TIPOS_FICHA.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="g3">
        <label className="f">
          Fecha
          <input type="date" {...campo("fecha")} />
        </label>
        <label className="f">
          Prueba
          <input type="date" {...campo("prueba")} />
        </label>
        <label className="f">
          Entrega
          <input type="date" {...campo("entrega")} />
        </label>
      </div>
      <label className="f">
        Prenda
        <input {...campo("prendaTxt")} />
      </label>
      <label className="f">
        Observaciones
        <input {...campo("obs")} />
      </label>
    </div>
  );
}
