import type { FirebaseOptions } from "firebase/app";

/**
 * Datos del proyecto de Firebase (Configuración del proyecto → Tus apps → app web → firebaseConfig).
 * No son contraseñas: identifican el proyecto. Quién puede leer y escribir lo deciden
 * las reglas de firestore.rules y las cuentas creadas en Authentication.
 * Mientras sea null, la app funciona solo en este dispositivo.
 */
export const FIREBASE_CONFIG: FirebaseOptions | null = {
  apiKey: "AIzaSyBsyJbHoblAy_LDtpDeZu5X7pMq06pn4sc",
  authDomain: "creaciones-kathy-fef6a.firebaseapp.com",
  projectId: "creaciones-kathy-fef6a",
  storageBucket: "creaciones-kathy-fef6a.firebasestorage.app",
  messagingSenderId: "251327300168",
  appId: "1:251327300168:web:636107f9616bf38e294e7d",
};
