import type { Actualizar } from "../App";
import { PRENDAS, prendaLlevaManga, type Consumo, type Lote, type Manga, type Prenda } from "../calculo";
import { CONFIG_DEFAULT } from "../calculo/config";
import { TELAS, num, type Ficha } from "../datos/ficha";

interface Props {
  ficha: Ficha;
  actualizar: Actualizar;
  consumo: Consumo;
  lote: Lote;
}

export function TabTela({ ficha, actualizar, consumo, lote }: Props) {
  const t = ficha.tela;
  const poner = <K extends keyof Ficha["tela"]>(k: K, v: Ficha["tela"][K]) =>
    actualizar((f) => ({ ...f, tela: { ...f.tela, [k]: v } }));
  const etiqueta = PRENDAS.find((p) => p.valor === t.prenda)?.etiqueta ?? "";

  return (
    <div className="sec">
      <h3>¿Cuánta tela necesito?</h3>
      <div className="g2">
        <label className="f">
          Prenda
          <select value={t.prenda} onChange={(e) => poner("prenda", e.target.value as Prenda)}>
            {PRENDAS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <label className="f">
          Mangas
          <select
            value={t.manga}
            disabled={!prendaLlevaManga(t.prenda)}
            onChange={(e) => poner("manga", e.target.value as Manga)}
          >
            <option value="larga">Larga</option>
            <option value="corta">Corta</option>
            <option value="sin">Sin manga</option>
          </select>
        </label>
      </div>
      <div className="g3">
        <label className="f">
          Ancho de tela (cm)
          <input type="number" inputMode="decimal" value={t.ancho} onChange={(e) => poner("ancho", num(e.target.value))} />
        </label>
        <label className="f">
          Merma %
          <input type="number" inputMode="decimal" value={t.merma} onChange={(e) => poner("merma", num(e.target.value))} />
        </label>
        <label className="f">
          Tela
          <select value={t.tela} onChange={(e) => poner("tela", e.target.value)}>
            {TELAS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="res" aria-live="polite">
        <span className="chip">{etiqueta}</span>
        <div className="big">{consumo.metros.toFixed(2)} m</div>
        <small>
          {consumo.renglones.length === 0 && "Captura las medidas de la clienta (o elige una talla) para calcular la tela."}
          {consumo.renglones.length > 0 && consumo.renglones.map((r, i) => (
            <span key={i}>
              Largo {i + 1}: {r.piezas.join(" + ")} → {r.largo.toFixed(0)} cm
              <br />
            </span>
          ))}
          {consumo.renglones.length > 0 && `Subtotal ${consumo.totalCm.toFixed(0)} cm + ${t.merma}% de merma`}
          {consumo.noCabe && (
            <>
              <br />
              <b className="aviso">
                Una pieza es más ancha que la tela doblada ({consumo.anchoUtil.toFixed(0)} cm). Revisa el ancho o córtala abierta.
              </b>
            </>
          )}
        </small>
      </div>
      <p className="formula">
        Cómo se calcula: la tela se dobla a lo largo (ancho útil {consumo.anchoUtil.toFixed(0)} cm). Cada pieza es ¼ del contorno +{" "}
        {CONFIG_DEFAULT.holgura} cm de holgura + {CONFIG_DEFAULT.costura} cm de costura; el largo suma dobladillo. Las piezas que caben
        lado a lado comparten el mismo largo. Al final se suma la merma.
      </p>

      <h3>¿Cuántas prendas salen del lote?</h3>
      <div className="g2">
        <label className="f">
          Rollos en el lote
          <input type="number" inputMode="decimal" value={t.rollos} onChange={(e) => poner("rollos", num(e.target.value))} />
        </label>
        <label className="f">
          Metros por rollo
          <input
            type="number"
            inputMode="decimal"
            value={t.metrosRollo}
            onChange={(e) => poner("metrosRollo", num(e.target.value))}
          />
        </label>
      </div>
      <div className="res">
        <div className="big">{lote.prendas} prendas</div>
        <small>
          Lote de {lote.totalMetros} m. Sobran {lote.sobranteMetros.toFixed(2)} m después de cortar.
        </small>
      </div>
    </div>
  );
}
