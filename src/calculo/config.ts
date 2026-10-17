// Parámetros del cálculo de tela (versión 1). En la fase 3 se editan desde Configuración.
// Regla: no cambiar estos valores ni las fórmulas sin anotar el antes y el después en RETROALIMENTACION.md.
export interface ConfigCalculo {
  /** Holgura por media pieza, cm. */
  holgura: number;
  /** Costura por media pieza, cm. */
  costura: number;
  /** Orillo que se descuenta del ancho doblado, cm. */
  orillo: number;
  /** Merma por default, %. */
  merma: number;
  /** Ancho de tela por default, cm. */
  anchoTela: number;
}

export const CONFIG_DEFAULT: ConfigCalculo = {
  holgura: 2,
  costura: 1.5,
  orillo: 1,
  merma: 10,
  anchoTela: 150,
};
