// Lista oficial de medidas de Kathy, en su orden. Se edita desde Configuración.
export interface DefMedida {
  /**
   * Identificador fijo con el que se guardan los valores en las fichas y que usan las fórmulas.
   * No cambia aunque Kathy renombre la clave que se ve (p. ej. CBr → CB).
   */
  id: string;
  /** Clave que se muestra en la app y en la hoja. */
  clave: string;
  nombre: string;
  /** En la hoja se calcula sola la mitad (½), como en la libreta. */
  mitad: boolean;
}

export const MEDIDAS: DefMedida[] = ([
  { clave: "CCo", nombre: "Contorno de cuello", mitad: true },
  { clave: "AE", nombre: "Ancho de espalda", mitad: true },
  { clave: "HH", nombre: "Hombro a hombro", mitad: false },
  { clave: "H", nombre: "Hombro", mitad: false },
  { clave: "TT", nombre: "Talle trasero", mitad: false },
  { clave: "TD", nombre: "Talle delantero", mitad: false },
  { clave: "AB", nombre: "Alto de busto", mitad: false },
  { clave: "SB", nombre: "Separación de busto", mitad: true },
  { clave: "AEs", nombre: "Alto de escote", mitad: false },
  { clave: "CT", nombre: "Contorno de tórax", mitad: true },
  { clave: "CB", nombre: "Contorno de busto", mitad: true },
  { clave: "SF", nombre: "Sisa frente", mitad: false },
  { clave: "SE", nombre: "Sisa espalda", mitad: false },
  { clave: "CC", nombre: "Contorno de cintura", mitad: true },
  { clave: "CCad", nombre: "Contorno de cadera", mitad: true },
  { clave: "ACad", nombre: "Alto de cadera", mitad: false },
  { clave: "C", nombre: "Costado", mitad: false },
  { clave: "LB", nombre: "Largo de brazo", mitad: false },
  { clave: "LCb", nombre: "Largo capa brazo", mitad: false },
  { clave: "LML", nombre: "Largo de manga larga", mitad: false },
  { clave: "LMC", nombre: "Largo de manga corta", mitad: false },
  // En la libreta aparece como CB; se usa CBr hasta que Kathy confirme.
  { clave: "CBr", nombre: "Contorno de brazo", mitad: true },
  { clave: "CM", nombre: "Contorno de muñeca", mitad: true },
  { clave: "P", nombre: "Puño", mitad: false },
  { clave: "LC", nombre: "Largo de camisa", mitad: false },
  { clave: "LCh", nombre: "Largo de chaqueta", mitad: false },
  { clave: "LF", nombre: "Largo de falda", mitad: false },
  { clave: "LP", nombre: "Largo de pantalón", mitad: false },
  { clave: "CK", nombre: "Contorno de rodilla", mitad: true },
  { clave: "CBo", nombre: "Contorno de bota", mitad: true },
] as Omit<DefMedida, "id">[]).map((m) => ({ id: m.clave, ...m }));

export type Medidas = Record<string, number>;

/** Medidas de ejemplo del prototipo (clienta "a medida"). */
export const MEDIDAS_EJEMPLO: Medidas = {
  CCo: 36, AE: 38, HH: 40, H: 12, TT: 40, TD: 42, AB: 24, SB: 18, AEs: 20, CT: 84,
  CB: 92, SF: 20, SE: 21, CC: 74, CCad: 100, ACad: 20, C: 20, LB: 58, LCb: 10, LML: 60,
  LMC: 22, CBr: 30, CM: 16, P: 20, LC: 62, LCh: 66, LF: 60, LP: 100, CK: 40, CBo: 42,
};
