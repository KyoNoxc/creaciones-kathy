# Prompts para Claude Code

## 1. Primer mensaje (copiar y pegar tal cual)

Lee CLAUDE.md y RETROALIMENTACION.md. Revisa también todo lo que hay en la carpeta referencia/, sobre todo referencia/prototipo.html, que es el prototipo funcional que ya aprobamos.

Quiero que construyas la app de Creaciones Kathy siguiendo CLAUDE.md, con React + Vite + TypeScript.

Antes de escribir código, entra en modo plan y dame un plan por fases. Empieza solo con la fase 1:
- Crear el proyecto e iniciar git.
- Pasar a React lo que ya hace el prototipo: pestañas Clienta, Medidas (con el desplegable A medida / T-CH / T-M / T-G / T-XL / T-XXL), Tela e Insumos, y la vista previa editable de la hoja carta.
- Separar las fórmulas de tela en src/calculo/ con pruebas en Vitest.
- Que el botón Imprimir saque exactamente una hoja carta por el frente.

Cuando termine la fase 1, dime cómo correrla y no sigas con la fase 2 hasta que te lo pida.

## 2. Fases siguientes (un mensaje por fase)

- Fase 2: "Agrega el guardado de fichas en IndexedDB con Dexie, la pantalla de Reportes con buscador por clienta, reabrir, duplicar y borrar, y respaldo/importación en JSON."
- Fase 3: "Agrega la pantalla de Configuración: tabla de tallas, lista de medidas editable, holgura, costura, dobladillo, merma y ancho de tela por default."
- Fase 4: "Convierte la app en PWA instalable que funcione sin internet, con las fuentes descargadas dentro del proyecto."

## 3. Cada vez que Kathy pida un cambio

Agrega a RETROALIMENTACION.md con fecha de hoy: "<lo que pidió Kathy con sus palabras>". Luego hazlo, corre las pruebas, márcalo como hecho y haz commit.
