import type { FirebaseOptions } from "firebase/app";

/**
 * Datos del proyecto de Firebase (Configuración del proyecto → Tus apps → app web → firebaseConfig).
 * No son contraseñas: identifican el proyecto. Quién puede leer y escribir lo deciden
 * las reglas de firestore.rules y las cuentas creadas en Authentication.
 * Mientras sea null, la app funciona solo en este dispositivo.
 */
export const FIREBASE_CONFIG: FirebaseOptions | null = null;
