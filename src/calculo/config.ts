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
}

export const CONFIG_DEFAULT: ConfigCalculo = {
  holgura: 2,
  costura: 1.5,
  orillo: 1,
  // Mismos valores que el prototipo aprobado.
  dobladillo: { falda: 5.5, blusa: 6, pantalon: 6, vestido: 8, manga: 5 },
  merma: 10,
  anchoTela: 150,
};
