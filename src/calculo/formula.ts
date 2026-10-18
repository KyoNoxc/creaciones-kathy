// Lector de fórmulas sencillas para que Kathy pueda cambiar el cálculo desde la app.
// Acepta números (con punto o coma decimal), claves de medidas y parámetros, + − × ÷ * /,
// paréntesis, ½ (o "1/2"), y las funciones mayor(a, b, …) y menor(a, b, …).
// Nunca usa eval: solo entiende estas piezas.

type Nodo =
  | { t: "num"; v: number }
  | { t: "var"; nombre: string }
  | { t: "neg"; a: Nodo }
  | { t: "op"; op: "+" | "-" | "*" | "/"; a: Nodo; b: Nodo }
  | { t: "fn"; nombre: "mayor" | "menor"; args: Nodo[] };

type Token = { t: "num"; v: number } | { t: "id"; v: string } | { t: "sim"; v: string };

export class ErrorFormula extends Error {}

const FUNCIONES = ["mayor", "menor"] as const;

function tokens(texto: string): Token[] {
  const r: Token[] = [];
  let i = 0;
  while (i < texto.length) {
    const c = texto[i];
    if (/\s/.test(c)) {
      i++;
    } else if (/[0-9]/.test(c) || ((c === "." || c === ",") && /[0-9]/.test(texto[i + 1] ?? ""))) {
      const m = texto.slice(i).match(/^[0-9]*[.,]?[0-9]+|^[0-9]+/)!;
      r.push({ t: "num", v: parseFloat(m[0].replace(",", ".")) });
      i += m[0].length;
    } else if (c === "½") {
      r.push({ t: "num", v: 0.5 });
      i++;
    } else if (/[A-Za-zÁÉÍÓÚáéíóúÑñ_]/.test(c)) {
      const m = texto.slice(i).match(/^[A-Za-zÁÉÍÓÚáéíóúÑñ_][A-Za-zÁÉÍÓÚáéíóúÑñ_0-9]*/)!;
      r.push({ t: "id", v: m[0] });
      i += m[0].length;
    } else if ("+-−*/×÷(),;".includes(c)) {
      const v = c === "−" ? "-" : c === "×" ? "*" : c === "÷" ? "/" : c === ";" ? "," : c;
      r.push({ t: "sim", v });
      i++;
    } else {
      throw new ErrorFormula(`No entiendo el signo "${c}".`);
    }
  }
  return r;
}

function analizar(texto: string): Nodo {
  const tk = tokens(texto);
  let p = 0;
  const ver = () => tk[p];
  const es = (v: string) => ver()?.t === "sim" && ver()!.v === v;

  // ½ o un número pegado a algo se multiplica: "½CC" = ½ × CC, "2(CC+1)" = 2 × (CC+1)
  const empiezaFactor = () => {
    const x = ver();
    return !!x && (x.t === "num" || x.t === "id" || (x.t === "sim" && x.v === "("));
  };

  function suma(): Nodo {
    let a = producto();
    while (es("+") || es("-")) {
      const op = tk[p++].v as "+" | "-";
      a = { t: "op", op, a, b: producto() };
    }
    return a;
  }
  function producto(): Nodo {
    let a = unario();
    for (;;) {
      if (es("*") || es("/")) {
        const op = tk[p++].v as "*" | "/";
        a = { t: "op", op, a, b: unario() };
      } else if (empiezaFactor()) {
        a = { t: "op", op: "*", a, b: unario() };
      } else return a;
    }
  }
  function unario(): Nodo {
    if (es("-")) {
      p++;
      return { t: "neg", a: unario() };
    }
    if (es("+")) {
      p++;
      return unario();
    }
    return primario();
  }
  function primario(): Nodo {
    const x = ver();
    if (!x) throw new ErrorFormula("La fórmula está incompleta.");
    if (x.t === "num") {
      p++;
      return { t: "num", v: x.v };
    }
    if (x.t === "id") {
      p++;
      const f = x.v.toLowerCase();
      if ((FUNCIONES as readonly string[]).includes(f)) {
        if (!es("(")) throw new ErrorFormula(`Después de ${x.v} van paréntesis, por ejemplo ${x.v}(CB, CCad).`);
        p++;
        const args = [suma()];
        while (es(",")) {
          p++;
          args.push(suma());
        }
        if (!es(")")) throw new ErrorFormula("Falta cerrar un paréntesis.");
        p++;
        return { t: "fn", nombre: f as "mayor" | "menor", args };
      }
      return { t: "var", nombre: x.v };
    }
    if (x.v === "(") {
      p++;
      const a = suma();
      if (!es(")")) throw new ErrorFormula("Falta cerrar un paréntesis.");
      p++;
      return a;
    }
    throw new ErrorFormula(`Sobra o falta algo antes de "${x.v}".`);
  }

  if (!texto.trim()) throw new ErrorFormula("La fórmula está vacía.");
  const n = suma();
  if (p < tk.length) {
    const x = tk[p];
    throw new ErrorFormula(`Sobra o falta algo antes de "${x.t === "num" ? x.v : x.v}".`);
  }
  return n;
}

function variables(n: Nodo, r = new Set<string>()): Set<string> {
  if (n.t === "var") r.add(n.nombre);
  else if (n.t === "neg") variables(n.a, r);
  else if (n.t === "op") (variables(n.a, r), variables(n.b, r));
  else if (n.t === "fn") n.args.forEach((a) => variables(a, r));
  return r;
}

function evaluar(n: Nodo, vars: Record<string, number>): number {
  switch (n.t) {
    case "num":
      return n.v;
    case "var": {
      const v = vars[n.nombre];
      if (v === undefined) throw new ErrorFormula(`No existe la medida o el valor "${n.nombre}".`);
      return v;
    }
    case "neg":
      return -evaluar(n.a, vars);
    case "op": {
      const a = evaluar(n.a, vars);
      const b = evaluar(n.b, vars);
      if (n.op === "+") return a + b;
      if (n.op === "-") return a - b;
      if (n.op === "*") return a * b;
      return b === 0 ? 0 : a / b;
    }
    case "fn": {
      const vs = n.args.map((a) => evaluar(a, vars));
      return n.nombre === "mayor" ? Math.max(...vs) : Math.min(...vs);
    }
  }
}

/** Calcula una fórmula. Lanza ErrorFormula con un mensaje en español si algo está mal. */
export function calcularFormula(texto: string, vars: Record<string, number>): number {
  return evaluar(analizar(texto), vars);
}

/** Revisa una fórmula sin calcularla. Regresa el mensaje de error, o "" si está bien. */
export function revisarFormula(texto: string, nombresValidos: Set<string>): string {
  try {
    const desconocidas = [...variables(analizar(texto))].filter((v) => !nombresValidos.has(v));
    return desconocidas.length ? `No existe: ${desconocidas.join(", ")}.` : "";
  } catch (e) {
    return e instanceof ErrorFormula ? e.message : "La fórmula no se entiende.";
  }
}

/** Nombres (medidas o parámetros) que usa una fórmula; vacío si no se entiende. */
export function variablesDeFormula(texto: string): string[] {
  try {
    return [...variables(analizar(texto))];
  } catch {
    return [];
  }
}
