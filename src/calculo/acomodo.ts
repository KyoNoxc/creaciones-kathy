import { CONFIG_DEFAULT, type ConfigCalculo } from "./config";
import type { Pieza } from "./piezas";

export interface Renglon {
  /** Ancho ya ocupado en el renglón, cm. */
  usado: number;
  /** Largo del renglón (el de su pieza más larga), cm. */
  largo: number;
  piezas: string[];
}

export interface Acomodo {
  renglones: Renglon[];
  /** Suma de los largos de los renglones, cm. */
  totalCm: number;
  /** Alguna pieza no cabe ni girada en el ancho útil. */
  noCabe: boolean;
  /** Ancho útil de la tela doblada, cm. */
  anchoUtil: number;
}

export const anchoUtil = (anchoTela: number, cfg: ConfigCalculo = CONFIG_DEFAULT) =>
  anchoTela / 2 - cfg.orillo;

/**
 * Acomodo por renglones sobre la tela doblada a lo largo: las piezas se ordenan
 * de la más larga a la más corta y se ponen lado a lado mientras quepan.
 * Si una pieza no cabe se gira; si aun así no cabe, se avisa.
 */
export function acomodar(piezas: Pieza[], anchoTela: number, cfg: ConfigCalculo = CONFIG_DEFAULT): Acomodo {
  const H = anchoUtil(anchoTela, cfg);
  const ps = piezas.map((p) => (p.ancho > H && p.largo <= H ? { ...p, ancho: p.largo, largo: p.ancho } : { ...p }));
  ps.sort((a, b) => b.largo - a.largo);
  const renglones: Renglon[] = [];
  for (const p of ps) {
    const r = renglones.find((r) => r.usado + p.ancho <= H);
    if (r) {
      r.usado += p.ancho;
      r.piezas.push(p.nombre);
    } else {
      renglones.push({ usado: p.ancho, largo: p.largo, piezas: [p.nombre] });
    }
  }
  return {
    renglones,
    totalCm: renglones.reduce((s, r) => s + r.largo, 0),
    noCabe: ps.some((p) => p.ancho > H),
    anchoUtil: H,
  };
}
