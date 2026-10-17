import { useEffect, useMemo, useState } from "react";
import { consumoDeTela, prendasPorLote, redondear2 } from "./calculo";
import { fichaEjemplo, type Ficha } from "./datos/ficha";
import { medidasEfectivas } from "./datos/tallas";
import { Hoja } from "./componentes/Hoja";
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

export type Actualizar = (cambio: (f: Ficha) => Ficha) => void;

export default function App() {
  const [ficha, setFicha] = useState<Ficha>(fichaEjemplo);
  const [pestana, setPestana] = useState<Pestana>("clienta");
  const actualizar: Actualizar = (cambio) => setFicha((f) => cambio(f));

  const medidas = medidasEfectivas(ficha.tipoMedida, ficha.medidas);
  const { prenda, manga, ancho, merma, tela, rollos, metrosRollo } = ficha.tela;
  const consumo = useMemo(
    () => consumoDeTela(prenda, manga, medidas, ancho, merma),
    [prenda, manga, medidas, ancho, merma],
  );
  const lote = prendasPorLote(rollos, metrosRollo, consumo.metros);

  // El consumo calculado se anota solo en la tela elegida (como en el prototipo).
  useEffect(() => {
    const m = redondear2(consumo.metros);
    setFicha((f) => (f.telas[tela] === m ? f : { ...f, telas: { ...f.telas, [tela]: m } }));
  }, [consumo.metros, tela]);

  return (
    <>
      <header className="app">
        <h1>
          Creaciones Kathy <span>reportes de taller</span>
        </h1>
        <p className="nota">Los datos son de ejemplo. La hoja de la derecha se corrige haciendo clic en cualquier valor.</p>
      </header>

      <div className="wrap">
        <section className="panel" aria-label="Captura">
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

        <VistaPrevia>
          <Hoja ficha={ficha} actualizar={actualizar} medidas={medidas} consumo={consumo} lote={lote} />
        </VistaPrevia>
      </div>
    </>
  );
}
