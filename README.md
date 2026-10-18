# Creaciones Kathy · App de reportes de taller

**App publicada:** https://kyonoxc.github.io/creaciones-kathy/ (se instala desde ahí en computadora, tablet o celular).

Ver `CLAUDE.md` (qué hace la app y cómo se construye) y `RETROALIMENTACION.md` (pedidos de Kathy).

## Usar la app (versión instalable)

Necesitas Node.js 18 o más nuevo.

```
npm install      # solo la primera vez
npm run app      # arma la app y la abre en http://localhost:4173
```

Para instalarla: en Chrome o Edge, con la app abierta, usa el botón **Instalar** que aparece a la derecha de la barra de direcciones (o menú ⋮ → "Instalar Creaciones Kathy"). Queda con su ícono en el escritorio y el menú Inicio, y abre en su propia ventana.

Ya instalada **funciona sin internet y sin la terminal**: la primera vez guarda todos sus archivos (incluidas las fuentes y el logo). Solo hace falta volver a correr `npm run app` cuando haya una versión nueva; la app instalada se actualiza sola al abrirla.

Importante: las fichas se guardan por dirección. Las de `localhost:4173` (la app) y las de `localhost:5173` (`npm run dev`) son bases distintas. Para pasar fichas de una a otra usa **Descargar respaldo** e **Importar respaldo** en Reportes.

## Publicar y sincronizar entre dispositivos

Ver [docs/CONFIGURAR_NUBE.md](docs/CONFIGURAR_NUBE.md): GitHub Pages para publicar la app y Firebase para que las fichas, reportes y configuración aparezcan en todos los dispositivos. Mientras `src/nube/config.ts` tenga `null`, la app funciona solo en el dispositivo.

## Desarrollo

```
npm run dev      # http://localhost:5173, se recarga al cambiar el código (sin modo sin internet)
npm test         # pruebas (fórmulas de tela, base de datos, configuración)
npm run build    # versión final en dist/
```

Para imprimir: botón **Imprimir** arriba de la vista previa. En el diálogo del navegador elige papel **Carta**, márgenes **Ninguno** (o "Predeterminado") y escala **100 %**; sale una sola hoja por el frente.

## Estructura

- `src/calculo/` fórmulas de tela (piezas, acomodo, consumo, lote) y sus pruebas.
- `src/datos/` lista de medidas, tallas industriales, configuración, la ficha y la base de datos (`db.ts`: guardar, buscar, duplicar, borrar, respaldo).
- `src/componentes/` pestañas del formulario, la hoja carta editable, Reportes y Configuración.
- `src/nube/` sincronización con Firebase (sesión, subir y bajar cambios; gana el último guardado).
- `public/` íconos de la app (hechos a partir de `assets/logo.png`).
- Las fuentes (Barlow Condensed, Nunito Sans, Great Vibes) vienen de los paquetes `@fontsource/*` y se empacan dentro de la app.

## Fases

1. ✅ Captura, medidas con tallas, tela, insumos, hoja editable e impresión.
2. ✅ Guardado de fichas (IndexedDB/Dexie), Reportes, respaldo JSON.
3. ✅ Configuración (tallas, medidas, holgura, costura, dobladillo, merma, ancho).
4. ✅ PWA instalable que funciona sin internet, con fuentes locales.
