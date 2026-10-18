# Publicar la app y sincronizar entre dispositivos

La app se publica en **GitHub Pages** (se abre e instala desde cualquier computadora, tablet o celular) y guarda las fichas en **Firebase** (para que aparezcan en todos los dispositivos). Sin internet sigue funcionando: los cambios se suben solos al volver la conexión.

## 1. Firebase (datos)

1. Entra a <https://console.firebase.google.com> con una cuenta de Google → **Agregar proyecto** → nombre `creaciones-kathy` (Google Analytics no hace falta).
2. **Compilación → Firestore Database → Crear base de datos**. Ubicación: la más cercana (por ejemplo `nam5` o `us-central`). Modo: **producción**.
3. En Firestore → **Reglas**, pega el contenido de [`firestore.rules`](../firestore.rules), cambia los dos correos por el de Kathy y el tuyo, y **Publicar**.
4. **Compilación → Authentication → Comenzar → Correo electrónico/contraseña → Habilitar**.
5. En Authentication → **Usuarios → Agregar usuario**: crea la cuenta de Kathy (y la tuya). Usen los mismos correos que pusiste en las reglas.
6. **⚙ Configuración del proyecto → Tus apps → Web (`</>`)** → registra la app con el nombre `creaciones-kathy` (sin Hosting). Copia el bloque `firebaseConfig`.
7. Pega esos datos en [`src/nube/config.ts`](../src/nube/config.ts) en lugar de `null` (o pásaselos a Claude).

Los datos de `firebaseConfig` no son contraseñas: solo identifican el proyecto. Quién puede ver las fichas lo deciden las reglas del paso 3.

## 2. GitHub Pages (la app)

1. Crea una cuenta en <https://github.com> y un repositorio **vacío** (público) llamado `creaciones-kathy`.
2. En el repositorio → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Sube el código (desde esta carpeta):
   ```
   git remote add origin https://github.com/TU_USUARIO/creaciones-kathy.git
   git push -u origin main
   ```
   La primera vez Git abre una ventana para iniciar sesión en GitHub.
4. En la pestaña **Actions** se ve el despliegue. Al terminar, la app queda en `https://TU_USUARIO.github.io/creaciones-kathy/`.
5. En Firebase → Authentication → **Configuración → Dominios autorizados**, agrega `TU_USUARIO.github.io`.

Cada vez que se sube un cambio a `main`, la app se vuelve a publicar sola y las apps instaladas se actualizan al abrirlas.

## 3. En cada dispositivo

1. Abre `https://TU_USUARIO.github.io/creaciones-kathy/`.
2. Instálala: en Chrome/Edge (computadora o Android), botón **Instalar** en la barra de direcciones o menú ⋮ → *Instalar app*; en iPhone/iPad, Safari → Compartir → *Agregar a inicio*.
3. Toca **Iniciar sesión** (arriba) con la cuenta del taller. El botón cambia a **Sincronizado**.

Las fichas que ya había en un dispositivo se suben solas la primera vez que se inicia sesión ahí.
