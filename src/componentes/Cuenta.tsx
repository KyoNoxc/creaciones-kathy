import { useEffect, useState } from "react";
import logo from "../assets/logo-hoja.jpg";
import { hayNube, obtenerNube } from "../nube";
import type { EstadoNube, Nube } from "../nube/sincronizar";

const ETIQUETAS: Record<EstadoNube["estado"], string> = {
  "sin-sesion": "Iniciar sesión",
  conectando: "Conectando…",
  "al-dia": "Sincronizado",
  pendiente: "Subiendo cambios…",
  "sin-conexion": "Sin internet",
  error: "Revisar sincronización",
};

/** Estado de la sesión en la nube; null mientras carga (o si la app no usa nube). */
export function useNube(): { nube: Nube | null; e: EstadoNube | null } {
  const [nube, setNube] = useState<Nube | null>(null);
  const [e, setE] = useState<EstadoNube | null>(null);
  useEffect(() => {
    let quitar: (() => void) | undefined;
    let vivo = true;
    obtenerNube()
      ?.then((n) => {
        if (!vivo) return;
        setNube(n);
        quitar = n.suscribir(setE);
      })
      .catch(() =>
        setE({ estado: "error", correo: null, listo: true, error: "No se pudo cargar el inicio de sesión. Revisa tu conexión." }),
      );
    return () => {
      vivo = false;
      quitar?.();
    };
  }, []);
  return { nube, e };
}

/** Pantalla de entrada: sin sesión no se ve nada de la app. */
export function PantallaEntrar({ nube, e }: { nube: Nube | null; e: EstadoNube | null }) {
  return (
    <main className="entrar">
      <div className="entrar-caja panel">
        <img className="entrar-logo" src={logo} alt="Logo Creaciones Kathy" />
        <h1>
          Creaciones Kathy <span>Diseños exclusivos</span>
        </h1>
        {nube && e ? (
          <FormEntrar nube={nube} errorNube={e.error} />
        ) : (
          <p className={e?.error ? "error" : "vacio"}>{e?.error ?? "Cargando…"}</p>
        )}
      </div>
    </main>
  );
}

function FormEntrar({ nube, errorNube, alEntrar }: { nube: Nube; errorNube?: string; alEntrar?: () => void }) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function entrar(ev: React.FormEvent) {
    ev.preventDefault();
    setEnviando(true);
    setError("");
    try {
      await nube.entrar(correo, contrasena);
      setContrasena("");
      alEntrar?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="form-entrar">
      <p className="formula">Inicia sesión con la cuenta del taller. Las fichas se guardan en la nube y aparecen en todos tus dispositivos.</p>
      <label className="f">
        Correo
        <input type="email" autoComplete="username" value={correo} onChange={(x) => setCorreo(x.target.value)} required autoFocus />
      </label>
      <label className="f">
        Contraseña
        <input
          type="password"
          autoComplete="current-password"
          value={contrasena}
          onChange={(x) => setContrasena(x.target.value)}
          required
        />
      </label>
      {(error || errorNube) && <p className="error">{error || errorNube}</p>}
      <button className="btn" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

/** Botón de la cuenta en la cabecera: muestra si las fichas están sincronizadas y permite cerrar sesión. */
export function Cuenta({ nube, e }: { nube: Nube | null; e: EstadoNube | null }) {
  const [abierto, setAbierto] = useState(false);
  if (!hayNube) return null;
  const estado = e?.estado ?? "conectando";
  const conProblema = !!e?.error;

  return (
    <div className="cuenta-nube">
      <button
        className={`chip-nube ${conProblema ? "mal" : estado}`}
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        title={e?.error}
      >
        <span className="punto-nube" aria-hidden />
        {conProblema ? ETIQUETAS.error : ETIQUETAS[estado]}
      </button>
      {abierto && nube && e && (
        <div className="panel-nube panel" role="dialog" aria-label="Cuenta y sincronización">
          {e.correo ? (
            <>
              <p>
                Sesión iniciada como <b>{e.correo}</b>.
              </p>
              <p className="formula">
                {e.estado === "al-dia" && "Todo está guardado en la nube. Las fichas nuevas aparecen solas en los demás dispositivos."}
                {e.estado === "pendiente" && "Hay cambios subiéndose a la nube."}
                {e.estado === "conectando" && "Conectando con la nube…"}
                {e.estado === "sin-conexion" &&
                  "No hay internet. Puedes seguir trabajando: los cambios se guardan aquí y se suben solos al volver la conexión."}
              </p>
              {e.error && <p className="error">{e.error}</p>}
              <button
                className="btn sec-btn"
                onClick={() => {
                  if (confirm("¿Cerrar sesión? Para volver a entrar a la app se pedirá el correo y la contraseña.")) {
                    nube.salir();
                    setAbierto(false);
                  }
                }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <FormEntrar nube={nube} errorNube={e.error} alEntrar={() => setAbierto(false)} />
          )}
        </div>
      )}
    </div>
  );
}
