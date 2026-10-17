import Dexie, { type Table } from "dexie";
import { normalizarConfig, type Configuracion } from "./configuracion";
import { nuevoUid, hoy, normalizarFicha, type Ficha } from "./ficha";

// Las fichas viven en el navegador (IndexedDB). No hay servidor: el respaldo JSON es la copia de seguridad.
class BaseKathy extends Dexie {
  fichas!: Table<Ficha, string>;
  ajustes!: Table<{ id: string; valor: unknown }, string>;
  constructor(nombre = "creaciones-kathy") {
    super(nombre);
    this.version(1).stores({ fichas: "uid, folio, nombre, actualizada" });
    this.version(2).stores({ ajustes: "id" });
  }
}

// ===== Configuración =====

export async function leerConfig(): Promise<Configuracion> {
  const fila = await db.ajustes.get("config");
  return normalizarConfig(fila?.valor);
}

export async function guardarConfig(c: Configuracion): Promise<void> {
  await db.ajustes.put({ id: "config", valor: c });
}

export let db = new BaseKathy();

/** Solo para pruebas: usar una base aparte. */
export function usarBase(nombre: string) {
  db = new BaseKathy(nombre);
  return db;
}

/** Todas las fichas, de la más reciente a la más vieja. */
export async function listarFichas(): Promise<Ficha[]> {
  const fichas = await db.fichas.orderBy("actualizada").reverse().toArray();
  return fichas.map((f) => normalizarFicha(f)).filter((f): f is Ficha => !!f);
}

export async function siguienteFolio(): Promise<number> {
  const ultima = await db.fichas.orderBy("folio").last();
  return (ultima?.folio ?? 0) + 1;
}

/** Guarda la ficha; si es nueva le asigna folio. Regresa la ficha tal como quedó guardada. */
export async function guardarFicha(f: Ficha): Promise<Ficha> {
  const ahora = new Date().toISOString();
  const lista: Ficha = {
    ...f,
    folio: f.folio || (await siguienteFolio()),
    creada: f.creada || ahora,
    actualizada: ahora,
  };
  await db.fichas.put(lista);
  return lista;
}

export async function borrarFicha(uid: string): Promise<void> {
  await db.fichas.delete(uid);
}

/** Copia de una ficha con folio nuevo y fecha de hoy; las fechas de prueba y entrega quedan vacías. */
export async function duplicarFicha(f: Ficha): Promise<Ficha> {
  return guardarFicha({ ...structuredClone(f), uid: nuevoUid(), folio: 0, creada: "", fecha: hoy(), prueba: "", entrega: "" });
}

/** Busca por nombre de clienta (sin importar mayúsculas ni acentos), teléfono, prenda o folio. */
export function filtrarFichas(fichas: Ficha[], texto: string): Ficha[] {
  const q = sinAcentos(texto.trim());
  if (!q) return fichas;
  return fichas.filter((f) =>
    [f.nombre, f.tel, f.prendaTxt, String(f.folio).padStart(4, "0")].some((c) => sinAcentos(c).includes(q)),
  );
}

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// ===== Respaldo =====

export interface Respaldo {
  app: "creaciones-kathy";
  version: 1;
  exportado: string;
  fichas: Ficha[];
  configuracion?: Configuracion;
}

export async function crearRespaldo(): Promise<Respaldo> {
  return {
    app: "creaciones-kathy",
    version: 1,
    exportado: new Date().toISOString(),
    fichas: await db.fichas.toArray(),
    configuracion: await leerConfig(),
  };
}

/** Lee el archivo de respaldo sin importar nada todavía. */
export function leerRespaldo(texto: string): { fichas: unknown[]; configuracion?: unknown } {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error("El archivo no es un respaldo válido (no se pudo leer).");
  }
  if (Array.isArray(datos)) return { fichas: datos };
  const r = datos as Partial<Respaldo> | null;
  if (!r || !Array.isArray(r.fichas)) throw new Error("El archivo no es un respaldo de Creaciones Kathy.");
  return { fichas: r.fichas, configuracion: r.configuracion };
}

export interface ResultadoImportacion {
  nuevas: number;
  actualizadas: number;
  sinCambio: number;
  invalidas: number;
  /** Se reemplazó la configuración con la del respaldo. */
  config: boolean;
}

/**
 * Importa un respaldo. Las fichas se reconocen por su identificador: las que no existen se agregan
 * y las que ya existen solo se reemplazan si la del respaldo es más reciente. Nunca se borra nada.
 * La configuración del respaldo solo se usa si se pide con conConfig.
 */
export async function importarRespaldo(texto: string, conConfig = false): Promise<ResultadoImportacion> {
  const { fichas: lista, configuracion } = leerRespaldo(texto);
  const r: ResultadoImportacion = { nuevas: 0, actualizadas: 0, sinCambio: 0, invalidas: 0, config: false };
  await db.transaction("rw", db.fichas, db.ajustes, async () => {
    if (conConfig && configuracion) {
      await guardarConfig(normalizarConfig(configuracion));
      r.config = true;
    }
    let folio = (await siguienteFolio()) - 1;
    for (const x of lista) {
      const f = normalizarFicha(x);
      if (!f) {
        r.invalidas++;
        continue;
      }
      const actual = await db.fichas.get(f.uid);
      if (!actual) {
        await db.fichas.put({ ...f, folio: f.folio || ++folio });
        r.nuevas++;
      } else if (f.actualizada > actual.actualizada) {
        await db.fichas.put(f);
        r.actualizadas++;
      } else {
        r.sinCambio++;
      }
    }
  });
  return r;
}
