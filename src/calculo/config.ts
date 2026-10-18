// Parámetros del cálculo de tela (versión 1). Se editan desde Configuración.
// Regla: no cambiar estos valores por default ni las fórmulas sin anotar el antes y el después en RETROALIMENTACION.md.
export interface Dobladillos {
  /** cm que se suman al largo de cada pieza, por prenda. */
  falda: number;
  blusa: number;
  pantalon: number;
  vestido: number;
  manga: number;
}

/** Una pieza de una prenda: su ancho y largo se calculan con fórmulas que Kathy puede cambiar. */
export interface DefPieza {
  nombre: string;
  /** Fórmula del ancho (sobre la tela doblada), cm. */
  ancho: string;
  /** Fórmula del largo, cm. */
  largo: string;
  /** Solo se corta si la prenda lleva manga. */
  esManga?: boolean;
}

export type FormulasPrendas = Record<"falda" | "blusa" | "pantalon" | "vestido", DefPieza[]>;

// Fórmulas iniciales: son exactamente las del prototipo aprobado (ver CLAUDE.md, "Cálculo de tela").
const MANGA: DefPieza = { nombre: "Manga", ancho: "(CBr + 6)/2 + costura", largo: "largoManga + dobladilloManga", esManga: true };
const PRETINA: DefPieza = { nombre: "Pretina", ancho: "8", largo: "CC/2 + 5" };
export const FORMULAS_INICIALES: FormulasPrendas = {
  falda: [
    { nombre: "Delantero", ancho: "CCad/4 + holgura + costura", largo: "LF + dobladillo" },
    { nombre: "Trasero", ancho: "CCad/4 + holgura + costura", largo: "LF + dobladillo" },
    PRETINA,
  ],
  blusa: [
    { nombre: "Delantero", ancho: "mayor(CB, CCad)/4 + holgura + costura", largo: "LC + dobladillo" },
    { nombre: "Trasero", ancho: "mayor(CB, CCad)/4 + holgura + costura", largo: "LC + dobladillo" },
    MANGA,
    { nombre: "Cuello/vistas", ancho: "12", largo: "CCo/2 + 6" },
  ],
  pantalon: [
    { nombre: "Delantero", ancho: "CCad/4 + 6 + costura", largo: "LP + dobladillo" },
    { nombre: "Trasero", ancho: "CCad/4 + 6 + costura + 3", largo: "LP + dobladillo" },
    PRETINA,
  ],
  vestido: [
    { nombre: "Delantero", ancho: "(mayor(CB, CCad) + 4)/4 + holgura + costura", largo: "TD + (LF − ACad) + dobladillo" },
    { nombre: "Trasero", ancho: "(mayor(CB, CCad) + 4)/4 + holgura + costura", largo: "TD + (LF − ACad) + dobladillo" },
    MANGA,
  ],
};

export interface ConfigCalculo {
  /** Holgura por media pieza, cm. */
  holgura: number;
  /** Costura por media pieza, cm. */
  costura: number;
  /** Orillo que se descuenta del ancho doblado, cm. */
  orillo: number;
  /** Dobladillo/costura que se suma al largo, cm. */
  dobladillo: Dobladillos;
  /** Merma por default, %. */
  merma: number;
  /** Ancho de tela por default, cm. */
  anchoTela: number;
  /** Piezas de cada prenda con sus fórmulas. */
  formulas: FormulasPrendas;
}

export const CONFIG_DEFAULT: ConfigCalculo = {
  holgura: 2,
  costura: 1.5,
  orillo: 1,
  // Mismos valores que el prototipo aprobado.
  dobladillo: { falda: 5.5, blusa: 6, pantalon: 6, vestido: 8, manga: 5 },
  merma: 10,
  anchoTela: 150,
  formulas: FORMULAS_INICIALES,
};
