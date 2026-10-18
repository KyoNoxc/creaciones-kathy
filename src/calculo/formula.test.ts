import { describe, expect, it } from "vitest";
import { MEDIDAS_EJEMPLO as M } from "../datos/medidas";
import { configInicial, idsUsados, medidasParaFormulas, validarConfig } from "../datos/configuracion";
import { CONFIG_DEFAULT, consumoDeTela } from "./index";
import { calcularFormula, revisarFormula, variablesDeFormula } from "./formula";

const v = { CC: 74, CCad: 100, CB: 92, holgura: 2, costura: 1.5 };

describe("lector de fórmulas", () => {
  it("suma, resta, multiplica y divide respetando el orden", () => {
    expect(calcularFormula("CCad/4 + holgura + costura", v)).toBe(28.5);
    expect(calcularFormula("2 + 3 * 4", v)).toBe(14);
    expect(calcularFormula("(2 + 3) × 4", v)).toBe(20);
    expect(calcularFormula("CC ÷ 2 − 5", v)).toBe(32);
    expect(calcularFormula("-CC + 100", v)).toBe(26);
  });

  it("entiende la mitad como ½, 1/2 o /2, y decimales con coma", () => {
    expect(calcularFormula("½CC", v)).toBe(37);
    expect(calcularFormula("½ CC + 1", v)).toBe(38);
    expect(calcularFormula("1/2 CC", v)).toBe(37);
    expect(calcularFormula("CC/2", v)).toBe(37);
    expect(calcularFormula("CC * 0,5", v)).toBe(37);
    expect(calcularFormula("2(CC + 1)", v)).toBe(150);
  });

  it("mayor y menor", () => {
    expect(calcularFormula("mayor(CB, CCad)", v)).toBe(100);
    expect(calcularFormula("Menor(CB; CCad) / 4", v)).toBe(23);
  });

  it("explica los errores en español", () => {
    const validos = new Set(Object.keys(v));
    expect(revisarFormula("CCad/4 +", validos)).toMatch(/incompleta/);
    expect(revisarFormula("(CCad/4", validos)).toMatch(/paréntesis/);
    expect(revisarFormula("CCad # 2", validos)).toMatch(/signo/);
    expect(revisarFormula("XYZ + 1", validos)).toBe("No existe: XYZ.");
    expect(revisarFormula("", validos)).toMatch(/vacía/);
    expect(revisarFormula("mayor(CB, CCad) + 2", validos)).toBe("");
    expect(() => calcularFormula("XYZ", v)).toThrow(/No existe/);
  });

  it("lista las medidas que usa", () => {
    expect(variablesDeFormula("mayor(CB, CCad)/4 + holgura").sort()).toEqual(["CB", "CCad", "holgura"]);
  });
});

describe("fórmulas de las prendas", () => {
  it("las fórmulas iniciales son válidas", () => {
    expect(validarConfig(configInicial())).toEqual([]);
  });

  it("cambiar una fórmula cambia el consumo", () => {
    const cfg = structuredClone(CONFIG_DEFAULT);
    cfg.formulas.falda[0].largo = "LF + 10"; // delantero 70 cm
    const c = consumoDeTela("falda", "sin", M, 150, 0, cfg);
    expect(c.totalCm).toBe(70);
  });

  it("una fórmula con error se avisa y esa pieza no se cuenta", () => {
    const cfg = structuredClone(CONFIG_DEFAULT);
    cfg.formulas.falda[2].largo = "NOEXISTE + 1";
    const c = consumoDeTela("falda", "sin", M, 150, 0, cfg);
    expect(c.errores).toEqual(['Pretina: No existe la medida o el valor "NOEXISTE".']);
    expect(c.totalCm).toBe(65.5);
  });

  it("se pueden agregar piezas nuevas", () => {
    const cfg = structuredClone(CONFIG_DEFAULT);
    cfg.formulas.falda.push({ nombre: "Bolsa", ancho: "20", largo: "90" });
    // Bolsa (90) + delantero + pretina en un renglón; el trasero ya no cabe: 90 + 65.5
    expect(consumoDeTela("falda", "sin", M, 150, 0, cfg).totalCm).toBe(155.5);
  });

  it("las fórmulas usan la clave visible aunque se renombre la medida", () => {
    const c = configInicial();
    c.medidas.find((m) => m.id === "CCad")!.clave = "Cad";
    c.calculo.formulas.falda[0].ancho = "Cad/4 + holgura + costura";
    expect(validarConfig(c)).toEqual([]);
    const M2 = medidasParaFormulas(M, c.medidas);
    expect(consumoDeTela("falda", "sin", M2, 150, 0, c.calculo).totalCm).toBeCloseTo(65.5);
    expect(idsUsados(c.calculo.formulas, c.medidas).has("CCad")).toBe(true);
  });

  it("la validación avisa de fórmulas mal escritas", () => {
    const c = configInicial();
    c.calculo.formulas.blusa[0].ancho = "CB/4 +";
    expect(validarConfig(c)[0]).toMatch(/^blusa · Delantero · ancho/);
  });
});
