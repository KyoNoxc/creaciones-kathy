// Sincronización con Firebase: sube cada cambio de este dispositivo y baja los de los demás.
// La base local (Dexie) sigue siendo la que usa la app; Firestore guarda su propia copia sin internet
// y manda los cambios pendientes en cuanto vuelve la conexión.
import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import {
  collection,
  doc,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  setDoc,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import type { Configuracion } from "../datos/configuracion";
import {
  alCambiarLocal,
  avisarRemoto,
  borrarFichaRemota,
  escribirConfigRemota,
  escribirFichaRemota,
  fechaConfig,
  leerConfig,
  obtenerFicha,
  todasLasFichas,
  type CambioLocal,
} from "../datos/db";
import { normalizarFicha, type Ficha } from "../datos/ficha";
import { decidir } from "./mezcla";

export type Estado = "sin-sesion" | "conectando" | "al-dia" | "pendiente" | "sin-conexion" | "error";

export interface EstadoNube {
  estado: Estado;
  /** Correo de la cuenta con sesión abierta. */
  correo: string | null;
  /** Ya se sabe si hay sesión (Firebase la recuerda, también sin internet). */
  listo: boolean;
  error?: string;
}

export interface Nube {
  actual(): EstadoNube;
  suscribir(f: (e: EstadoNube) => void): () => void;
  entrar(correo: string, contrasena: string): Promise<void>;
  salir(): Promise<void>;
}

const MENSAJES: Record<string, string> = {
  "auth/invalid-credential": "El correo o la contraseña no son correctos.",
  "auth/invalid-email": "El correo no está bien escrito.",
  "auth/user-disabled": "Esta cuenta está desactivada.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos y vuelve a intentar.",
  "auth/network-request-failed": "No hay internet. Para iniciar sesión la primera vez hace falta conexión.",
  "permission-denied": "Esta cuenta no tiene permiso para ver las fichas del taller.",
};
const mensaje = (e: unknown) => {
  const codigo = (e as { code?: string })?.code ?? "";
  return MENSAJES[codigo] ?? "No se pudo conectar con la nube.";
};

export function crearNube(opciones: FirebaseOptions): Nube {
  const app = initializeApp(opciones);
  const auth = getAuth(app);
  const fs = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    ignoreUndefinedProperties: true,
  });

  let estado: EstadoNube = { estado: "conectando", correo: null, listo: false };
  const oyentes = new Set<(e: EstadoNube) => void>();
  const poner = (e: Partial<EstadoNube>) => {
    estado = { ...estado, ...e };
    oyentes.forEach((f) => f(estado));
  };

  let detener: (() => void) | null = null;
  let ultimaFoto: { pendiente: boolean; cache: boolean } = { pendiente: false, cache: true };
  const calcularEstado = () => {
    if (!estado.correo) return poner({ estado: "sin-sesion" });
    if (!navigator.onLine) return poner({ estado: "sin-conexion" });
    poner({ estado: ultimaFoto.pendiente ? "pendiente" : ultimaFoto.cache ? "conectando" : "al-dia" });
  };
  addEventListener("online", calcularEstado);
  addEventListener("offline", calcularEstado);

  const fallo = (e: unknown) => poner({ estado: "error", error: mensaje(e) });

  // Escrituras a la nube: no se esperan (sin internet quedan en cola y se mandan después).
  const subirFicha = (f: Ficha) => setDoc(doc(fs, "fichas", f.uid), { ...f, borrada: false }).catch(fallo);
  const subirBorrado = (uid: string, actualizada: string) =>
    setDoc(doc(fs, "fichas", uid), { uid, borrada: true, actualizada }).catch(fallo);
  const subirConfig = (valor: Configuracion, actualizada: string) =>
    setDoc(doc(fs, "ajustes", "config"), { valor, actualizada }).catch(fallo);

  function subirCambio(c: CambioLocal) {
    if (c.tipo === "ficha") subirFicha(c.ficha);
    else if (c.tipo === "borrada") subirBorrado(c.uid, c.actualizada);
    else subirConfig(c.config, c.actualizada);
  }

  function arrancar() {
    let primera = true;
    // Los cambios se procesan uno tras otro para no pisarse.
    let cola = Promise.resolve();

    async function procesarFichas(foto: QuerySnapshot<DocumentData>) {
      const docs = primera ? foto.docs : foto.docChanges().filter((c) => c.type !== "removed").map((c) => c.doc);
      const bajadas: string[] = [];
      for (const d of docs) {
        const nube = d.data() as Partial<Ficha> & { borrada?: boolean; actualizada?: string };
        const local = await obtenerFicha(d.id);
        const decision = decidir({ actualizada: nube.actualizada ?? "", borrada: nube.borrada }, local);
        if (decision === "bajar") {
          const f = normalizarFicha(nube);
          if (f) {
            await escribirFichaRemota(f);
            bajadas.push(f.uid);
          }
        } else if (decision === "borrar") {
          await borrarFichaRemota(d.id);
          bajadas.push(d.id);
        } else if (decision === "subir" && local) {
          subirFicha(local);
        }
      }
      if (primera) {
        // Fichas de este dispositivo que la nube todavía no tiene (por ejemplo, las de antes de iniciar sesión).
        const enNube = new Set(foto.docs.map((d) => d.id));
        for (const f of await todasLasFichas()) if (!enNube.has(f.uid)) subirFicha(f);
        primera = false;
      }
      if (bajadas.length) avisarRemoto({ tipo: "fichas", uids: bajadas });
    }

    const quitarFichas = onSnapshot(
      collection(fs, "fichas"),
      { includeMetadataChanges: true },
      (foto) => {
        ultimaFoto = { pendiente: foto.metadata.hasPendingWrites, cache: foto.metadata.fromCache };
        if (!foto.metadata.fromCache) poner({ error: undefined });
        calcularEstado();
        cola = cola.then(() => procesarFichas(foto)).catch(fallo);
      },
      fallo,
    );

    const quitarConfig = onSnapshot(
      doc(fs, "ajustes", "config"),
      (foto) => {
        cola = cola
          .then(async () => {
            const nube = foto.data() as { valor?: unknown; actualizada?: string } | undefined;
            const fecha = await fechaConfig();
            const decision = decidir(nube && { actualizada: nube.actualizada ?? "" }, fecha ? { actualizada: fecha } : undefined);
            if (decision === "bajar" && nube) {
              await escribirConfigRemota(nube.valor, nube.actualizada ?? "");
              avisarRemoto({ tipo: "config" });
            } else if (decision === "subir") {
              subirConfig(await leerConfig(), fecha);
            }
          })
          .catch(fallo);
      },
      fallo,
    );

    const quitarLocal = alCambiarLocal(subirCambio);
    detener = () => {
      quitarFichas();
      quitarConfig();
      quitarLocal();
    };
  }

  onAuthStateChanged(auth, (usuario: User | null) => {
    detener?.();
    detener = null;
    poner({ correo: usuario?.email ?? null, estado: usuario ? "conectando" : "sin-sesion", error: undefined, listo: true });
    if (usuario) arrancar();
  });

  return {
    actual: () => estado,
    suscribir(f) {
      oyentes.add(f);
      f(estado);
      return () => oyentes.delete(f);
    },
    async entrar(correo, contrasena) {
      try {
        await signInWithEmailAndPassword(auth, correo.trim(), contrasena);
      } catch (e) {
        throw new Error(mensaje(e));
      }
    },
    async salir() {
      await signOut(auth);
    },
  };
}
