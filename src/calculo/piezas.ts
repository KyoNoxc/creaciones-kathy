import type { Medidas } from "../datos/medidas";
import { CONFIG_DEFAULT, type ConfigCalculo, type DefPieza } from "./config";
import { ErrorFormula, calcularFormula } from "./formula";

export type Prenda = "falda" | "blusa" | "pantalon" | "vestido";
export type Manga = "larga" | "corta" | "sin";

export const PRENDAS: { valor: Prenda; etiqueta: string }[] = [
  { valor: "falda", etiqueta: "Falda recta" },
  { valor: "blusa", etiqueta: "Blusa / camisa" },
  { valor: "pantalon", etiqueta: "Pantalón" },
  { valor: "vestido", etiqueta: "Vestido" },
];

/** La prenda lleva manga si alguna de sus piezas está marcada como manga. */
export const prendaLlevaManga = (p: Prenda, cfg: ConfigCalculo = CONFIG_DEFAULT) => cfg.formulas[p].some((x) => x.esManga);

export interface Pieza {
  nombre: string;
  /** Ancho de la pieza sobre la tela doblada, cm. */
  ancho: number;
  /** Largo de la pieza, cm. */
  largo: number;
}

/** Nombres que se pueden usar en las fórmulas además de las claves de las medidas. */
export const PARAMETROS_FORMULA = [
  { nombre: "holgura", descripcion: "holgura por media pieza" },
  { nombre: "costura", descripcion: "costura por media pieza" },
  { nombre: "dobladillo", descripcion: "dobladillo de la prenda" },
  { nombre: "dobladilloManga", descripcion: "dobladillo de la manga" },
  { nombre: "largoManga", descripcion: "LML si la manga es larga, LMC si es corta" },
];

/** Valores de holgura, costura, etc. para las fórmulas de una prenda. */
export function parametrosFormula(prenda: Prenda, manga: Manga, M: Medidas, cfg: ConfigCalculo): Record<string, number> {
  return {
    holgura: cfg.holgura,
    costura: cfg.costura,
    dobladillo: cfg.dobladillo[prenda],
    dobladilloManga: cfg.dobladillo.manga,
    largoManga: (manga === "corta" ? M.LMC : M.LML) ?? 0,
  };
}

export interface PiezasCalculadas {
  piezas: Pieza[];
  /** Errores de fórmulas, por pieza; esas piezas no entran al cálculo. */
  errores: string[];
}

/**
 * Piezas que lleva una prenda, calculadas con las fórmulas de Configuración.
 * M trae las medidas por su id (y, si se quiere, también por su clave visible).
 */
export function piezasConErrores(
  prenda: Prenda,
  manga: Manga,
  M: Medidas,
  cfg: ConfigCalculo = CONFIG_DEFAULT,
): PiezasCalculadas {
  const vars = { ...M, ...parametrosFormula(prenda, manga, M, cfg) };
  const piezas: Pieza[] = [];
  const errores: string[] = [];
  for (const d of cfg.formulas[prenda]) {
    if (d.esManga && manga === "sin") continue;
    try {
      piezas.push({ nombre: d.nombre, ancho: calcularFormula(d.ancho, vars), largo: calcularFormula(d.largo, vars) });
    } catch (e) {
      errores.push(`${d.nombre}: ${e instanceof ErrorFormula ? e.message : "fórmula con error"}`);
    }
  }
  return { piezas, errores };
}

export function piezasDePrenda(prenda: Prenda, manga: Manga, M: Medidas, cfg: ConfigCalculo = CONFIG_DEFAULT): Pieza[] {
  return piezasConErrores(prenda, manga, M, cfg).piezas;
}

export type { DefPieza };
