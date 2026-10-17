import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  borrarFicha,
  crearRespaldo,
  duplicarFicha,
  filtrarFichas,
  guardarFicha,
  importarRespaldo,
  listarFichas,
  usarBase,
} from "./db";
import { fichaEjemplo, fichaNueva, normalizarFicha } from "./ficha";

let n = 0;
beforeEach(() => {
  usarBase(`prueba-${++n}`);
});

const conNombre = (nombre: string) => ({ ...fichaNueva(), nombre });

describe("guardar fichas", () => {
  it("asigna folios consecutivos y conserva el folio al volver a guardar", async () => {
    const a = await guardarFicha(conNombre("Ana"));
    const b = await guardarFicha(conNombre("Bety"));
    expect([a.folio, b.folio]).toEqual([1, 2]);
    const a2 = await guardarFicha({ ...a, tel: "81 0000 0000" });
    expect(a2.folio).toBe(1);
    expect(a2.creada).toBe(a.creada);
    expect(await listarFichas()).toHaveLength(2);
  });

  it("lista de la más reciente a la más vieja", async () => {
    const a = await guardarFicha(conNombre("Ana"));
    await new Promise((r) => setTimeout(r, 5));
    await guardarFicha(conNombre("Bety"));
    await new Promise((r) => setTimeout(r, 5));
    await guardarFicha({ ...a, obs: "cambio" });
    expect((await listarFichas()).map((f) => f.nombre)).toEqual(["Ana", "Bety"]);
  });

  it("duplicar crea otra ficha con folio nuevo y sin fechas de prueba ni entrega", async () => {
    const a = await guardarFicha(fichaEjemplo());
    const c = await duplicarFicha(a);
    expect(c.uid).not.toBe(a.uid);
    expect(c.folio).toBe(2);
    expect(c.medidas).toEqual(a.medidas);
    expect([c.prueba, c.entrega]).toEqual(["", ""]);
    expect(await listarFichas()).toHaveLength(2);
  });

  it("borrar quita solo esa ficha", async () => {
    const a = await guardarFicha(conNombre("Ana"));
    await guardarFicha(conNombre("Bety"));
    await borrarFicha(a.uid);
    expect((await listarFichas()).map((f) => f.nombre)).toEqual(["Bety"]);
  });
});

describe("buscador", () => {
  const fichas = [
    { ...conNombre("María José Peña"), folio: 1 },
    { ...conNombre("Lucía Gómez"), folio: 12, tel: "81 5555 1234" },
  ];
  it("busca sin importar acentos ni mayúsculas", () => {
    expect(filtrarFichas(fichas, "maria").map((f) => f.folio)).toEqual([1]);
    expect(filtrarFichas(fichas, "PEÑA").map((f) => f.folio)).toEqual([1]);
    expect(filtrarFichas(fichas, "lucia").map((f) => f.folio)).toEqual([12]);
  });
  it("busca por teléfono o folio, y vacío regresa todas", () => {
    expect(filtrarFichas(fichas, "5555").map((f) => f.folio)).toEqual([12]);
    expect(filtrarFichas(fichas, "0012").map((f) => f.folio)).toEqual([12]);
    expect(filtrarFichas(fichas, "  ")).toHaveLength(2);
  });
});

describe("respaldo", () => {
  it("exporta e importa en otra base sin perder datos", async () => {
    const a = await guardarFicha(fichaEjemplo());
    const texto = JSON.stringify(await crearRespaldo());
    usarBase(`prueba-${++n}`);
    expect(await importarRespaldo(texto)).toEqual({ nuevas: 1, actualizadas: 0, sinCambio: 0, invalidas: 0 });
    expect(await listarFichas()).toEqual([a]);
  });

  it("importar dos veces no duplica, y solo reemplaza con la versión más reciente", async () => {
    const a = await guardarFicha(conNombre("Ana"));
    const viejo = JSON.stringify(await crearRespaldo());
    expect((await importarRespaldo(viejo)).sinCambio).toBe(1);
    await new Promise((r) => setTimeout(r, 5));
    await guardarFicha({ ...a, tel: "nuevo" });
    expect((await importarRespaldo(viejo)).sinCambio).toBe(1);
    expect((await listarFichas())[0].tel).toBe("nuevo");

    const nuevo = JSON.stringify({ fichas: [{ ...a, tel: "del respaldo", actualizada: "2999-01-01T00:00:00.000Z" }] });
    expect((await importarRespaldo(nuevo)).actualizadas).toBe(1);
    expect((await listarFichas())[0].tel).toBe("del respaldo");
  });

  it("rechaza archivos que no son respaldo y salta fichas inválidas", async () => {
    await expect(importarRespaldo("hola")).rejects.toThrow();
    await expect(importarRespaldo('{"otra":"cosa"}')).rejects.toThrow();
    const r = await importarRespaldo(JSON.stringify({ fichas: [{ nombre: "sin uid" }, { ...fichaNueva(), nombre: "Ok" }] }));
    expect(r).toMatchObject({ nuevas: 1, invalidas: 1 });
  });
});

describe("normalizar", () => {
  it("completa campos que falten en fichas viejas", () => {
    const f = normalizarFicha({ uid: "x", nombre: "Vieja", medidas: { CC: 70 } })!;
    expect(f.nombre).toBe("Vieja");
    expect(f.medidas.CC).toBe(70);
    expect(f.medidas.CCad).toBe(0);
    expect(f.tela.ancho).toBe(150);
    expect(f.otras).toEqual(["", "", ""]);
  });
});
