import { CONFIG_DEFAULT, FORMULAS_INICIALES, type ConfigCalculo, type DefPieza, type FormulasPrendas } from "../calculo/config";
import { revisarFormula, variablesDeFormula } from "../calculo/formula";
import { PARAMETROS_FORMULA } from "../calculo/piezas";
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
    formulas: normalizarFormulas(c.formulas),
  };

  let medidas = Array.isArray(x.medidas)
    ? x.medidas
        .filter((m): m is Record<string, unknown> => esObjeto(m) && typeof m.id === "string" && !!m.id)
        .map((m) => ({ id: m.id as string, clave: String(m.clave ?? m.id), nombre: String(m.nombre ?? ""), mitad: !!m.mitad }))
    : base.medidas;
  // Las medidas originales que usan las fórmulas no pueden faltar.
  for (const id of idsUsados(calculo.formulas, base.medidas)) {
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
  const validos = nombresParaFormulas(c.medidas);
  for (const [prenda, piezas] of Object.entries(c.calculo.formulas)) {
    for (const p of piezas) {
      if (!p.nombre.trim()) errores.push(`Hay una pieza sin nombre en ${prenda}.`);
      for (const campo of ["ancho", "largo"] as const) {
        const e = revisarFormula(p[campo], validos);
        if (e) errores.push(`${prenda} · ${p.nombre || "pieza"} · ${campo}: ${e}`);
      }
    }
  }
  return errores;
}

export const nuevoIdMedida = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const PRENDAS_FORMULA = Object.keys(FORMULAS_INICIALES) as (keyof FormulasPrendas)[];

function normalizarFormulas(x: unknown): FormulasPrendas {
  const f = esObjeto(x) ? x : {};
  return Object.fromEntries(
    PRENDAS_FORMULA.map((p) => {
      const lista = Array.isArray(f[p])
        ? (f[p] as unknown[])
            .filter(esObjeto)
            .map((d): DefPieza => ({
              nombre: String(d.nombre ?? ""),
              ancho: String(d.ancho ?? "0"),
              largo: String(d.largo ?? "0"),
              ...(d.esManga ? { esManga: true } : {}),
            }))
        : structuredClone(FORMULAS_INICIALES[p]);
      return [p, lista];
    }),
  ) as FormulasPrendas;
}

/** Todo lo que se puede escribir en una fórmula: ids y claves de medidas y los parámetros. */
export function nombresParaFormulas(medidas: DefMedida[]): Set<string> {
  return new Set([...medidas.flatMap((m) => [m.id, m.clave.trim()]), ...PARAMETROS_FORMULA.map((p) => p.nombre)]);
}

/** Ids de las medidas que usan las fórmulas (escritas por id o por clave). */
export function idsUsados(formulas: FormulasPrendas, medidas: DefMedida[]): Set<string> {
  const usados = new Set(
    Object.values(formulas).flatMap((ps) => ps.flatMap((p) => [...variablesDeFormula(p.ancho), ...variablesDeFormula(p.largo)])),
  );
  // largoManga usa LML y LMC
  if (usados.has("largoManga")) (usados.add("LML"), usados.add("LMC"));
  return new Set(medidas.filter((m) => usados.has(m.id) || usados.has(m.clave.trim())).map((m) => m.id));
}

/** Medidas por id y también por su clave visible, para calcular las fórmulas. */
export function medidasParaFormulas(M: Record<string, number>, medidas: DefMedida[]): Record<string, number> {
  const r = { ...M };
  for (const m of medidas) {
    r[m.id] = M[m.id] ?? 0;
    const clave = m.clave.trim();
    if (clave && !(clave in r)) r[clave] = r[m.id];
  }
  return r;
}
