import type { Medidas } from "./medidas";

export type TipoMedida = "AM" | "CH" | "M" | "G" | "XL" | "XXL";

/** Opciones del desplegable, en este orden. "A medida" es la primera y la de default. */
export const TIPOS_MEDIDA: { valor: TipoMedida; etiqueta: string }[] = [
  { valor: "AM", etiqueta: "A medida" },
  { valor: "CH", etiqueta: "T-CH" },
  { valor: "M", etiqueta: "T-M" },
  { valor: "G", etiqueta: "T-G" },
  { valor: "XL", etiqueta: "T-XL" },
  { valor: "XXL", etiqueta: "T-XXL" },
];

export type TallaIndustrial = Exclude<TipoMedida, "AM">;

// VALORES PROVISIONALES: base talla M y un paso fijo por talla.
// Reemplazar con la tabla industrial de Kathy en cuanto la mande (se editará en Configuración, fase 3).
const BASE_M: Medidas = {
  CCo: 36, AE: 38, HH: 40, H: 12, TT: 40, TD: 42, AB: 24, SB: 18, AEs: 20, CT: 84,
  CB: 92, SF: 20, SE: 21, CC: 74, CCad: 100, ACad: 20, C: 20, LB: 58, LCb: 10, LML: 60,
  LMC: 22, CBr: 30, CM: 16, P: 20, LC: 62, LCh: 66, LF: 60, LP: 100, CK: 40, CBo: 42,
};
const PASO: Medidas = {
  CCo: 1, AE: 1, HH: 1, H: 0.5, TT: 0.5, TD: 1, AB: 0.5, SB: 0.5, AEs: 0.5, CT: 4,
  CB: 4, SF: 1, SE: 1, CC: 4, CCad: 4, ACad: 0.5, C: 0.5, LB: 0.5, LCb: 0.5, LML: 0.5,
  LMC: 0.5, CBr: 2, CM: 0.5, P: 0.5, LC: 1, LCh: 1, LF: 0.5, LP: 0.5, CK: 2, CBo: 2,
};
const NIVEL: Record<TallaIndustrial, number> = { CH: -1, M: 0, G: 1, XL: 2, XXL: 3 };

export const TALLAS: Record<TallaIndustrial, Medidas> = Object.fromEntries(
  (Object.keys(NIVEL) as TallaIndustrial[]).map((t) => [
    t,
    Object.fromEntries(Object.keys(BASE_M).map((k) => [k, BASE_M[k] + PASO[k] * NIVEL[t]])),
  ]),
) as Record<TallaIndustrial, Medidas>;

export const TALLAS_PROVISIONALES = true;

/** Las medidas que valen para la ficha: las capturadas si es "A medida", o las de la talla. */
export function medidasEfectivas(tipo: TipoMedida, capturadas: Medidas): Medidas {
  return tipo === "AM" ? capturadas : TALLAS[tipo];
}

export function etiquetaTipoMedida(tipo: TipoMedida): string {
  return tipo === "AM" ? "A medida" : `Talla T-${tipo} · industrial`;
}
