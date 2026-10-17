import { CONFIG_DEFAULT, type Manga, type Prenda } from "../calculo";
import { MEDIDAS_EJEMPLO, type Medidas } from "./medidas";
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
  folio: number;
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

/** Ficha de ejemplo del prototipo. En la fase 2 se reemplaza por fichas guardadas. */
export function fichaEjemplo(): Ficha {
  return {
    folio: 1,
    nombre: "María Fernanda López (ejemplo)",
    tel: "81 1234 5678",
    tipo: "DAMA",
    fecha: "2026-10-17",
    prueba: "2026-10-24",
    entrega: "2026-10-31",
    prendaTxt: "Falda recta con pretina",
    obs: "Clienta prefiere largo a la rodilla.",
    obs2: "",
    tipoMedida: "AM",
    medidas: { ...MEDIDAS_EJEMPLO },
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
      { nombre: "Milibond", metros: 0.3 },
    ],
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
