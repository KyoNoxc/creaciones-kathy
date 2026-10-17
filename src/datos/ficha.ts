import { CONFIG_DEFAULT, type Manga, type Prenda } from "../calculo";
import { MEDIDAS, MEDIDAS_EJEMPLO, type Medidas } from "./medidas";
import type { TipoMedida } from "./tallas";

export type TipoFicha = "DAMA" | "CABALLERO" | "NIÑA" | "NIÑO";
export const TIPOS_FICHA: TipoFicha[] = ["DAMA", "CABALLERO", "NIÑA", "NIÑO"];

export const TELAS = ["Lycra", "Poliéster", "Polar", "Algodón", "Dacrón", "Popelina"] as const;

export interface Insumo {
  nombre: string;
  cantidad: number;
  unidad: "pza" | "m";
}

export interface Entretela {
  nombre: string;
  metros: number;
}

export interface Ficha {
  /** Identificador único; sirve para respaldar e importar sin duplicar. */
  uid: string;
  /** 0 mientras no se ha guardado; al guardar toma el siguiente folio. */
  folio: number;
  /** Fecha y hora ISO; vacías mientras no se ha guardado. */
  creada: string;
  actualizada: string;
  nombre: string;
  tel: string;
  tipo: TipoFicha;
  /** Fechas en formato AAAA-MM-DD. */
  fecha: string;
  prueba: string;
  entrega: string;
  prendaTxt: string;
  obs: string;
  obs2: string;
  tipoMedida: TipoMedida;
  /** Medidas capturadas "a medida"; se conservan aunque se elija una talla. */
  medidas: Medidas;
  otras: [string, string, string];
  tela: {
    prenda: Prenda;
    manga: Manga;
    ancho: number;
    merma: number;
    tela: string;
    rollos: number;
    metrosRollo: number;
  };
  insumos: Insumo[];
  telas: Record<string, number>;
  entretelas: Entretela[];
}

export const nuevoUid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/** Fecha local de hoy, AAAA-MM-DD. */
export function hoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Ficha en blanco, lista para capturar una clienta nueva. */
export function fichaNueva(): Ficha {
  return {
    uid: nuevoUid(),
    folio: 0,
    creada: "",
    actualizada: "",
    nombre: "",
    tel: "",
    tipo: "DAMA",
    fecha: hoy(),
    prueba: "",
    entrega: "",
    prendaTxt: "",
    obs: "",
    obs2: "",
    tipoMedida: "AM",
    medidas: Object.fromEntries(MEDIDAS.map((m) => [m.clave, 0])),
    otras: ["", "", ""],
    tela: {
      prenda: "falda",
      manga: "larga",
      ancho: CONFIG_DEFAULT.anchoTela,
      merma: CONFIG_DEFAULT.merma,
      tela: "Algodón",
      rollos: 3,
      metrosRollo: 25,
    },
    insumos: [
      { nombre: "Hilos (conos/bobinas)", cantidad: 3, unidad: "pza" },
      { nombre: "Aguja calibre #14", cantidad: 1, unidad: "pza" },
      { nombre: "Zíper", cantidad: 1, unidad: "pza" },
      { nombre: "Elástico", cantidad: 0, unidad: "m" },
      { nombre: "Botones", cantidad: 0, unidad: "pza" },
    ],
    telas: Object.fromEntries(TELAS.map((t) => [t, 0])),
    entretelas: [
      { nombre: "Toscana *", metros: 0 },
      { nombre: "Milibond", metros: 0 },
    ],
  };
}

/** Ficha con los datos de ejemplo del prototipo (para pruebas). */
export function fichaEjemplo(): Ficha {
  return {
    ...fichaNueva(),
    nombre: "María Fernanda López (ejemplo)",
    tel: "81 1234 5678",
    fecha: "2026-10-17",
    prueba: "2026-10-24",
    entrega: "2026-10-31",
    prendaTxt: "Falda recta con pretina",
    obs: "Clienta prefiere largo a la rodilla.",
    medidas: { ...MEDIDAS_EJEMPLO },
  };
}

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

/**
 * Completa una ficha que viene de la base o de un respaldo: lo que falte se toma de una ficha
 * en blanco. Así las fichas viejas siguen abriendo aunque se agreguen campos nuevos.
 * Regresa null si no parece una ficha.
 */
export function normalizarFicha(x: unknown): Ficha | null {
  if (!esObjeto(x) || typeof x.uid !== "string" || !x.uid) return null;
  const base = fichaNueva();
  const tela = esObjeto(x.tela) ? x.tela : {};
  const medidas = esObjeto(x.medidas) ? x.medidas : {};
  const telas = esObjeto(x.telas) ? x.telas : {};
  const otras = Array.isArray(x.otras) ? x.otras : [];
  return {
    ...base,
    ...(x as Partial<Ficha>),
    folio: typeof x.folio === "number" ? x.folio : 0,
    tela: { ...base.tela, ...(tela as Partial<Ficha["tela"]>) },
    medidas: { ...base.medidas, ...(medidas as Medidas) },
    telas: { ...base.telas, ...(telas as Record<string, number>) },
    otras: [0, 1, 2].map((i) => String(otras[i] ?? "")) as Ficha["otras"],
    insumos: Array.isArray(x.insumos) ? (x.insumos as Insumo[]) : base.insumos,
    entretelas: Array.isArray(x.entretelas) ? (x.entretelas as Entretela[]) : base.entretelas,
  };
}

/** AAAA-MM-DD → DD/MM/AAAA */
export function fechaCorta(iso: string): string {
  const p = iso.split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
}

/** DD/MM/AAAA → AAAA-MM-DD, o null si no se entiende. */
export function fechaIso(txt: string): string | null {
  const m = txt.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

export const num = (v: string | number): number => {
  const x = parseFloat(String(v).replace(",", "."));
  return isNaN(x) ? 0 : x;
};
