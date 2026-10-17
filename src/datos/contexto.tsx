import { createContext, useContext } from "react";
import type { Configuracion } from "./configuracion";

/** Configuración vigente; la carga App al arrancar. */
export const ContextoConfig = createContext<Configuracion | null>(null);

export function useConfig(): Configuracion {
  const c = useContext(ContextoConfig);
  if (!c) throw new Error("useConfig fuera de ContextoConfig");
  return c;
}
