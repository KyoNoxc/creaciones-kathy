import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { consumoDeTela } from "../calculo";
import { configInicial, normalizarConfig, validarConfig } from "./configuracion";
import { crearRespaldo, guardarConfig, importarRespaldo, leerConfig, usarBase } from "./db";
import { MEDIDAS_EJEMPLO as M } from "./medidas";
import { medidasEfectivas } from "./tallas";

let n = 0;
beforeEach(() => {
  usarBase(`config-${++n}`);
});

describe("configuración", () => {
  it("la inicial da los mismos resultados que el prototipo", () => {
    const c = configInicial();
    expect(consumoDeTela("falda", "sin", M, 150, 10, c.calculo).metros.toFixed(2)).toBe("0.72");
    expect(c.medidas).toHaveLength(30);
    expect(c.tallas.G.CCad).toBe(104);
    expect(c.tallasProvisionales).toBe(true);
  });

  it("holgura y dobladillo cambian el consumo", () => {
    const c = configInicial();
    c.calculo.dobladillo.falda = 8; // 60 + 8 = 68
    expect(consumoDeTela("falda", "sin", M, 150, 0, c.calculo).totalCm).toBe(68);
    c.calculo.holgura = 4; // media pieza 25 + 4 + 1.5 = 30.5; 30.5×2 + 8 = 69 cabe
    expect(consumoDeTela("falda", "sin", M, 150, 0, c.calculo).renglones).toHaveLength(1);
  });

  it("las tallas editadas se usan al elegir la talla", () => {
    const c = configInicial();
    c.tallas.G = { ...c.tallas.G, CCad: 110 };
    expect(medidasEfectivas("G", M, c.tallas).CCad).toBe(110);
  });

  it("se guarda y se lee de la base; sin guardar regresa la inicial", async () => {
    expect(await leerConfig()).toEqual(configInicial());
    const c = configInicial();
    c.calculo.holgura = 3;
    c.medidas[0].nombre = "Cuello";
    c.tallasProvisionales = false;
    await guardarConfig(c);
    expect(await leerConfig()).toEqual(c);
  });

  it("normalizar completa lo que falte y no deja quitar medidas del cálculo", () => {
    const c = normalizarConfig({ calculo: { holgura: 3 }, medidas: [{ id: "XX", clave: "XX", nombre: "Extra" }] });
    expect(c.calculo.holgura).toBe(3);
    expect(c.calculo.costura).toBe(1.5);
    expect(c.calculo.dobladillo.vestido).toBe(8);
    expect(c.medidas[0].id).toBe("XX");
    expect(c.medidas.some((m) => m.id === "CCad")).toBe(true);
    expect(c.tallas.M.XX).toBe(0);
    expect(normalizarConfig("basura")).toEqual(configInicial());
  });

  it("valida claves vacías o repetidas y nombres vacíos", () => {
    const c = configInicial();
    expect(validarConfig(c)).toEqual([]);
    c.medidas[1].clave = c.medidas[0].clave;
    c.medidas[2].clave = " ";
    c.medidas[3].nombre = "";
    expect(validarConfig(c)).toHaveLength(3);
  });

  it("el respaldo lleva la configuración y solo se importa si se pide", async () => {
    const c = configInicial();
    c.calculo.merma = 15;
    await guardarConfig(c);
    const texto = JSON.stringify(await crearRespaldo());
    usarBase(`config-${++n}`);
    expect((await importarRespaldo(texto)).config).toBe(false);
    expect((await leerConfig()).calculo.merma).toBe(10);
    expect((await importarRespaldo(texto, true)).config).toBe(true);
    expect((await leerConfig()).calculo.merma).toBe(15);
  });
});
