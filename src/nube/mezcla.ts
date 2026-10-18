// Cómo se juntan los cambios de dos dispositivos: gana el que se guardó al último.

export interface Version {
  actualizada: string;
  /** La ficha se borró en algún dispositivo. */
  borrada?: boolean;
}

export type Decision = "bajar" | "borrar" | "subir" | "nada";

/** Qué hacer con una ficha comparando la versión de la nube con la de este dispositivo. */
export function decidir(nube: Version | undefined, local: Version | undefined): Decision {
  if (!nube) return local ? "subir" : "nada";
  if (nube.borrada) {
    if (!local) return "nada";
    return local.actualizada > nube.actualizada ? "subir" : "borrar";
  }
  if (!local) return "bajar";
  if (nube.actualizada > local.actualizada) return "bajar";
  if (local.actualizada > nube.actualizada) return "subir";
  return "nada";
}
