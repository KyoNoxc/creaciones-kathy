import { CONFIG_DEFAULT, type ConfigCalculo } from "../calculo/config";
import { MEDIDAS_DEL_CALCULO } from "../calculo/piezas";
import { MEDIDAS, type DefMedida } from "./medidas";
import { TALLAS, TALLAS_INDUSTRIALES, type TablaTallas } from "./tallas";

/** Todo lo que Kathy ajusta en la pantalla de Configuración. */
export interface Configuracion {
  calculo: ConfigCalculo;
  medidas: DefMedida[];
  tallas: TablaTallas;
  /** Mientras sea true, la app avisa que los valores de las tallas son provisionales. */
  tallasProvisionales: boolean;
}

export function configInicial(): Configuracion {
  return structuredClone({ calculo: CONFIG_DEFAULT, medidas: MEDIDAS, tallas: TALLAS, tallasProvisionales: true });
}

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const numero = (x: unknown, def: number) => (typeof x === "number" && isFinite(x) ? x : def);

/** Completa una configuración guardada o importada con los valores iniciales para lo que falte. */
export function normalizarConfig(x: unknown): Configuracion {
  const base = configInicial();
  if (!esObjeto(x)) return base;

  const c = esObjeto(x.calculo) ? x.calculo : {};
  const d = esObjeto(c.dobladillo) ? c.dobladillo : {};
  const calculo: ConfigCalculo = {
    holgura: numero(c.holgura, base.calculo.holgura),
    costura: numero(c.costura, base.calculo.costura),
    orillo: numero(c.orillo, base.calculo.orillo),
    merma: numero(c.merma, base.calculo.merma),
    anchoTela: numero(c.anchoTela, base.calculo.anchoTela),
    dobladillo: {
      falda: numero(d.falda, base.calculo.dobladillo.falda),
      blusa: numero(d.blusa, base.calculo.dobladillo.blusa),
      pantalon: numero(d.pantalon, base.calculo.dobladillo.pantalon),
      vestido: numero(d.vestido, base.calculo.dobladillo.vestido),
      manga: numero(d.manga, base.calculo.dobladillo.manga),
    },
  };

  let medidas = Array.isArray(x.medidas)
    ? x.medidas
        .filter((m): m is Record<string, unknown> => esObjeto(m) && typeof m.id === "string" && !!m.id)
        .map((m) => ({ id: m.id as string, clave: String(m.clave ?? m.id), nombre: String(m.nombre ?? ""), mitad: !!m.mitad }))
    : base.medidas;
  // Las medidas que usan las fórmulas no pueden faltar.
  for (const id of MEDIDAS_DEL_CALCULO) {
    if (!medidas.some((m) => m.id === id)) medidas = [...medidas, base.medidas.find((m) => m.id === id)!];
  }

  const t = esObjeto(x.tallas) ? x.tallas : {};
  const tallas = Object.fromEntries(
    TALLAS_INDUSTRIALES.map((talla) => {
      const fila = esObjeto(t[talla]) ? t[talla] : {};
      return [talla, Object.fromEntries(medidas.map((m) => [m.id, numero(fila[m.id], base.tallas[talla][m.id] ?? 0)]))];
    }),
  ) as TablaTallas;

  return { calculo, medidas, tallas, tallasProvisionales: x.tallasProvisionales !== false };
}

/** Errores que impiden guardar la configuración; lista vacía si todo está bien. */
export function validarConfig(c: Configuracion): string[] {
  const errores: string[] = [];
  const vistas = new Set<string>();
  for (const m of c.medidas) {
    const clave = m.clave.trim();
    if (!clave) errores.push(`Hay una medida sin clave${m.nombre ? ` (${m.nombre})` : ""}.`);
    else if (vistas.has(clave)) errores.push(`La clave ${clave} está repetida.`);
    vistas.add(clave);
    if (!m.nombre.trim()) errores.push(`La medida ${clave || "sin clave"} no tiene nombre.`);
  }
  if (c.calculo.anchoTela <= 2 * c.calculo.orillo) errores.push("El ancho de tela es demasiado chico.");
  if (c.calculo.merma < 0) errores.push("La merma no puede ser negativa.");
  return errores;
}

export const nuevoIdMedida = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
