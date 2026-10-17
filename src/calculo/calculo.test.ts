import { describe, expect, it } from "vitest";
import { MEDIDAS_EJEMPLO as M } from "../datos/medidas";
import { TALLAS, medidasEfectivas } from "../datos/tallas";
import { acomodar, anchoUtil, consumoDeTela, piezasDePrenda, prendasPorLote } from "./index";

// Ejemplos con las medidas de muestra del prototipo, tela de 150 cm y 10% de merma.
describe("consumo de tela (ejemplos del prototipo)", () => {
  it("ancho útil = ancho/2 − 1 cm de orillo", () => {
    expect(anchoUtil(150)).toBe(74);
    expect(anchoUtil(90)).toBe(44);
  });

  it("falda recta: delantero, trasero y pretina caben en un renglón", () => {
    const c = consumoDeTela("falda", "sin", M, 150, 10);
    expect(c.renglones).toHaveLength(1);
    expect(c.renglones[0].piezas).toEqual(["Delantero", "Trasero", "Pretina"]);
    expect(c.totalCm).toBeCloseTo(65.5);
    expect(c.metros.toFixed(2)).toBe("0.72");
    expect(c.noCabe).toBe(false);
  });

  it("falda recta en tela angosta (90 cm) usa dos renglones", () => {
    const c = consumoDeTela("falda", "sin", M, 90, 10);
    expect(c.renglones.map((r) => r.piezas)).toEqual([["Delantero", "Pretina"], ["Trasero"]]);
    expect(c.totalCm).toBeCloseTo(131);
  });

  it("blusa manga larga: la manga va en su propio renglón y el cuello junto al cuerpo", () => {
    const c = consumoDeTela("blusa", "larga", M, 150, 10);
    expect(c.renglones.map((r) => r.piezas)).toEqual([["Delantero", "Trasero", "Cuello/vistas"], ["Manga"]]);
    expect(c.totalCm).toBeCloseTo(133);
    expect(c.metros.toFixed(2)).toBe("1.46");
  });

  it("blusa manga corta usa LMC", () => {
    const manga = piezasDePrenda("blusa", "corta", M).find((p) => p.nombre === "Manga")!;
    expect(manga.largo).toBe(M.LMC + 5);
    expect(manga.ancho).toBeCloseTo(19.5);
  });

  it("blusa sin manga no lleva manga", () => {
    expect(piezasDePrenda("blusa", "sin", M).some((p) => p.nombre === "Manga")).toBe(false);
  });

  it("pantalón: delantero y trasero juntos, pretina aparte", () => {
    const c = consumoDeTela("pantalon", "sin", M, 150, 10);
    expect(c.renglones.map((r) => r.piezas)).toEqual([["Delantero", "Trasero"], ["Pretina"]]);
    expect(c.totalCm).toBeCloseTo(148);
    expect(c.metros.toFixed(2)).toBe("1.63");
  });

  it("vestido manga larga: largo = TD + LF − ACad + 8", () => {
    const p = piezasDePrenda("vestido", "larga", M);
    expect(p[0].largo).toBe(90);
    const c = consumoDeTela("vestido", "larga", M, 150, 10);
    expect(c.totalCm).toBeCloseTo(155);
    expect(c.metros).toBeCloseTo(1.705, 5);
  });

  it("merma 0 deja los metros igual a la suma de largos", () => {
    expect(consumoDeTela("falda", "sin", M, 150, 0).metros).toBeCloseTo(0.655);
  });
});

describe("acomodo", () => {
  it("gira una pieza que no cabe a lo ancho pero sí a lo largo", () => {
    const a = acomodar([{ nombre: "X", ancho: 80, largo: 30 }], 150);
    expect(a.noCabe).toBe(false);
    expect(a.totalCm).toBe(80);
  });

  it("avisa si una pieza no cabe ni girada", () => {
    const a = acomodar([{ nombre: "X", ancho: 80, largo: 90 }], 150);
    expect(a.noCabe).toBe(true);
  });
});

describe("prendas por lote", () => {
  it("3 rollos de 25 m con falda de 0.7205 m", () => {
    const l = prendasPorLote(3, 25, 0.7205);
    expect(l.totalMetros).toBe(75);
    expect(l.prendas).toBe(104);
    expect(l.sobranteMetros.toFixed(2)).toBe("0.07");
  });

  it("sin consumo no salen prendas", () => {
    expect(prendasPorLote(3, 25, 0).prendas).toBe(0);
  });
});

describe("tallas industriales (provisionales)", () => {
  it("T-M es la base y T-G suma un paso", () => {
    expect(TALLAS.M.CCad).toBe(100);
    expect(TALLAS.G.CCad).toBe(104);
    expect(TALLAS.CH.CCad).toBe(96);
    expect(TALLAS.XXL.CC).toBe(86);
  });

  it("con talla el cálculo usa los valores de la talla, y A medida usa los capturados", () => {
    const capturadas = { ...M, CCad: 120 };
    expect(medidasEfectivas("AM", capturadas).CCad).toBe(120);
    expect(medidasEfectivas("G", capturadas).CCad).toBe(104);
    const conTalla = consumoDeTela("falda", "sin", medidasEfectivas("G", capturadas), 150, 10);
    expect(conTalla.totalCm).toBeCloseTo(66); // LF 60.5 + 5.5
  });
});
