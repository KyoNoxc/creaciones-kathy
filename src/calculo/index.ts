import type { Medidas } from "../datos/medidas";
import { acomodar, type Acomodo } from "./acomodo";
import { CONFIG_DEFAULT, type ConfigCalculo } from "./config";
import { piezasDePrenda, type Manga, type Prenda } from "./piezas";

export * from "./acomodo";
export * from "./config";
export * from "./piezas";

export interface Consumo extends Acomodo {
  /** Metros por prenda, ya con merma. */
  metros: number;
}

/** Total = suma de largos × (1 + merma%), en metros. */
export function consumoDeTela(
  prenda: Prenda,
  manga: Manga,
  M: Medidas,
  anchoTela: number,
  mermaPct: number,
  cfg: ConfigCalculo = CONFIG_DEFAULT,
): Consumo {
  const a = acomodar(piezasDePrenda(prenda, manga, M, cfg), anchoTela, cfg);
  return { ...a, metros: (a.totalCm * (1 + mermaPct / 100)) / 100 };
}

export interface Lote {
  totalMetros: number;
  prendas: number;
  sobranteMetros: number;
}

/** Prendas por lote = piso((rollos × metros por rollo) / metros por prenda). */
export function prendasPorLote(rollos: number, metrosPorRollo: number, metrosPorPrenda: number): Lote {
  const totalMetros = rollos * metrosPorRollo;
  const prendas = metrosPorPrenda > 0 ? Math.floor(totalMetros / metrosPorPrenda) : 0;
  return { totalMetros, prendas, sobranteMetros: totalMetros - prendas * metrosPorPrenda };
}

export const redondear2 = (x: number) => Math.round(x * 100) / 100;
