# Creaciones Kathy · App de reportes de taller

Ver `CLAUDE.md` (qué hace la app y cómo se construye) y `RETROALIMENTACION.md` (pedidos de Kathy).

## Cómo correrla

Necesitas Node.js 18 o más nuevo.

```
npm install      # solo la primera vez
npm run dev      # abre http://localhost:5173
npm test         # pruebas de las fórmulas de tela (Vitest)
npm run build    # versión final en dist/
```

Para imprimir: botón **Imprimir** arriba de la vista previa. En el diálogo del navegador elige papel **Carta**, márgenes **Ninguno** (o "Predeterminado") y escala **100 %**; sale una sola hoja por el frente.

## Estructura

- `src/calculo/` fórmulas de tela (piezas, acomodo, consumo, lote) y sus pruebas.
- `src/datos/` lista de medidas, tallas industriales (provisionales), la ficha y la base de datos (`db.ts`: guardar, buscar, duplicar, borrar, respaldo).
- `src/componentes/` pestañas del formulario y la hoja carta editable.

## Fases

1. ✅ Captura, medidas con tallas, tela, insumos, hoja editable e impresión.
2. ✅ Guardado de fichas (IndexedDB/Dexie), Reportes, respaldo JSON.
3. ✅ Configuración (tallas, medidas, holgura, costura, dobladillo, merma, ancho).
4. PWA sin internet con fuentes locales.
