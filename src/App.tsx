import { useEffect, useMemo, useState } from "react";
import { consumoDeTela, prendasPorLote, redondear2, type Consumo } from "./calculo";
import type { ConfigCalculo } from "./calculo/config";
import { configInicial, type Configuracion } from "./datos/configuracion";
import { ContextoConfig } from "./datos/contexto";
import { guardarFicha, leerConfig } from "./datos/db";
import { Configuracion as PantallaConfig } from "./componentes/Configuracion";
import { fichaNueva, type Ficha } from "./datos/ficha";
import type { Medidas } from "./datos/medidas";
import { medidasEfectivas } from "./datos/tallas";
import { Hoja } from "./componentes/Hoja";
import { Reportes } from "./componentes/Reportes";
import { TabClienta } from "./componentes/TabClienta";
import { TabInsumos } from "./componentes/TabInsumos";
import { TabMedidas } from "./componentes/TabMedidas";
import { TabTela } from "./componentes/TabTela";
import { VistaPrevia } from "./componentes/VistaPrevia";

const PESTANAS = [
  { id: "clienta", nombre: "Clienta" },
  { id: "medidas", nombre: "Medidas" },
  { id: "tela", nombre: "Tela" },
  { id: "insumos", nombre: "Insumos" },
] as const;
type Pestana = (typeof PESTANAS)[number]["id"];
type Vista = "ficha" | "reportes" | "config";

export type Actualizar = (cambio: (f: Ficha) => Ficha) => void;

const hayMedidas = (M: Medidas) => Object.values(M).some((v) => v > 0);

/** Sin medidas capturadas no se calcula consumo (si no, saldrían solo la pretina o el cuello). */
function calcularConsumo(f: Ficha["tela"], M: Medidas, cfg: ConfigCalculo): Consumo {
  const c = consumoDeTela(f.prenda, f.manga, M, f.ancho, f.merma, cfg);
  return hayMedidas(M) ? c : { ...c, renglones: [], totalCm: 0, metros: 0, noCabe: false };
}

/** El consumo calculado se anota solo en la tela elegida (como en el prototipo). */
function conConsumoCfg(f: Ficha, config: Configuracion): Ficha {
  const M = medidasEfectivas(f.tipoMedida, f.medidas, config.tallas);
  const m = redondear2(calcularConsumo(f.tela, M, config.calculo).metros);
  return f.telas[f.tela.tela] === m ? f : { ...f, telas: { ...f.telas, [f.tela.tela]: m } };
}

const huella = (f: Ficha) => JSON.stringify(f);
const SIN_GUARDAR = "Hay cambios sin guardar en la ficha abierta. ¿Quieres descartarlos?";

/** Carga la configuración guardada antes de mostrar la app. */
export default function App() {
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    leerConfig()
      .then(setConfig)
      .catch(() => {
        setError(true);
        setConfig(configInicial());
      });
  }, []);
  if (!config) return <p className="vacio">Cargando…</p>;
  return (
    <ContextoConfig.Provider value={config}>
      {error && <p className="error">No se pudo leer la configuración guardada; se usan los valores iniciales.</p>}
      <Taller config={config} onConfig={setConfig} />
    </ContextoConfig.Provider>
  );
}

function Taller({ config, onConfig }: { config: Configuracion; onConfig: (c: Configuracion) => void }) {
  const conConsumo = (f: Ficha) => conConsumoCfg(f, config);
  const [ficha, setFicha] = useState<Ficha>(() => conConsumo(fichaNueva(config.calculo)));
  // Cómo estaba la ficha al abrirla o guardarla; si cambia, hay algo sin guardar.
  const [referencia, setReferencia] = useState(() => huella(ficha));
  const [vista, setVista] = useState<Vista>("ficha");
  const [pestana, setPestana] = useState<Pestana>("clienta");
  const [aviso, setAviso] = useState("");
  const [imprimirPendiente, setImprimirPendiente] = useState(false);

  const [configSinGuardar, setConfigSinGuardar] = useState(false);

  const actualizar: Actualizar = (cambio) => setFicha((f) => conConsumo(cambio(f)));
  const sinGuardar = huella(ficha) !== referencia;

  function irA(v: Vista) {
    if (v === vista) return;
    if (configSinGuardar && !confirm("Hay cambios sin guardar en Configuración. ¿Quieres descartarlos?")) return;
    setVista(v);
  }

  const medidas = medidasEfectivas(ficha.tipoMedida, ficha.medidas, config.tallas);
  const consumo = useMemo(
    () => calcularConsumo(ficha.tela, medidas, config.calculo),
    [ficha.tela, medidas, config.calculo],
  );
  const lote = prendasPorLote(ficha.tela.rollos, ficha.tela.metrosRollo, consumo.metros);

  // Avisar antes de cerrar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!sinGuardar && !configSinGuardar) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener("beforeunload", h);
    return () => removeEventListener("beforeunload", h);
  }, [sinGuardar, configSinGuardar]);

  // Imprimir después de que la hoja ya se pintó con el folio.
  useEffect(() => {
    if (!imprimirPendiente || vista !== "ficha") return;
    setImprimirPendiente(false);
    requestAnimationFrame(() => window.print());
  }, [imprimirPendiente, vista]);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(""), 3500);
    return () => clearTimeout(t);
  }, [aviso]);

  function abrir(f: Ficha) {
    const lista = conConsumo(f);
    setFicha(lista);
    setReferencia(huella(lista));
    setPestana("clienta");
    setVista("ficha");
  }

  async function guardar(): Promise<boolean> {
    if (!ficha.nombre.trim()) {
      alert("Escribe el nombre de la clienta antes de guardar.");
      setVista("ficha");
      setPestana("clienta");
      return false;
    }
    const g = await guardarFicha(ficha);
    setFicha(g);
    setReferencia(huella(g));
    setAviso(`Ficha guardada · folio ${String(g.folio).padStart(4, "0")}`);
    return true;
  }

  async function imprimir() {
    // Toda hoja impresa queda en Reportes; sin nombre se imprime sin guardar.
    if (ficha.nombre.trim() && sinGuardar && !(await guardar())) return;
    setImprimirPendiente(true);
  }

  function nueva() {
    if (sinGuardar && !confirm(SIN_GUARDAR)) return;
    abrir(fichaNueva(config.calculo));
  }

  return (
    <>
      <header className="app">
        <h1>
          Creaciones Kathy <span>reportes de taller</span>
        </h1>
        <nav className="vistas" aria-label="Secciones">
          <button aria-current={vista === "ficha"} onClick={() => irA("ficha")}>
            Ficha{sinGuardar && <span className="punto" title="Sin guardar" />}
          </button>
          <button aria-current={vista === "reportes"} onClick={() => irA("reportes")}>
            Reportes
          </button>
          <button aria-current={vista === "config"} onClick={() => irA("config")}>
            Configuración
          </button>
        </nav>
      </header>

      {aviso && (
        <div className="aviso-flot" role="status">
          {aviso}
        </div>
      )}

      {vista === "config" ? (
        <PantallaConfig
          onSinGuardar={setConfigSinGuardar}
          onGuardada={(c) => {
            onConfig(c);
            setAviso("Configuración guardada");
          }}
        />
      ) : vista === "reportes" ? (
        <Reportes
          abierta={ficha.uid}
          onAbrir={(f) => {
            if (f.uid !== ficha.uid && sinGuardar && !confirm(SIN_GUARDAR)) return;
            abrir(f);
          }}
          onImprimir={(f) => {
            if (f.uid !== ficha.uid && sinGuardar && !confirm(SIN_GUARDAR)) return;
            abrir(f);
            setImprimirPendiente(true);
          }}
          onBorrada={(uid) => {
            // Si se borró la ficha abierta, queda como nueva y sin guardar.
            if (uid === ficha.uid) {
              setFicha((f) => ({ ...f, folio: 0, creada: "", actualizada: "" }));
              setReferencia("");
            }
          }}
          onAviso={setAviso}
          onConfigImportada={(c) => onConfig(c)}
        />
      ) : (
        <div className="wrap">
          <section className="panel" aria-label="Captura">
            <div className="acciones">
              <span className="estado">
                {ficha.folio ? `Folio ${String(ficha.folio).padStart(4, "0")}` : "Ficha nueva"}
                {sinGuardar ? (
                  <b className="sin"> · sin guardar</b>
                ) : (
                  ficha.folio > 0 && <span className="ok"> · guardada</span>
                )}
              </span>
              <button className="btn sec-btn" onClick={nueva}>
                Nueva
              </button>
              <button className="btn" onClick={guardar} disabled={!sinGuardar}>
                Guardar
              </button>
            </div>
            <div className="tabs" role="tablist">
              {PESTANAS.map((p) => (
                <button key={p.id} role="tab" aria-selected={pestana === p.id} onClick={() => setPestana(p.id)}>
                  {p.nombre}
                </button>
              ))}
            </div>
            {pestana === "clienta" && <TabClienta ficha={ficha} actualizar={actualizar} />}
            {pestana === "medidas" && <TabMedidas ficha={ficha} actualizar={actualizar} />}
            {pestana === "tela" && <TabTela ficha={ficha} actualizar={actualizar} consumo={consumo} lote={lote} />}
            {pestana === "insumos" && <TabInsumos ficha={ficha} actualizar={actualizar} />}
          </section>

          <VistaPrevia onImprimir={imprimir}>
            <Hoja ficha={ficha} actualizar={actualizar} medidas={medidas} consumo={consumo} lote={lote} />
          </VistaPrevia>
        </div>
      )}
    </>
  );
}
