import type { Medidas } from "../datos/medidas";
import { CONFIG_DEFAULT, type ConfigCalculo } from "./config";

export type Prenda = "falda" | "blusa" | "pantalon" | "vestido";
export type Manga = "larga" | "corta" | "sin";

export const PRENDAS: { valor: Prenda; etiqueta: string }[] = [
  { valor: "falda", etiqueta: "Falda recta" },
  { valor: "blusa", etiqueta: "Blusa / camisa" },
  { valor: "pantalon", etiqueta: "Pantalón" },
  { valor: "vestido", etiqueta: "Vestido" },
];

export const prendaLlevaManga = (p: Prenda) => p === "blusa" || p === "vestido";

export interface Pieza {
  nombre: string;
  /** Ancho de la pieza sobre la tela doblada, cm. */
  ancho: number;
  /** Largo de la pieza, cm. */
  largo: number;
}

/** Piezas que lleva una prenda. Cada pieza se corta al doblez. */
export function piezasDePrenda(
  prenda: Prenda,
  manga: Manga,
  M: Medidas,
  cfg: ConfigCalculo = CONFIG_DEFAULT,
): Pieza[] {
  const v = (k: string) => M[k] ?? 0;
  // Media pieza: ¼ del contorno + holgura + costura
  const media = (contorno: number) => contorno / 4 + cfg.holgura + cfg.costura;
  const P: Pieza[] = [];
  const mangas = () => {
    if (manga === "sin") return;
    const largo = manga === "larga" ? v("LML") : v("LMC");
    P.push({ nombre: "Manga", ancho: (v("CBr") + 6) / 2 + cfg.costura, largo: largo + 5 });
  };
  const pretina = () => P.push({ nombre: "Pretina", ancho: 8, largo: v("CC") / 2 + 5 });

  switch (prenda) {
    case "falda":
      P.push({ nombre: "Delantero", ancho: media(v("CCad")), largo: v("LF") + 5.5 });
      P.push({ nombre: "Trasero", ancho: media(v("CCad")), largo: v("LF") + 5.5 });
      pretina();
      break;
    case "blusa": {
      const c = Math.max(v("CB"), v("CCad"));
      P.push({ nombre: "Delantero", ancho: media(c), largo: v("LC") + 6 });
      P.push({ nombre: "Trasero", ancho: media(c), largo: v("LC") + 6 });
      mangas();
      P.push({ nombre: "Cuello/vistas", ancho: 12, largo: v("CCo") / 2 + 6 });
      break;
    }
    case "vestido": {
      const c = Math.max(v("CB"), v("CCad")) + 4;
      const largo = v("TD") + (v("LF") - v("ACad")) + 8;
      P.push({ nombre: "Delantero", ancho: media(c), largo });
      P.push({ nombre: "Trasero", ancho: media(c), largo });
      mangas();
      break;
    }
    case "pantalon": {
      // ¼ de cadera + 6 de tiro + costura
      const ancho = v("CCad") / 4 + 6 + cfg.costura;
      P.push({ nombre: "Delantero", ancho, largo: v("LP") + 6 });
      P.push({ nombre: "Trasero", ancho: ancho + 3, largo: v("LP") + 6 });
      pretina();
      break;
    }
  }
  return P;
}
