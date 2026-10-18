import { useEffect, useState } from "react";
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

/** Botón de la cuenta en la nube: muestra si las fichas están sincronizadas y permite iniciar sesión. */
export function Cuenta() {
  const [nube, setNube] = useState<Nube | null>(null);
  const [e, setE] = useState<EstadoNube | null>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    let quitar: (() => void) | undefined;
    let vivo = true;
    obtenerNube()
      ?.then((n) => {
        if (!vivo) return;
        setNube(n);
        quitar = n.suscribir(setE);
      })
      .catch(() => setE({ estado: "error", correo: null, error: "No se pudo cargar la sincronización." }));
    return () => {
      vivo = false;
      quitar?.();
    };
  }, []);

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
      {abierto && nube && e && <PanelCuenta nube={nube} e={e} onCerrar={() => setAbierto(false)} />}
    </div>
  );
}

function PanelCuenta({ nube, e, onCerrar }: { nube: Nube; e: EstadoNube; onCerrar: () => void }) {
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
      onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setEnviando(false);
    }
  }

  return (
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
              if (confirm("¿Cerrar sesión? Las fichas se quedan en este dispositivo, pero dejan de sincronizarse.")) {
                nube.salir();
                onCerrar();
              }
            }}
          >
            Cerrar sesión
          </button>
        </>
      ) : (
        <form onSubmit={entrar} className="sec" style={{ padding: 0 }}>
          <p className="formula">
            Inicia sesión con la cuenta del taller para que las fichas, reportes y la configuración se guarden en la nube y aparezcan
            en todos los dispositivos donde esté instalada la app.
          </p>
          <label className="f">
            Correo
            <input type="email" autoComplete="username" value={correo} onChange={(x) => setCorreo(x.target.value)} required />
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
          {(error || e.error) && <p className="error">{error || e.error}</p>}
          <button className="btn" disabled={enviando}>
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      )}
    </div>
  );
}
