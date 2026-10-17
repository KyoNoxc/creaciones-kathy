import type { Actualizar } from "../App";
import type { Consumo, Lote } from "../calculo";
import { TELAS, fechaCorta, fechaIso, num, type Ficha } from "../datos/ficha";
import { useConfig } from "../datos/contexto";
import type { Medidas } from "../datos/medidas";
import { etiquetaTipoMedida } from "../datos/tallas";
import logo from "../assets/logo-hoja.jpg";
import { Editable } from "./Editable";

interface Props {
  ficha: Ficha;
  actualizar: Actualizar;
  medidas: Medidas;
  consumo: Consumo;
  lote: Lote;
}

const cant = (x: number) => (x ? String(x) : "—");
/** Hasta cuántas medidas caben en una sola columna sin pasarse de la hoja. */
const MAX_UNA_COLUMNA = 34;

/** La hoja carta tal cual sale impresa. Cada dato se corrige con clic y regresa al formulario. */
export function Hoja({ ficha, actualizar, medidas, consumo, lote }: Props) {
  const aMedida = ficha.tipoMedida === "AM";
  const lista = useConfig().medidas;
  const dosColumnas = lista.length > MAX_UNA_COLUMNA;
  const mitad = Math.ceil(lista.length / 2);
  const texto = (k: "nombre" | "tel" | "prendaTxt" | "obs" | "obs2") => (t: string) => actualizar((f) => ({ ...f, [k]: t }));
  const fecha = (k: "fecha" | "prueba" | "entrega") => (t: string) => {
    const iso = fechaIso(t);
    if (iso) actualizar((f) => ({ ...f, [k]: iso }));
  };

  return (
    <article className="hoja">
      <div className="h-top">
        <img className="logo" src={logo} alt="Logo Creaciones Kathy" />
        <div className="marca">
          <b>CREACIONES KATHY</b>
          <i>Diseños exclusivos</i>
        </div>
        <div className="tipo">
          <span className="badge">{ficha.tipo}</span>
          <span>Ficha de medidas y consumo</span>
        </div>
      </div>

      <div className="datos">
        <Dato titulo="Nombre y apellidos" valor={ficha.nombre} onCambio={texto("nombre")} />
        <Dato titulo="Teléfono" valor={ficha.tel} onCambio={texto("tel")} />
        <Dato titulo="Fecha" valor={fechaCorta(ficha.fecha)} onCambio={fecha("fecha")} />
        <Dato titulo="Prueba" valor={fechaCorta(ficha.prueba)} onCambio={fecha("prueba")} />
        <Dato titulo="Entrega" valor={fechaCorta(ficha.entrega)} onCambio={fecha("entrega")} />
      </div>

      <div className="cuerpo">
        <div className="col">
          <div>
            <div className="tt tt-doble">
              <span>Medidas (cm)</span>
              <span>{etiquetaTipoMedida(ficha.tipoMedida)}</span>
            </div>
            {/* Con muchas medidas la tabla se parte en dos columnas para que todo quepa en una hoja. */}
            <div className={dosColumnas ? "m-dos" : undefined}>
              {(dosColumnas ? [lista.slice(0, mitad), lista.slice(mitad)] : [lista]).map((parte, i) => (
                <table className="m" key={i}>
                  <thead>
                    <tr>
                      <th>Clave</th>
                      <th>Medida</th>
                      <th className="der">cm</th>
                      <th className="der">½</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parte.map((m) => {
                      const v = medidas[m.id] ?? 0;
                      return (
                        <tr key={m.id}>
                          <td className="ab">{m.clave}</td>
                          <td>{m.nombre}</td>
                          <Editable
                            como="td"
                            className="v"
                            valor={v ? String(v) : ""}
                            bloqueado={!aMedida}
                            onCambio={(t) => {
                              const x = num(t);
                              actualizar((f) => ({ ...f, medidas: { ...f.medidas, [m.id]: x } }));
                            }}
                          />
                          <td className="h">{m.mitad && v ? v / 2 : ""}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ))}
            </div>
          </div>
          <div>
            <div className="tt">Otras medidas</div>
            <div className="lineas">
              {ficha.otras.map((o, i) => (
                <Editable
                  key={i}
                  valor={o}
                  onCambio={(t) =>
                    actualizar((f) => {
                      const otras = [...f.otras] as Ficha["otras"];
                      otras[i] = t;
                      return { ...f, otras };
                    })
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <div className="col">
          <div>
            <div className="tt">Prenda y consumo de tela</div>
            <div className="calc">
              <div className="r">
                <span>Prenda</span>
                <Editable como="b" valor={ficha.prendaTxt} onCambio={texto("prendaTxt")} />
              </div>
              <div className="r">
                <span>Tela / ancho</span>
                <b>
                  {ficha.tela.tela} · {ficha.tela.ancho} cm
                </b>
              </div>
              <div className="r">
                <span>Consumo por prenda</span>
                <b className="tot">{consumo.metros.toFixed(2)} m</b>
              </div>
              <div className="r">
                <span>Lote</span>
                <b>
                  {lote.prendas} prendas de {lote.totalMetros} m
                </b>
              </div>
            </div>
          </div>
          <div className="duo">
            <div>
              <div className="tt">Insumos</div>
              <table className="mini">
                <tbody>
                  {ficha.insumos.map((r, i) => (
                    <tr key={r.nombre}>
                      <td>{r.nombre}</td>
                      <Editable
                        como="td"
                        className="q"
                        valor={cant(r.cantidad)}
                        onCambio={(t) => {
                          const x = num(t);
                          actualizar((f) => ({ ...f, insumos: f.insumos.map((y, j) => (j === i ? { ...y, cantidad: x } : y)) }));
                        }}
                      />
                      <td className="u">{r.unidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <div className="tt">Telas</div>
              <table className="mini">
                <tbody>
                  {TELAS.map((t) => (
                    <tr key={t}>
                      <td>{t}</td>
                      <Editable
                        como="td"
                        className="q"
                        valor={cant(ficha.telas[t] ?? 0)}
                        onCambio={(txt) => {
                          const x = num(txt);
                          actualizar((f) => ({ ...f, telas: { ...f.telas, [t]: x } }));
                        }}
                      />
                      <td className="u">m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="tt" style={{ marginTop: 6 }}>
                Entretela
              </div>
              <table className="mini">
                <tbody>
                  {ficha.entretelas.map((r, i) => (
                    <tr key={r.nombre}>
                      <td>{r.nombre}</td>
                      <Editable
                        como="td"
                        className="q"
                        valor={cant(r.metros)}
                        onCambio={(t) => {
                          const x = num(t);
                          actualizar((f) => ({
                            ...f,
                            entretelas: f.entretelas.map((y, j) => (j === i ? { ...y, metros: x } : y)),
                          }));
                        }}
                      />
                      <td className="u">m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="tt" style={{ marginBottom: 0 }}>
            Mostrario de telas
          </div>
          <div className="mostrario">
            Espacio para engrapar o pegar
            <br />
            las muestras de tela
          </div>
        </div>
      </div>

      <div>
        <div className="tt">Observaciones</div>
        <div className="lineas">
          <Editable valor={ficha.obs} onCambio={texto("obs")} />
          <Editable valor={ficha.obs2} onCambio={texto("obs2")} />
        </div>
      </div>
      <div className="pie">
        <span>Creaciones Kathy · Guadalupe, N.L.</span>
        <span>
          {ficha.folio ? `Folio ${String(ficha.folio).padStart(4, "0")}` : "Sin folio"} · {fechaCorta(ficha.fecha)}
        </span>
      </div>
    </article>
  );
}

function Dato(props: { titulo: string; valor: string; onCambio: (t: string) => void }) {
  return (
    <div className="dato">
      <small>{props.titulo}</small>
      <Editable valor={props.valor} onCambio={props.onCambio} />
    </div>
  );
}
