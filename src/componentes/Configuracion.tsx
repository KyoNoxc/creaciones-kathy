import { useEffect, useState } from "react";
import type { ConfigCalculo, Dobladillos } from "../calculo/config";
import { MEDIDAS_DEL_CALCULO } from "../calculo/piezas";
import { configInicial, nuevoIdMedida, validarConfig, type Configuracion as Config } from "../datos/configuracion";
import { useConfig } from "../datos/contexto";
import { guardarConfig } from "../datos/db";
import { num } from "../datos/ficha";
import { TALLAS_INDUSTRIALES } from "../datos/tallas";

type Seccion = "tela" | "medidas" | "tallas";

/** Pantalla de Configuración: parámetros de tela, lista de medidas y tabla de tallas industriales. */
export function Configuracion(props: { onGuardada: (c: Config) => void; onSinGuardar: (sinGuardar: boolean) => void }) {
  const { onGuardada, onSinGuardar } = props;
  const actual = useConfig();
  const [borrador, setBorrador] = useState<Config>(() => structuredClone(actual));
  const [seccion, setSeccion] = useState<Seccion>("tela");
  const sinGuardar = JSON.stringify(borrador) !== JSON.stringify(actual);
  useEffect(() => {
    onSinGuardar(sinGuardar);
    return () => onSinGuardar(false);
  }, [sinGuardar, onSinGuardar]);
  const errores = validarConfig(borrador);

  async function guardar() {
    if (errores.length) return;
    await guardarConfig(borrador);
    onGuardada(structuredClone(borrador));
  }

  return (
    <section className="config panel">
      <div className="acciones">
        <span className="estado">
          Configuración{sinGuardar ? <b className="sin"> · sin guardar</b> : <span className="ok"> · guardada</span>}
        </span>
        <button className="btn sec-btn" onClick={() => setBorrador(structuredClone(actual))} disabled={!sinGuardar}>
          Descartar cambios
        </button>
        <button className="btn" onClick={guardar} disabled={!sinGuardar || errores.length > 0}>
          Guardar
        </button>
      </div>
      {errores.length > 0 && (
        <ul className="error lista-err">
          {errores.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <div className="tabs" role="tablist">
        {(
          [
            ["tela", "Tela y cálculo"],
            ["medidas", "Lista de medidas"],
            ["tallas", "Tabla de tallas"],
          ] as const
        ).map(([id, nombre]) => (
          <button key={id} role="tab" aria-selected={seccion === id} onClick={() => setSeccion(id)}>
            {nombre}
          </button>
        ))}
      </div>
      {seccion === "tela" && <SeccionTela borrador={borrador} setBorrador={setBorrador} />}
      {seccion === "medidas" && <SeccionMedidas borrador={borrador} setBorrador={setBorrador} />}
      {seccion === "tallas" && <SeccionTallas borrador={borrador} setBorrador={setBorrador} />}
    </section>
  );
}

interface PropsSeccion {
  borrador: Config;
  setBorrador: React.Dispatch<React.SetStateAction<Config>>;
}

function Numero(props: { etiqueta: string; valor: number; unidad: string; onCambio: (v: number) => void; ayuda?: string }) {
  return (
    <label className="f">
      {props.etiqueta}
      <span className="con-unidad">
        <input type="number" step="0.5" inputMode="decimal" value={props.valor} onChange={(e) => props.onCambio(num(e.target.value))} />
        <span>{props.unidad}</span>
      </span>
      {props.ayuda && <small className="ayuda">{props.ayuda}</small>}
    </label>
  );
}

function SeccionTela({ borrador, setBorrador }: PropsSeccion) {
  const c = borrador.calculo;
  const poner = (k: Exclude<keyof ConfigCalculo, "dobladillo">) => (v: number) =>
    setBorrador((b) => ({ ...b, calculo: { ...b.calculo, [k]: v } }));
  const dob = (k: keyof Dobladillos) => (v: number) =>
    setBorrador((b) => ({ ...b, calculo: { ...b.calculo, dobladillo: { ...b.calculo.dobladillo, [k]: v } } }));
  const inicial = configInicial().calculo;

  return (
    <div className="sec">
      <h3>Valores para fichas nuevas</h3>
      <div className="g2">
        <Numero etiqueta="Ancho de tela por default" valor={c.anchoTela} unidad="cm" onCambio={poner("anchoTela")} />
        <Numero etiqueta="Merma por default" valor={c.merma} unidad="%" onCambio={poner("merma")} />
      </div>

      <h3>Cálculo de tela</h3>
      <p className="formula">
        Estos valores cambian el consumo de todas las fichas, también las que ya están guardadas, la próxima vez que se abran.
      </p>
      <div className="g3">
        <Numero etiqueta="Holgura" valor={c.holgura} unidad="cm" onCambio={poner("holgura")} ayuda="Por media pieza" />
        <Numero etiqueta="Costura" valor={c.costura} unidad="cm" onCambio={poner("costura")} ayuda="Por media pieza" />
        <Numero etiqueta="Orillo" valor={c.orillo} unidad="cm" onCambio={poner("orillo")} ayuda="Se quita del ancho doblado" />
      </div>

      <h3>Dobladillo (se suma al largo)</h3>
      <div className="g3">
        <Numero etiqueta="Falda" valor={c.dobladillo.falda} unidad="cm" onCambio={dob("falda")} />
        <Numero etiqueta="Blusa / camisa" valor={c.dobladillo.blusa} unidad="cm" onCambio={dob("blusa")} />
        <Numero etiqueta="Pantalón" valor={c.dobladillo.pantalon} unidad="cm" onCambio={dob("pantalon")} />
        <Numero etiqueta="Vestido" valor={c.dobladillo.vestido} unidad="cm" onCambio={dob("vestido")} />
        <Numero etiqueta="Manga" valor={c.dobladillo.manga} unidad="cm" onCambio={dob("manga")} />
      </div>
      <div>
        <button
          className="btn sec-btn"
          onClick={() => setBorrador((b) => ({ ...b, calculo: structuredClone(inicial) }))}
        >
          Regresar a los valores originales
        </button>
      </div>
    </div>
  );
}

function SeccionMedidas({ borrador, setBorrador }: PropsSeccion) {
  const lista = borrador.medidas;
  const cambiar = (i: number, cambio: Partial<Config["medidas"][number]>) =>
    setBorrador((b) => ({ ...b, medidas: b.medidas.map((m, j) => (j === i ? { ...m, ...cambio } : m)) }));
  const mover = (i: number, d: -1 | 1) =>
    setBorrador((b) => {
      const medidas = [...b.medidas];
      [medidas[i], medidas[i + d]] = [medidas[i + d], medidas[i]];
      return { ...b, medidas };
    });
  const quitar = (i: number) => {
    const m = lista[i];
    if (!confirm(`¿Quitar la medida ${m.clave} (${m.nombre})? Ya no aparecerá en las fichas ni en la hoja.`)) return;
    setBorrador((b) => ({ ...b, medidas: b.medidas.filter((_, j) => j !== i) }));
  };
  const agregar = () =>
    setBorrador((b) => ({ ...b, medidas: [...b.medidas, { id: nuevoIdMedida(), clave: "", nombre: "", mitad: false }] }));

  return (
    <div className="sec">
      <p className="formula">
        Cambia el nombre o la clave, marca si lleva ½ y acomoda el orden con las flechas. Las medidas marcadas con • las usa el
        cálculo de tela y no se pueden quitar. Cambiar una clave no borra los valores ya capturados.
        {lista.length > 34 && " Con más de 34 medidas la tabla de la hoja se imprime en dos columnas."}
      </p>
      <div className="tabla-rep">
        <table className="cfg-medidas">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Clave</th>
              <th>Nombre</th>
              <th>½</th>
              <th>
                <span className="sr">Quitar</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lista.map((m, i) => {
              const delCalculo = MEDIDAS_DEL_CALCULO.includes(m.id);
              return (
                <tr key={m.id}>
                  <td className="orden">
                    <button className="flecha" aria-label="Subir" disabled={i === 0} onClick={() => mover(i, -1)}>
                      ▲
                    </button>
                    <button className="flecha" aria-label="Bajar" disabled={i === lista.length - 1} onClick={() => mover(i, 1)}>
                      ▼
                    </button>
                  </td>
                  <td>
                    <input className="clave" value={m.clave} onChange={(e) => cambiar(i, { clave: e.target.value })} aria-label="Clave" />
                  </td>
                  <td>
                    <input value={m.nombre} onChange={(e) => cambiar(i, { nombre: e.target.value })} aria-label="Nombre" />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={m.mitad}
                      onChange={(e) => cambiar(i, { mitad: e.target.checked })}
                      aria-label="Lleva ½"
                    />
                  </td>
                  <td>
                    {delCalculo ? (
                      <span className="del-calc" title="La usa el cálculo de tela">
                        •
                      </span>
                    ) : (
                      <button className="btn chico peligro" onClick={() => quitar(i)}>
                        Quitar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div>
        <button className="btn sec-btn" onClick={agregar}>
          + Agregar medida
        </button>
      </div>
    </div>
  );
}

function SeccionTallas({ borrador, setBorrador }: PropsSeccion) {
  const poner = (talla: (typeof TALLAS_INDUSTRIALES)[number], id: string, v: number) =>
    setBorrador((b) => ({ ...b, tallas: { ...b.tallas, [talla]: { ...b.tallas[talla], [id]: v } } }));

  return (
    <div className="sec">
      <label className="check">
        <input
          type="checkbox"
          checked={borrador.tallasProvisionales}
          onChange={(e) => setBorrador((b) => ({ ...b, tallasProvisionales: e.target.checked }))}
        />
        Los valores son provisionales (la app muestra un aviso al elegir una talla)
      </label>
      <p className="formula">
        Medidas industriales en centímetros. Al elegir una talla en una ficha, se usan estos valores y no se pueden cambiar ahí.
      </p>
      <div className="tabla-rep">
        <table className="cfg-tallas">
          <thead>
            <tr>
              <th>Clave</th>
              <th>Medida</th>
              {TALLAS_INDUSTRIALES.map((t) => (
                <th key={t}>T-{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {borrador.medidas.map((m) => (
              <tr key={m.id}>
                <td className="ab">{m.clave}</td>
                <td>{m.nombre}</td>
                {TALLAS_INDUSTRIALES.map((t) => (
                  <td key={t}>
                    <input
                      type="number"
                      step="0.5"
                      inputMode="decimal"
                      value={borrador.tallas[t][m.id] || ""}
                      placeholder="—"
                      aria-label={`${m.clave} talla ${t}`}
                      onChange={(e) => poner(t, m.id, num(e.target.value))}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
