import { FIREBASE_CONFIG } from "./config";
import type { Nube } from "./sincronizar";

export const hayNube = FIREBASE_CONFIG !== null;

let nube: Promise<Nube> | null = null;

/** Arranca la sincronización (una sola vez). Firebase se carga aparte para no hacer pesada la app. */
export function obtenerNube(): Promise<Nube> | null {
  if (!FIREBASE_CONFIG) return null;
  const opciones = FIREBASE_CONFIG;
  nube ??= import("./sincronizar").then((m) => m.crearNube(opciones));
  return nube;
}
