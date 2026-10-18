import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { alCambiarLocal, borrarFicha, guardarConfig, guardarFicha, importarRespaldo, usarBase, type CambioLocal } from "../datos/db";
import { configInicial } from "../datos/configuracion";
import { fichaNueva } from "../datos/ficha";
import { decidir } from "./mezcla";

describe("juntar cambios de dos dispositivos", () => {
  const v = (actualizada: string, borrada?: boolean) => ({ actualizada, borrada });

  it("gana la versión guardada al último", () => {
    expect(decidir(v("2026-10-18T10:00"), v("2026-10-18T09:00"))).toBe("bajar");
    expect(decidir(v("2026-10-18T09:00"), v("2026-10-18T10:00"))).toBe("subir");
    expect(decidir(v("2026-10-18T10:00"), v("2026-10-18T10:00"))).toBe("nada");
  });

  it("fichas que solo existen de un lado", () => {
    expect(decidir(undefined, v("2026-10-18T10:00"))).toBe("subir");
    expect(decidir(v("2026-10-18T10:00"), undefined)).toBe("bajar");
    expect(decidir(undefined, undefined)).toBe("nada");
  });

  it("borrados: se borran aquí, salvo que aquí se haya editado después", () => {
    expect(decidir(v("2026-10-18T10:00", true), v("2026-10-18T09:00"))).toBe("borrar");
    expect(decidir(v("2026-10-18T10:00", true), v("2026-10-18T11:00"))).toBe("subir");
    expect(decidir(v("2026-10-18T10:00", true), undefined)).toBe("nada");
  });
});

describe("avisos de cambios locales (lo que se sube a la nube)", () => {
  let n = 0;
  let cambios: CambioLocal[] = [];
  beforeEach(() => {
    usarBase(`avisos-${++n}`);
    cambios = [];
  });

  it("guardar, borrar, importar y configurar avisan", async () => {
    const quitar = alCambiarLocal((c) => cambios.push(c));
    const f = await guardarFicha({ ...fichaNueva(), nombre: "Ana" });
    await borrarFicha(f.uid);
    await importarRespaldo(JSON.stringify({ fichas: [{ ...fichaNueva(), nombre: "Bety" }] }));
    await guardarConfig(configInicial());
    quitar();
    expect(cambios.map((c) => c.tipo)).toEqual(["ficha", "borrada", "ficha", "config"]);
    await guardarFicha({ ...fichaNueva(), nombre: "Sin oyente" });
    expect(cambios).toHaveLength(4);
  });
});
