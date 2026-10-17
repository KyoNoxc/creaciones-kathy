import { useEffect, useRef, useState } from "react";
import { borrarFicha, crearRespaldo, duplicarFicha, filtrarFichas, importarRespaldo, listarFichas } from "../datos/db";
import { fechaCorta, hoy, type Ficha } from "../datos/ficha";

interface Props {
  /** uid de la ficha abierta en la pestaña Ficha. */
  abierta: string;
  onAbrir: (f: Ficha) => void;
  onImprimir: (f: Ficha) => void;
  onBorrada: (uid: string) => void;
  onAviso: (texto: string) => void;
}

const folio = (n: number) => String(n).padStart(4, "0");

/** Historial de fichas guardadas: buscar, reabrir, duplicar, imprimir, borrar y respaldo. */
export function Reportes({ abierta, onAbrir, onImprimir, onBorrada, onAviso }: Props) {
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const [busca, setBusca] = useState("");
  const [error, setError] = useState("");
  const archivo = useRef<HTMLInputElement>(null);

  const recargar = () =>
    listarFichas()
      .then(setFichas)
      .catch(() => setError("No se pudieron leer las fichas guardadas en este navegador."));
  useEffect(() => {
    recargar();
  }, []);

  const visibles = fichas ? filtrarFichas(fichas, busca) : [];

  async function duplicar(f: Ficha) {
    const c = await duplicarFicha(f);
    onAviso(`Copia creada · folio ${folio(c.folio)}`);
    onAbrir(c);
  }

  async function borrar(f: Ficha) {
    if (!confirm(`¿Borrar la ficha ${folio(f.folio)} de ${f.nombre || "(sin nombre)"}? Esto no se puede deshacer.`)) return;
    await borrarFicha(f.uid);
    onBorrada(f.uid);
    onAviso(`Ficha ${folio(f.folio)} borrada`);
    recargar();
  }

  async function descargarRespaldo() {
    const r = await crearRespaldo();
    const url = URL.createObjectURL(new Blob([JSON.stringify(r, null, 1)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `respaldo-creaciones-kathy-${hoy()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onAviso(`Respaldo descargado · ${r.fichas.length} fichas`);
  }

  async function importar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError("");
    try {
      const r = await importarRespaldo(await f.text());
      const partes = [`${r.nuevas} nuevas`, `${r.actualizadas} actualizadas`];
      if (r.sinCambio) partes.push(`${r.sinCambio} ya estaban`);
      if (r.invalidas) partes.push(`${r.invalidas} no se pudieron leer`);
      onAviso(`Respaldo importado: ${partes.join(", ")}`);
      recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar el respaldo.");
    }
  }

  return (
    <section className="reportes panel">
      <div className="rep-top">
        <label className="f busca">
          Buscar clienta
          <input
            type="search"
            placeholder="Nombre, teléfono, prenda o folio"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            autoFocus
          />
        </label>
        <div className="respaldo">
          <button className="btn sec-btn" onClick={descargarRespaldo} disabled={!fichas?.length}>
            Descargar respaldo
          </button>
          <button className="btn sec-btn" onClick={() => archivo.current?.click()}>
            Importar respaldo
          </button>
          <input ref={archivo} type="file" accept="application/json,.json" hidden onChange={importar} />
        </div>
      </div>
      <p className="formula">
        Las fichas se guardan en este navegador. Descarga un respaldo de vez en cuando y guárdalo en otro lugar (USB, correo o la
        nube); con él puedes recuperarlas o pasarlas a otra computadora.
      </p>
      {error && <p className="error">{error}</p>}

      {fichas === null ? (
        <p className="vacio">Cargando…</p>
      ) : fichas.length === 0 ? (
        <p className="vacio">Todavía no hay fichas guardadas. Captura una en la pestaña Ficha y presiona Guardar.</p>
      ) : visibles.length === 0 ? (
        <p className="vacio">Ninguna ficha coincide con “{busca}”.</p>
      ) : (
        <div className="tabla-rep">
          <table>
            <thead>
              <tr>
                <th>Folio</th>
                <th>Clienta</th>
                <th>Prenda</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Entrega</th>
                <th>
                  <span className="sr">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((f) => (
                <tr key={f.uid} className={f.uid === abierta ? "abierta" : undefined}>
                  <td className="num">{folio(f.folio)}</td>
                  <td>
                    <b>{f.nombre || "(sin nombre)"}</b>
                    {f.tel && <small>{f.tel}</small>}
                  </td>
                  <td>{f.prendaTxt}</td>
                  <td>{f.tipo}</td>
                  <td className="num">{fechaCorta(f.fecha)}</td>
                  <td className="num">{fechaCorta(f.entrega)}</td>
                  <td className="acc">
                    <button className="btn chico" onClick={() => onAbrir(f)}>
                      Abrir
                    </button>
                    <button className="btn chico sec-btn" onClick={() => onImprimir(f)}>
                      Imprimir
                    </button>
                    <button className="btn chico sec-btn" onClick={() => duplicar(f)}>
                      Duplicar
                    </button>
                    <button className="btn chico peligro" onClick={() => borrar(f)}>
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="cuenta">
            {visibles.length === fichas.length ? "" : `${visibles.length} de `}
            {fichas.length} {fichas.length === 1 ? "ficha" : "fichas"}
          </p>
        </div>
      )}
    </section>
  );
}
