# Evaluador Metodologico de Manuscritos

App web inicial para que un investigador cargue o pegue su manuscrito y reciba una evaluacion preliminar sobre robustez metodologica, trazabilidad, preparacion editorial y compatibilidad con revistas.

## Estado

Version MVP local: `2026-07-03`

La app funciona como frontend estatico con HTML, CSS y JavaScript. El manuscrito se procesa en el navegador y no se sube a un servidor. El backend Google Apps Script queda preparado para una fase posterior de registro institucional de metadatos en Google Sheets.

Esta carpeta es una copia derivada de:

`03_TESIS/APP_RECOMENDADOR_REVISTAS_2026-06-26`

## Funciones incluidas

- Login local por responsable y rol.
- Carga de manuscritos PDF, DOCX, TXT o MD.
- Carga de imagenes para OCR basico cuando el manuscrito llega como captura o escaneo.
- Pegado manual de texto.
- Extraccion local de texto con PDF.js y Mammoth cuando el navegador tiene conexion.
- OCR local asistido con Tesseract.js para PDFs escaneados o imagenes, limitado por rendimiento del navegador.
- Metadatos de calidad de extraccion: metodo, fuente, paginas procesadas, uso de OCR, confianza promedio y advertencias.
- Diagnostico basico de titulo, resumen, idioma, palabras clave, secciones y extension.
- Evaluacion metodologica inicial con 11 criterios ponderados.
- Puntaje de robustez metodologica sobre 100.
- Veredicto metodologico: alto riesgo, requiere ajustes, robustez razonable o robustez alta.
- Estado por criterio: cumple, parcial, no verificable, no cumple o no aplica.
- Evidencia textual por criterio cuando la app la localiza.
- Nivel de confianza por criterio.
- Alertas criticas sobre inferencia, muestreo, generalizacion y trazabilidad.
- Recomendaciones accionables para mejorar el manuscrito.
- Recomendacion secundaria de revistas sudamericanas compatibles.
- Checklist editorial por revista.
- Indexacion, cuartil o nivel de importancia cuando existe evidencia registrada.
- Bitacora local exportable en JSON o CSV.
- PWA basica con cache del app shell.
- Backend Apps Script opcional para registrar solo metadatos de evaluacion.

## Criterios metodologicos evaluados

1. Pregunta u objetivo explicito.
2. Diseno o enfoque metodologico identificable.
3. Poblacion, universo o muestra descrita.
4. Procedimiento de muestreo o seleccion documentado.
5. Variables, indicadores o dimensiones operacionales.
6. Procedimiento de analisis suficientemente trazable.
7. Alcance de inferencia o generalizacion delimitado.
8. Coherencia entre resultados, discusion y conclusiones.
9. Datos, codigo o replicabilidad declarados.
10. Declaraciones editoriales basicas.
11. Referencias o bibliografia identificables.

## Ejecutar localmente

Desde esta carpeta:

```bash
python3 -m http.server 8031
```

Luego abrir:

```text
http://localhost:8031/
```

Codigo de sesion sugerido para el MVP:

```text
FACEN-REVISTAS
```

## Estructura

```text
APP_EVALUADOR_METODOLOGICO_ARTICULOS_2026-07-03/
├── index.html
├── styles.css
├── app.js
├── manifest.webmanifest
├── service-worker.js
├── config.example.js
├── data/
│   ├── journals_seed.js
│   └── diccionario_datos.md
├── docs/
│   ├── arquitectura.md
│   └── checklist_despliegue.md
├── apps_script/
│   ├── Code.gs
│   └── appsscript.json
└── BITACORA_APP_EVALUADOR_METODOLOGICO_DECENA_FACEN.md
```

## Limitaciones actuales

- El login local no reemplaza autenticacion real.
- La evaluacion metodologica usa reglas transparentes y heuristicas; no reemplaza revision experta.
- La extraccion de PDF depende de la calidad textual del documento; si no hay texto embebido, se intenta OCR en navegador.
- El OCR es preliminar: documentos extensos, imagenes borrosas, tablas complejas o baja resolucion requieren revision manual del texto extraido.
- El OCR de PDF se limita inicialmente a las primeras 10 paginas para evitar bloqueos en equipos modestos.
- No se almacena texto completo del manuscrito por defecto.
- El backend no esta configurado: falta Google Sheet, `SPREADSHEET_ID`, despliegue GAS y endpoint publico.
- La base de revistas sigue siendo semilla y debe ampliarse.
- El scoring no es probabilidad de aceptacion editorial.
- Un criterio sin evidencia textual queda como no verificable o parcial, no como incumplimiento automatico.

## Proxima fase recomendada

1. Probar PDF textual, PDF escaneado, imagen, DOCX y texto pegado con manuscritos reales.
2. Crear una matriz de criterios por tipo de estudio: cuantitativo, cualitativo, revision, mixto, metodologico y simulacion.
3. Separar alertas criticas de recomendaciones editoriales.
4. Publicar frontend en GitHub Pages.
5. Crear Google Sheet operativa y desplegar GAS para guardar solo metadatos si el usuario acepta.
6. Generar reporte exportable en HTML/PDF.
7. Calibrar umbrales de calidad OCR y documentar falsos positivos/falsos negativos.
8. Documentar pruebas en bitacora antes de anunciar la app como operativa.
