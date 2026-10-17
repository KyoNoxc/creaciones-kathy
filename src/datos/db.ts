import Dexie, { type Table } from "dexie";
import { nuevoUid, hoy, normalizarFicha, type Ficha } from "./ficha";

// Las fichas viven en el navegador (IndexedDB). No hay servidor: el respaldo JSON es la copia de seguridad.
class BaseKathy extends Dexie {
  fichas!: Table<Ficha, string>;
  constructor(nombre = "creaciones-kathy") {
    super(nombre);
    this.version(1).stores({ fichas: "uid, folio, nombre, actualizada" });
  }
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
}

export async function crearRespaldo(): Promise<Respaldo> {
  return { app: "creaciones-kathy", version: 1, exportado: new Date().toISOString(), fichas: await db.fichas.toArray() };
}

export interface ResultadoImportacion {
  nuevas: number;
  actualizadas: number;
  sinCambio: number;
  invalidas: number;
}

/**
 * Importa un respaldo. Las fichas se reconocen por su identificador: las que no existen se agregan
 * y las que ya existen solo se reemplazan si la del respaldo es más reciente. Nunca se borra nada.
 */
export async function importarRespaldo(texto: string): Promise<ResultadoImportacion> {
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error("El archivo no es un respaldo válido (no se pudo leer).");
  }
  const lista = Array.isArray(datos) ? datos : (datos as Partial<Respaldo> | null)?.fichas;
  if (!Array.isArray(lista)) throw new Error("El archivo no es un respaldo de Creaciones Kathy.");

  const r: ResultadoImportacion = { nuevas: 0, actualizadas: 0, sinCambio: 0, invalidas: 0 };
  await db.transaction("rw", db.fichas, async () => {
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
