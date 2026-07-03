# Arquitectura

## Objetivo

Construir una app web institucional que permita a investigadores evaluar preliminarmente si su manuscrito cumple requisitos metodologicos minimos antes del envio editorial. La recomendacion de revistas queda como capa posterior, subordinada al diagnostico metodologico.

## Arquitectura operativa

### Frontend

- HTML, CSS y JavaScript sin build.
- Publicable en GitHub Pages.
- Procesamiento local del manuscrito.
- Extraccion textual con diagnostico de origen: texto PDF, DOCX, archivo textual, texto manual u OCR.
- OCR en navegador con Tesseract.js para PDFs escaneados o imagenes, con limite operativo inicial de paginas.
- Modulo opcional de IA asistida contra endpoint local compatible con Ollama.
- PWA basica para cache de app shell.
- Bitacora local exportable.
- No sube texto completo del manuscrito por defecto.

### Backend

- Google Apps Script opcional.
- Google Sheets como base operativa futura.
- Registra metadatos de evaluacion, puntajes, alertas y ranking.
- Puede registrar casos de entrenamiento supervisado en hoja `ENTRENAMIENTO`.
- No guarda texto completo de manuscritos sin consentimiento explicito.

### Datos

- Matriz metodologica inicial embebida en `app.js`.
- Base semilla de revistas: `data/journals_seed.js`.
- Futuro origen maestro para revistas: Google Sheets.
- Futuro origen maestro para criterios metodologicos: Google Sheets o JSON versionado.

## Flujo de usuario

1. El usuario inicia sesion local con nombre, rol y codigo.
2. Sube PDF, DOCX, TXT, MD o imagen, o pega texto manualmente.
3. La app extrae texto en el navegador.
4. Si el PDF tiene poca o ninguna capa textual, renderiza paginas con PDF.js y aplica OCR local con Tesseract.js.
5. La app registra metadatos de extraccion: metodo, fuente, paginas leidas, uso de OCR, paginas OCR, confianza promedio y advertencias.
6. La app perfila el manuscrito: titulo, resumen, idioma, secciones, senales tematicas y metodologicas.
7. La app calcula robustez metodologica con criterios ponderados.
8. La app presenta veredicto, puntaje, alertas y recomendaciones.
9. Opcionalmente, el usuario solicita una segunda evaluacion IA local o pega una respuesta JSON generada fuera de la app.
10. El usuario valida, corrige o descarta el caso para aprendizaje supervisado.
11. La app recomienda revistas compatibles solo despues del diagnostico metodologico.
12. El usuario puede exportar bitacora JSON/CSV y dataset de entrenamiento JSON/CSV.

## Capa OCR

La capa OCR no reemplaza la revision documental. Su funcion es recuperar texto cuando el manuscrito viene como imagen escaneada.

Reglas operativas iniciales:

- Primero se intenta extraer texto embebido con PDF.js.
- Si la capa textual tiene menos de 900 caracteres utiles o menos de 70 caracteres por pagina leida, se intenta OCR.
- El OCR de PDF se limita a 10 paginas para evitar bloqueos en equipos modestos.
- Se usan idiomas `spa+eng+por`.
- Si Tesseract.js no carga y existe texto embebido minimo, la app continua con advertencia.
- Si OCR produce baja confianza, el diagnostico queda marcado como preliminar y debe revisarse manualmente.

## Motor de evaluacion metodologica

La evaluacion inicial usa 11 criterios:

| Criterio | Proposito |
|---|---|
| Pregunta u objetivo | Verificar que el manuscrito declare su problema de investigacion. |
| Diseno metodologico | Identificar enfoque, metodo o tipo de estudio. |
| Poblacion/muestra | Verificar que el universo, corpus o muestra este descrito. |
| Muestreo/seleccion | Evaluar si se documenta el procedimiento de seleccion. |
| Variables/dimensiones | Verificar operacionalizacion minima. |
| Analisis trazable | Detectar modelo, procedimiento, software, scripts o salidas. |
| Alcance inferencial | Delimitar generalizacion, representatividad y validez externa. |
| Coherencia interna | Revisar presencia de resultados, discusion y conclusiones. |
| Datos/codigo | Verificar replicabilidad o justificacion. |
| Declaraciones | Etica, financiamiento, conflictos e IA cuando aplique. |
| Referencias | Verificar bibliografia/citas identificables. |

Cada criterio se evalua con trazabilidad minima:

| Campo | Uso |
|---|---|
| Estado | `cumple`, `parcial`, `no verificable`, `no cumple` o `no aplica`. |
| Confianza | `alta`, `media`, `baja` o `no evaluable`. |
| Evidencia textual | Fragmentos breves localizados dentro del manuscrito. |
| Recomendacion | Accion sugerida cuando el criterio es parcial o no verificable. |

Regla conservadora: si no se localiza evidencia textual suficiente, el criterio queda como `no verificable` o `parcial`. No se marca automaticamente como `no cumple` salvo que una regla especifica detecte contradiccion o falla explicita.

## Motor de revistas

El ranking de revistas se conserva como segunda capa:

- encaje tematico;
- alcance editorial;
- compatibilidad formal;
- visibilidad e indexacion documentada.

Para manuscritos sobre muestreo, inferencia, representatividad o validez, el motor prioriza revistas de metodologia y estadistica por encima de revistas disciplinarias sin anclaje explicito.

## Modulo de IA asistida

La IA se integra como segunda opinion, no como sustituto de la rubrica.

Diseno inicial:

- endpoint editable, por defecto `http://localhost:11434/api/chat`;
- modelo editable, por defecto `qwen3:8b`;
- prompt JSON con metadatos, criterios, juicio por reglas y texto truncado;
- confirmacion obligatoria si el endpoint no parece local;
- respuesta esperada en JSON estricto;
- render de criterios IA separado del dictamen por reglas;
- guardado local de casos de entrenamiento supervisado.

El caso de entrenamiento incluye:

- metadatos del manuscrito;
- calidad de extraccion/OCR;
- senales tematicas y metodologicas;
- juicio por reglas;
- juicio IA;
- top de revistas;
- decision humana y nota de calibracion.

No incluye texto completo del manuscrito. El aprendizaje futuro debe entrenarse o calibrarse solo con casos revisados por humano.

## Seguridad y privacidad

- El manuscrito se procesa localmente.
- La bitacora local guarda metadatos, no texto completo.
- La bitacora puede guardar metodo de extraccion y calidad OCR, pero no guarda el texto OCR completo.
- La base de entrenamiento guarda juicios y feedback humano, no texto completo.
- El backend preparado rechaza payloads con `textoCompleto`.
- En produccion debe agregarse consentimiento explicito antes de sincronizar metadatos.
- Si se activa GAS, las hojas deben estar protegidas y auditadas.

## Criterio de cierre para produccion

La app solo debe considerarse operativa cuando:

- GitHub Pages publique la version vigente.
- Se pruebe carga real de PDF, DOCX y texto pegado.
- Se pruebe PDF escaneado e imagen con OCR y se revise visualmente la calidad del texto extraido.
- Se pruebe IA local y se documenten errores de CORS, modelo o JSON si aparecen.
- GAS responda y registre metadatos reales, si se decide usar backend.
- Google Sheets tenga estructura protegida.
- Se haya validado que no se almacena texto completo sin consentimiento.
- La bitacora documente pruebas y evidencia de validacion.
