# Creaciones Kathy · App de reportes de taller

Contexto para Claude Code. Léelo antes de cambiar cualquier cosa y revisa también `RETROALIMENTACION.md`, que es donde quedan los pedidos de la clienta.

## Qué es
App para un taller de costura (Creaciones Kathy, Guadalupe N.L.). Sirve para:
1. Capturar la ficha de una clienta (datos + medidas).
2. Calcular cuánta tela lleva una prenda.
3. Calcular cuántas prendas salen de un lote de rollos.
4. Generar un reporte en **una sola hoja carta, solo por el frente**, con vista previa editable antes de imprimir.

Referencias en `referencia/`:
- `prototipo.html`: prototipo funcional. El diseño, la hoja y la lógica de cálculo salen de aquí; se puede reutilizar el código.
- `hoja-original.png`: la hoja de papel que usa Kathy hoy.
- `libreta-medidas-1.png` y `libreta-medidas-2.png`: las claves de medidas escritas por Kathy.
- `boceto-insumos.png`: boceto de insumos, telas y entretela.

## Tecnología
- React + Vite + TypeScript.
- Datos guardados en el navegador con IndexedDB (usar Dexie), que sigue siendo la base que usa la app.
- Sincronización entre dispositivos con Firebase (Auth correo/contraseña + Firestore con caché sin internet), en `src/nube/`. Firestore: `fichas/{uid}` (borradas quedan como `{borrada: true}`) y `ajustes/config`. Gana la versión con `actualizada` más reciente. Reglas en `firestore.rules` (lista de correos permitidos). Publicación en GitHub Pages con `.github/workflows/deploy.yml`. Pasos para el usuario en `docs/CONFIGURAR_NUBE.md`.
- Que se pueda instalar como app (PWA) y funcione sin internet.
- Impresión con `window.print()` y CSS `@media print` + `@page { size: letter; margin: 0 }`.
- Botón para exportar y respaldar los datos en un archivo JSON, y para importarlo.

## Pantallas
- **Clienta**: nombre, teléfono, tipo de ficha (Dama / Caballero / Niña / Niño), fecha, fecha de prueba, fecha de entrega, prenda, observaciones.
- **Medidas**: arriba un desplegable **Tipo de medida** (ver abajo). Después la lista de medidas. En los contornos se calcula sola la mitad (½), como en la hoja de papel.
- **Tela**: prenda, mangas, ancho de tela (default 150 cm), % de merma (default 10), tipo de tela. Muestra metros por prenda y el desglose. Abajo: rollos × metros por rollo → prendas que salen y sobrante.
- **Insumos**: hilos (conos/bobinas, pza), aguja calibre #14 (pza), zíper (pza), elástico (m), botones (pza). Telas en metros: lycra, poliéster, polar, algodón, dacrón, popelina. Entretela en metros: Toscana (confirmar nombre), Milibond.
- **Reportes**: historial de fichas guardadas, buscar por clienta, reabrir, duplicar, imprimir.
- **Vista previa**: la hoja tal cual sale impresa; cualquier dato se puede corregir con clic. Los cambios regresan al formulario.
- **Configuración**: tabla de tallas industriales, lista de medidas, holgura, costura, dobladillo, merma, ancho de tela por default.

## Tipo de medida (desplegable en Medidas)
Opciones, en este orden: **A medida** (la primera y la que viene seleccionada), **T-CH**, **T-M**, **T-G**, **T-XL**, **T-XXL**.
- **A medida**: se capturan las medidas exactas de la clienta. Aquí se usan las fórmulas.
- **T-CH a T-XXL**: tallas industriales con valores ya predeterminados. Al elegir una, se llenan todas las medidas con los valores de esa talla y **los campos quedan bloqueados** (no se editan ni en el formulario ni en la vista previa).
- Si se regresa a "A medida", vuelven las medidas que ya se habían capturado de la clienta.
- El reporte impreso muestra junto al título de medidas "A medida" o "Talla T-G · industrial".
- La tabla de tallas vive en Configuración y solo se edita ahí.
- **Los valores actuales de las tallas son provisionales** (base talla M y un paso fijo por talla). Hay que reemplazarlos con la tabla industrial de Kathy en cuanto la mande.

## Medidas (clave · nombre · lleva ½) — lista oficial de Kathy, en este orden
CCo Contorno de cuello ½ · AE Ancho de espalda ½ · HH Hombro a hombro · H Hombro · TT Talle trasero · TD Talle delantero · AB Alto de busto · SB Separación de busto ½ · AEs Alto de escote · CT Contorno de tórax ½ · CB Contorno de busto ½ · SF Sisa frente · SE Sisa espalda · CC Contorno de cintura ½ · CCad Contorno de cadera ½ · ACad Alto de cadera · C Costado · LB Largo de brazo · LCb Largo capa brazo · LML Largo de manga larga · LMC Largo de manga corta · CBr Contorno de brazo ½ · CM Contorno de muñeca ½ · P Puño · LC Largo de camisa · LCh Largo de chaqueta · LF Largo de falda · LP Largo de pantalón · CK Contorno de rodilla ½ (K = knee) · CBo Contorno de bota ½.
Más 3 renglones libres de "Otras medidas".

Notas:
- En la libreta de Kathy "Contorno de brazo" aparece como CB, pero CB ya es Contorno de busto. En la app se usa **CBr** hasta que ella confirme.
- Las medidas deben estar en una lista configurable (clave, nombre, si lleva ½, orden), porque se siguen agregando y renombrando.
- Cada medida tiene un `id` fijo (el de las 30 originales es su clave inicial). Las fichas y las fórmulas usan el `id`, no la clave visible, así que renombrar una clave no pierde valores. Las medidas que usa el cálculo (`MEDIDAS_DEL_CALCULO` en `src/calculo/piezas.ts`) no se pueden quitar.
- La configuración (cálculo, medidas, tallas) se guarda en IndexedDB (`ajustes`) y viaja en el respaldo JSON; al importar se pregunta si se reemplaza.

## Cálculo de tela (versión 1, ajustable)
Método: la tela se dobla a lo largo; ancho útil = ancho/2 − 1 cm de orillo. Cada pieza se corta al doblez.
- Ancho de media pieza = contorno/4 + holgura (2 cm) + costura (1.5 cm).
- Largo de pieza = medida de largo + dobladillo/costura (5–6 cm).
- Piezas por prenda:
  - Falda recta: delantero y trasero (con CCad, LF) + pretina 8 × (CC/2 + 5).
  - Blusa: delantero y trasero (con el mayor de CB y CCad, LC) + mangas + cuello/vistas (CCo/2 + 6).
  - Vestido: delantero y trasero (largo = TD + LF − ACad + 8) + mangas.
  - Pantalón: delantero y trasero (CCad/4 + 6 de tiro + costura, LP + 6) + pretina.
  - Manga: ancho (CBr + 6)/2 + costura; largo LML + 5 si es larga, LMC + 5 si es corta.
- Acomodo: se ordenan las piezas de la más larga a la más corta y se ponen lado a lado mientras quepan en el ancho útil; cada renglón suma su largo. Si una pieza no cabe se gira; si aun así no cabe, se avisa.
- Total = suma de largos × (1 + merma%). Se muestra en metros con 2 decimales.
- Prendas por lote = piso((rollos × metros por rollo) / metros por prenda). Mostrar sobrante.
- Con una talla industrial el cálculo usa los valores de esa talla.
- Holgura, costura, dobladillo y merma se cambian en Configuración, porque Kathy los va a ajustar con su experiencia.
- Las fórmulas van en un archivo aparte (`src/calculo/`) con pruebas unitarias (Vitest) usando los ejemplos del prototipo.
- Desde 2026-10-18 el ancho y el largo de cada pieza son **fórmulas de texto editables** en Configuración (`FORMULAS_INICIALES` en `src/calculo/config.ts`, lector seguro en `src/calculo/formula.ts`, sin eval). Aceptan claves de medidas (por id o clave visible), `holgura`, `costura`, `dobladillo`, `dobladilloManga`, `largoManga`, + − × ÷, paréntesis, ½ y `mayor()`/`menor()`. Las fórmulas iniciales reproducen exactamente las de arriba.

## Diseño
- Logo: `assets/logo.png`. En el reporte va pequeño (≈ 2.5 cm de ancho), arriba a la izquierda, recortado al círculo de la mariposa y la máquina.
- Colores del logo: rosa fuerte `#D23A72`, rosa oscuro `#A8245A`, rosa claro `#F7DCE6`, fondo rosado `#FBF5F7`, texto `#3A2A31`.
- Fuentes: Barlow Condensed (títulos), Nunito Sans (texto), Great Vibes (solo la frase). Van dentro del proyecto con los paquetes `@fontsource/*` (juego latino), importadas en `src/main.tsx`.
- Encabezado del reporte: logo, "CREACIONES KATHY" y debajo la frase **"Diseños exclusivos"**; a la derecha la etiqueta del tipo de ficha (DAMA, etc.).
- Hoja: datos de clienta en un renglón; dos columnas (medidas | consumo, insumos, telas, entretela, mostrario de telas); abajo observaciones y pie con folio y fecha.
- Impresión: todo en una página, sin reverso. Con 30 medidas todavía cabe; si se agregan muchas más, pasar la tabla de medidas a dos columnas. El recuadro del mostrario queda vacío para engrapar muestras.

## Pendiente de confirmar con Kathy
Ver la sección "Preguntas abiertas" en `RETROALIMENTACION.md`.

## Reglas de trabajo
- Cada cambio que pida la clienta se anota primero en `RETROALIMENTACION.md` con fecha, y al terminarlo se marca como hecho.
- No cambiar fórmulas sin dejar anotado el antes y el después.
- Hacer commit en git después de cada cambio que funcione.
