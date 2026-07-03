## 2026-07-03 15:09

### Proyecto

* Nombre: App web evaluador metodologico de manuscritos
* Cliente o institucion: FACEN-UNA / DECENA_FACEN
* Ruta local: `/Users/diegobernardomezabogado/Library/CloudStorage/GoogleDrive-dmeza.py@gmail.com/Mi unidad/DECENA_FACEN/03_TESIS/APP_EVALUADOR_METODOLOGICO_ARTICULOS_2026-07-03`
* Repositorio: `https://github.com/investigapyrm/evaluador_metodologico.git`
* URL publica: pendiente de activar GitHub Pages
* Responsable: Codex
* Version: publicacion institucional confirmada `2026-07-03`

### Objetivo de la intervencion

* Reintentar el commit and push final luego de que `diegomezapy` fuera agregado como colaborador del repositorio institucional.

### Diagnostico inicial

* El repositorio local estaba limpio.
* `origin` apuntaba correctamente a `https://github.com/investigapyrm/evaluador_metodologico.git`.
* El repositorio institucional no tenia ramas publicadas antes del reintento.
* La rama local `main` tenia `HEAD` en `c6a5576`.

### Acciones realizadas

* Se verifico estado Git local y remotos.
* Se verifico que el repositorio destino seguia vacio antes del push.
* Se ejecuto `git push -u origin main`.
* Se verifico la rama remota `main` con `git ls-remote --heads origin main`.
* Se ejecutaron verificaciones sintacticas de JavaScript y Apps Script.
* Se actualizo esta bitacora para cierre trazable de publicacion.

### Archivos modificados

* `BITACORA_APP_EVALUADOR_METODOLOGICO_DECENA_FACEN.md`

### Comandos o scripts ejecutados

* `git status -sb`
* `git remote -v`
* `git log --oneline --decorate -7`
* `git ls-remote https://github.com/investigapyrm/evaluador_metodologico.git`
* `git push -u origin main`
* `git ls-remote --heads origin main`
* `node --check app.js`
* `node --check service-worker.js`
* `node --check data/journals_seed.js`
* `node --check` sobre copia temporal de `apps_script/Code.gs`

### Resultados verificados

* Se creo la rama remota `main` en `investigapyrm/evaluador_metodologico`.
* Hash remoto publicado al cierre del primer push exitoso: `c6a55763a0b9ed225fb1f63156f47b7f09634d17`.
* La rama local `main` quedo siguiendo a `origin/main`.
* Las verificaciones sintacticas no devolvieron errores.

### Pruebas realizadas

* Verificacion Git local/remota.
* Verificacion sintactica de archivos JavaScript principales.
* Verificacion sintactica de Apps Script mediante copia temporal `.js`.

### Errores o incidentes

* El bloqueo anterior por `403` quedo resuelto luego de ajustar la colaboracion/permisos de GitHub.

### Soluciones aplicadas

* Se publico la app en el repositorio institucional.
* Se mantuvo el remoto anterior como `respaldo_diegomezapy`.
* Se deja bitacora local y central sincronizada para continuidad.

### Pendientes

* Activar GitHub Pages desde la rama `main`.
* Verificar la URL publica cuando Pages quede habilitado.
* Probar el flujo OCR/IA desde la URL publica con un manuscrito real.

### Riesgos

* La publicacion del repositorio no activa automaticamente GitHub Pages.
* Las funciones IA con Ollama dependen de que el usuario tenga un endpoint local disponible.

### Recomendaciones

* Activar GitHub Pages desde `Settings > Pages > Deploy from branch > main`.
* Registrar la URL publica final en este README y en esta bitacora.

## 2026-07-03 14:51

### Proyecto

* Nombre: App web evaluador metodologico de manuscritos
* Cliente o institucion: FACEN-UNA / DECENA_FACEN
* Ruta local: `/Users/diegobernardomezabogado/Library/CloudStorage/GoogleDrive-dmeza.py@gmail.com/Mi unidad/DECENA_FACEN/03_TESIS/APP_EVALUADOR_METODOLOGICO_ARTICULOS_2026-07-03`
* Repositorio destino: `https://github.com/investigapyrm/evaluador_metodologico.git`
* URL publica: pendiente de activar GitHub Pages
* Responsable: Codex
* Version: intento de publicacion institucional `2026-07-03`

### Objetivo de la intervencion

* Completar el commit y push final de la app web hacia el repositorio institucional `investigapyrm/evaluador_metodologico.git`.

### Diagnostico inicial

* El repositorio local estaba limpio y con el commit de app `c028676` preparado.
* `origin` apuntaba a `https://github.com/investigapyrm/evaluador_metodologico.git`.
* Se conservo el remoto anterior como `respaldo_diegomezapy`.
* La rama local `main` quedo un commit por delante del respaldo previo.
* Luego se generaron commits documentales adicionales solo para registrar la publicacion institucional y el bloqueo encontrado.

### Acciones realizadas

* Se intento publicar por HTTPS con `git push -u origin main`.
* Se probo acceso alternativo por SSH con `git ls-remote git@github.com:investigapyrm/evaluador_metodologico.git`.
* Se intento revisar el repositorio mediante el conector GitHub disponible en Codex.
* Se verifico que no existan `GITHUB_TOKEN` ni `GH_TOKEN` disponibles en el entorno local.
* Se verifico que las CLI `gh` y `hub` no estan instaladas.
* Se hizo un reintento final de `git push -u origin main` luego de commitear el registro de bitacora.

### Archivos modificados

* `BITACORA_APP_EVALUADOR_METODOLOGICO_DECENA_FACEN.md`

### Comandos o scripts ejecutados

* `git status -sb`
* `git remote -v`
* `git log --oneline --decorate -5`
* `git push -u origin main`
* `GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10' git ls-remote git@github.com:investigapyrm/evaluador_metodologico.git`
* Verificacion de variables locales `GITHUB_TOKEN` y `GH_TOKEN`.
* Verificacion de disponibilidad local de `gh` y `hub`.
* Reintento final de `git push -u origin main` con el cierre documental incluido.

### Resultados verificados

* El commit de app preparado para publicar es `c028676`; existen commits documentales posteriores para trazabilidad.
* El push HTTPS fallo con permiso denegado: `Permission to investigapyrm/evaluador_metodologico.git denied to diegomezapy`.
* El reintento final del push con la bitacora commiteada fallo con el mismo `403`.
* El acceso SSH fallo con `Permission denied (publickey)`.
* El conector GitHub fallo con `401 token_expired`.
* No hay token local disponible para una publicacion alternativa por API.

### Pruebas realizadas

* Verificacion Git local.
* Verificacion de remoto institucional configurado.
* Verificacion de acceso SSH no interactivo.
* Verificacion de herramientas de publicacion disponibles en el entorno.

### Errores o incidentes

* Bloqueo externo por autenticacion/permisos de GitHub. El codigo y el commit local estan listos, pero la cuenta/token actual no tiene permiso efectivo de escritura sobre `investigapyrm/evaluador_metodologico.git`.

### Soluciones aplicadas

* Se dejo el repositorio local preparado con `origin` apuntando al destino institucional.
* Se dejo el remoto anterior preservado como `respaldo_diegomezapy`.
* Se registro evidencia completa del bloqueo para retomar la publicacion sin reconstruir el trabajo.

### Pendientes

* Confirmar que `diegomezapy` haya aceptado la invitacion de colaborador o tenga permiso `Write/Maintain/Admin` sobre `investigapyrm/evaluador_metodologico`.
* Si la organizacion exige SSO, autorizar el token de GitHub para la organizacion `investigapyrm`.
* Alternativamente, iniciar sesion con `gh auth login` o publicar desde GitHub Desktop con una cuenta con permisos.
* Reintentar `git push -u origin main`.
* Activar GitHub Pages desde `main` cuando el push institucional quede aplicado.

### Riesgos

* Mientras el permiso no se corrija, el repositorio institucional seguira vacio aunque el trabajo local este preparado.
* La URL publica de GitHub Pages no existira hasta que haya al menos una rama publicada y Pages sea activado.

### Recomendaciones

* Corregir primero el permiso de escritura del usuario o token actual antes de nuevos cambios de codigo.
* Una vez corregido el permiso, ejecutar `git push -u origin main` desde esta misma carpeta.

## 2026-07-03 14:47

### Proyecto

* Nombre: App web evaluador metodologico de manuscritos
* Cliente o institucion: FACEN-UNA / DECENA_FACEN
* Ruta local: `/Users/diegobernardomezabogado/Library/CloudStorage/GoogleDrive-dmeza.py@gmail.com/Mi unidad/DECENA_FACEN/03_TESIS/APP_EVALUADOR_METODOLOGICO_ARTICULOS_2026-07-03`
* Repositorio: `https://github.com/investigapyrm/evaluador_metodologico.git`
* URL publica: pendiente de activar GitHub Pages
* Responsable: Codex
* Version: publicacion en repositorio institucional `2026-07-03`

### Objetivo de la intervencion

* Publicar la app web en el repositorio institucional vacio `investigapyrm/evaluador_metodologico.git`, usando la colaboracion disponible de la cuenta autenticada.

### Diagnostico inicial

* El repositorio local estaba limpio.
* El remoto anterior era `https://github.com/diegomezapy/evalua_articulos_cientificos.git`.
* La consulta a `https://github.com/investigapyrm/evaluador_metodologico.git` no devolvio ramas, consistente con repositorio vacio.

### Acciones realizadas

* Se verifico estado Git local.
* Se verifico que el repositorio destino exista y no tenga refs publicados.
* Se actualizo `README.md` con el repositorio principal.
* Se preparo esta entrada de bitacora para cierre trazable de publicacion.

### Archivos modificados

* `README.md`
* `BITACORA_APP_EVALUADOR_METODOLOGICO_DECENA_FACEN.md`

### Comandos o scripts ejecutados

* `git status --short --branch`
* `git log --oneline --decorate -3`
* `git remote -v`
* `git ls-remote https://github.com/investigapyrm/evaluador_metodologico.git`
* Pendiente tras esta entrada: commit, cambio de remoto y push a `main`.

### Resultados verificados

* Repositorio destino accesible y sin ramas publicadas al inicio.

### Pruebas realizadas

* Verificacion Git local y consulta remota.

### Errores o incidentes

* Sin incidentes hasta esta etapa.

### Soluciones aplicadas

* Se conserva el remoto anterior como respaldo antes de cambiar `origin`.

### Pendientes

* Hacer commit de publicacion.
* Empujar `main` al repositorio `investigapyrm/evaluador_metodologico.git`.
* Verificar hash remoto.
* Activar GitHub Pages si se desea URL publica de prueba.

### Riesgos

* Publicar el repo no activa automaticamente GitHub Pages.

### Recomendaciones

* Usar este repositorio como fuente principal de la app web y activar Pages desde `main` cuando se confirme la prueba funcional.

## 2026-07-03 14:36

### Proyecto

* Nombre: App web evaluador metodologico de manuscritos
* Cliente o institucion: FACEN-UNA / DECENA_FACEN
* Ruta local: `/Users/diegobernardomezabogado/Library/CloudStorage/GoogleDrive-dmeza.py@gmail.com/Mi unidad/DECENA_FACEN/03_TESIS/APP_EVALUADOR_METODOLOGICO_ARTICULOS_2026-07-03`
* Repositorio: `https://github.com/diegomezapy/evalua_articulos_cientificos.git`
* URL publica: pendiente; rama publicada `evaluador-metodologico-ocr`
* Responsable: Codex
* Version: cierre commit and push final `2026-07-03`

### Objetivo de la intervencion

* Verificar que la app web quede commiteada y empujada al remoto luego de incorporar OCR, IA asistida y aprendizaje supervisado.

### Diagnostico inicial

* El arbol local estaba limpio.
* `HEAD` apuntaba al commit `86b136b`.
* La rama local `main` seguia a `origin/evaluador-metodologico-ocr`.

### Acciones realizadas

* Se verifico estado Git local.
* Se verifico remoto configurado.
* Se verifico hash remoto de la rama `evaluador-metodologico-ocr`.
* Se ejecuto `git push origin main:evaluador-metodologico-ocr`.
* Se confirmo que el remoto respondio `Everything up-to-date`.

### Archivos modificados

* `BITACORA_APP_EVALUADOR_METODOLOGICO_DECENA_FACEN.md`

### Comandos o scripts ejecutados

* `git status --short --branch`
* `git log --oneline --decorate -5`
* `git remote -v`
* `git ls-remote --heads origin evaluador-metodologico-ocr`
* `git push origin main:evaluador-metodologico-ocr`

### Resultados verificados

* Rama remota publicada: `evaluador-metodologico-ocr`.
* Hash remoto previo al cierre: `86b136b9421c87cef63b26f50d2184edccb9678c`.
* No habia cambios de codigo pendientes.

### Pruebas realizadas

* Verificacion Git local/remota.

### Errores o incidentes

* Sin incidentes.

### Soluciones aplicadas

* Se deja cierre documental en bitacora para trazabilidad final.

### Pendientes

* Probar la app con usuario final.
* Probar OCR real desde navegador.
* Probar Ollama local con `qwen3:8b`.
* Activar URL publica o PR cuando se defina si esta rama reemplaza o no a la app publica actual.

### Riesgos

* La rama publicada no equivale todavia a despliegue publico en GitHub Pages.

### Recomendaciones

* Usar la rama `evaluador-metodologico-ocr` para pruebas controladas antes de mezclar con la rama publica principal.

## 2026-07-03 14:16

### Proyecto

* Nombre: App web evaluador metodologico de manuscritos
* Cliente o institucion: FACEN-UNA / DECENA_FACEN
* Ruta local: `/Users/diegobernardomezabogado/Library/CloudStorage/GoogleDrive-dmeza.py@gmail.com/Mi unidad/DECENA_FACEN/03_TESIS/APP_EVALUADOR_METODOLOGICO_ARTICULOS_2026-07-03`
* Repositorio: Git local con remoto `https://github.com/diegomezapy/evalua_articulos_cientificos.git`
* URL publica: pendiente; rama publicada `evaluador-metodologico-ocr`
* Responsable: Codex
* Version: IA asistida y aprendizaje supervisado `2026-07-03`

### Objetivo de la intervencion

* Implementar una primera capa de IA open source/local en la app web, orientada a segunda opinion metodologica y generacion de casos de entrenamiento supervisado.

### Diagnostico inicial

* La app ya contaba con reglas metodologicas transparentes y OCR local asistido.
* Faltaba una forma de conectar modelos open source como `qwen3:8b` sin convertirlos en veredicto automatico.
* Para que el sistema aprenda con nuevos articulos, se requiere feedback humano versionable y exportable, no aprendizaje automatico no supervisado.

### Acciones realizadas

* Se agrego pestana `IA`.
* Se agregaron campos de endpoint y modelo, con valores por defecto para Ollama local.
* Se agrego generacion de prompt JSON estructurado desde el manuscrito evaluado.
* Se agrego llamada opcional a endpoint compatible con Ollama.
* Se agrego importacion manual de respuesta JSON de IA.
* Se agrego render de dictamen IA separado del dictamen por reglas.
* Se agrego confirmacion si el endpoint IA no parece local.
* Se agrego almacenamiento local de casos de entrenamiento supervisado.
* Se agrego exportacion JSON/CSV de casos de entrenamiento.
* Se agrego sincronizacion opcional de casos de entrenamiento al backend GAS.
* Se agrego hoja `ENTRENAMIENTO` en Apps Script.
* Se actualizaron README, arquitectura, diccionario de datos, checklist, config example y service worker.

### Archivos modificados

* `index.html`
* `app.js`
* `styles.css`
* `service-worker.js`
* `config.example.js`
* `apps_script/Code.gs`
* `README.md`
* `docs/arquitectura.md`
* `docs/checklist_despliegue.md`
* `data/diccionario_datos.md`
* `BITACORA_APP_EVALUADOR_METODOLOGICO_DECENA_FACEN.md`

### Comandos o scripts ejecutados

* `date '+%Y-%m-%d %H:%M:%S %Z'`
* `git status --short --branch`
* `rg` sobre memoria y carpeta maestra para revisar contexto y criterios de modelos externos.
* `node --check app.js`
* `node --check service-worker.js`
* `node --check data/journals_seed.js`
* `node --check` sobre copia temporal de `apps_script/Code.gs`
* `curl -I http://localhost:8031/`
* `curl -s http://localhost:8031/index.html | rg -n "tabIA|aiEndpoint|saveTrainingBtn|Reglas \\+ IA opcional"`
* `curl -s http://localhost:8031/app.js | rg -n "TRAINING_KEY|runAiReview|buildAiPrompt|saveTrainingCase|syncTrainingEntry"`
* `curl -s http://localhost:8031/service-worker.js | rg -n "v20260703-3"`
* `curl -s --max-time 2 http://localhost:11434/api/tags || true`
* `command -v ollama || true`

### Resultados verificados

* `app.js`, `service-worker.js`, `data/journals_seed.js` y `apps_script/Code.gs` pasan validacion sintactica.
* La app local responde HTTP 200 en `http://localhost:8031/`.
* `index.html` servido contiene `tabIA`, `aiEndpoint`, `saveTrainingBtn` y encabezado `Reglas + IA opcional`.
* `app.js` servido contiene `TRAINING_KEY`, `runAiReview`, `buildAiPrompt`, `saveTrainingCase` y `syncTrainingEntry`.
* `service-worker.js` servido contiene cache `evaluador-metodologico-v20260703-3`.
* No se detecto Ollama activo en `http://localhost:11434/api/tags`.

### Pruebas realizadas

* Validacion sintactica de JavaScript frontend, service worker, base de revistas y Apps Script.
* Verificacion HTTP local de la app servida.
* Verificacion de marcadores funcionales IA en HTML/JS servidos.
* Verificacion rapida de disponibilidad de Ollama local.

### Errores o incidentes

* No se probo conexion real con Ollama local porque no aparece instalado o activo en este equipo.

### Soluciones aplicadas

* Se mantuvo IA como segunda opinion auditable, no como reemplazo de la rubrica.
* Se implemento aprendizaje supervisado: solo se guarda un caso cuando el usuario registra revision humana.
* Se evita guardar texto completo en el dataset de entrenamiento; se guardan metadatos, estados y feedback.

### Pendientes

* Probar con Ollama local y modelo `qwen3:8b`.
* Verificar si Ollama permite CORS desde el navegador en este equipo.
* Calibrar el esquema JSON con ejemplos reales.
* Evaluar embeddings `bge-m3` como servicio Python posterior.

### Riesgos

* Un endpoint IA externo podria recibir texto del manuscrito; por eso se agrega confirmacion si no parece local.
* El modelo puede devolver JSON invalido o inventar evidencias; por eso se exige revision humana.
* El dataset de entrenamiento puede contaminarse si se guardan casos sin validar.

### Recomendaciones

* Crear primero una bateria pequena de casos validados antes de entrenar o ajustar modelos.
* Separar en el futuro el servicio de embeddings de la app estatica.
* Mantener versionado de modelo, prompt y esquema de salida.

## 2026-07-03 13:51

### Proyecto

* Nombre: App web evaluador metodologico de manuscritos
* Cliente o institucion: FACEN-UNA / DECENA_FACEN
* Ruta local: `/Users/diegobernardomezabogado/Library/CloudStorage/GoogleDrive-dmeza.py@gmail.com/Mi unidad/DECENA_FACEN/03_TESIS/APP_EVALUADOR_METODOLOGICO_ARTICULOS_2026-07-03`
* Repositorio: Git local con remoto `https://github.com/diegomezapy/evalua_articulos_cientificos.git`
* URL publica: pendiente; rama publicada `evaluador-metodologico-ocr`
* Responsable: Codex
* Version: OCR local asistido `2026-07-03`

### Objetivo de la intervencion

* Implementar OCR para PDFs escaneados e imagenes, manteniendo privacidad, trazabilidad y auditoria minima de calidad del texto usado para el juzgamiento metodologico.

### Diagnostico inicial

* La app leia PDF con PDF.js solo cuando el documento tenia capa textual embebida.
* Si el PDF era escaneado o una imagen, el usuario debia pegar el texto manualmente.
* Para juzgamiento metodologico robusto, no basta recuperar texto: tambien debe registrarse el origen y calidad basica de la extraccion.

### Acciones realizadas

* Se agrego Tesseract.js como motor OCR en navegador.
* Se agrego deteccion de PDFs con capa textual baja o ausente.
* Se agrego OCR para PDFs escaneados mediante render de paginas con PDF.js.
* Se agrego OCR directo para archivos de imagen.
* Se limitaron los PDFs escaneados a las primeras 10 paginas para evitar bloqueos en navegador.
* Se agregaron metadatos de extraccion: metodo, fuente, paginas, paginas leidas, uso de OCR, paginas OCR, confianza promedio y advertencias.
* Se agrego visualizacion del metodo de extraccion en la ficha de datos extraidos.
* Se agregaron advertencias en diagnostico cuando el juicio depende de OCR o cuando la confianza OCR es baja.
* Se amplio la bitacora local exportable JSON/CSV con campos OCR sin guardar texto completo.
* Se actualizo el backend opcional Apps Script para recibir solo metadatos OCR.
* Se actualizo documentacion tecnica, README, diccionario de datos, checklist y service worker.

### Archivos modificados

* `index.html`
* `app.js`
* `service-worker.js`
* `apps_script/Code.gs`
* `README.md`
* `docs/arquitectura.md`
* `docs/checklist_despliegue.md`
* `data/diccionario_datos.md`
* `.gitignore`
* `BITACORA_APP_EVALUADOR_METODOLOGICO_DECENA_FACEN.md`

### Comandos o scripts ejecutados

* `date '+%Y-%m-%d %H:%M:%S %Z'`
* `rg` sobre carpeta maestra para buscar referencias OCR/PDF.
* `node --check app.js`
* `node --check service-worker.js`
* `node --check data/journals_seed.js`
* `node --check` sobre copia temporal de `apps_script/Code.gs`
* `curl -I http://localhost:8031/`
* `curl -s http://localhost:8031/index.html | rg -n "tesseract|OCR|metaExtraction|PDF, DOCX"`
* `curl -s http://localhost:8031/app.js | rg -n "extractPdfWithOcr|ocr_confianza|pdfTextDiagnostics|OCR_LANGUAGES"`
* `curl -I` a CDN de Tesseract.js, PDF.js y Mammoth.
* `node -e` para verificar disponibilidad local de Playwright/Puppeteer.
* `git init -b main`
* `git add . && git commit -m "Implementa OCR local para evaluador metodologico"`
* `git ls-remote` para verificar existencia de repositorios remotos candidatos.
* `git push -u origin main` contra repo nuevo propuesto, rechazado por repo inexistente.
* `git push origin main:evaluador-metodologico-ocr` contra `investigapyrm/evalua_articulos_cientificos`, rechazado por permisos.
* `git push origin main:evaluador-metodologico-ocr` contra `diegomezapy/evalua_articulos_cientificos`, exitoso.

### Resultados verificados

* `app.js`, `service-worker.js`, `data/journals_seed.js` y `apps_script/Code.gs` pasan validacion sintactica.
* La app local responde HTTP 200 en `http://localhost:8031/`.
* `index.html` servido contiene Tesseract.js, aviso OCR, accept de imagen y campo `metaExtraction`.
* `app.js` servido contiene `extractPdfWithOcr`, `pdfTextDiagnostics`, `OCR_LANGUAGES` y campos de auditoria `ocr_confianza`.
* CDN de Tesseract.js, PDF.js y Mammoth respondieron HTTP 200 desde esta maquina.
* No hay Playwright ni Puppeteer instalados para prueba visual automatizada.
* Commit local generado y empujado a la rama remota `evaluador-metodologico-ocr`.
* Rama remota verificada con `git ls-remote`.

### Pruebas realizadas

* Validacion sintactica de archivos JavaScript.
* Verificacion HTTP local de app y archivos principales.
* Verificacion de disponibilidad de CDN requeridos.
* Verificacion de ausencia de framework de prueba visual automatizada en el entorno local.

### Errores o incidentes

* `gh` no esta instalado, por lo que la creacion automatica de repositorio remoto nuevo depende de Git remoto existente o debera resolverse por otro canal.
* La carpeta nueva de app no era repositorio Git al inicio de la intervencion.
* No se ejecuto OCR real desde navegador porque no hay Playwright/Puppeteer instalado y la prueba interactiva queda para el usuario.
* El remoto nuevo propuesto `diegomezapy/app_evaluador_metodologico_articulos` no existe.
* `investigapyrm/evalua_articulos_cientificos` rechazo push por permisos de la cuenta autenticada.

### Soluciones aplicadas

* Se mantuvo el procesamiento OCR en navegador para no subir manuscritos a servidor.
* Se implemento minimizacion de datos: el backend y la bitacora guardan metadatos OCR, no texto OCR completo.
* Se documento que el OCR es preliminar y requiere revision manual si la confianza es baja.

### Pendientes

* Probar manualmente un PDF escaneado real y una imagen desde navegador.
* Crear repositorio remoto propio si se desea independencia total.
* Abrir PR desde `https://github.com/diegomezapy/evalua_articulos_cientificos/pull/new/evaluador-metodologico-ocr` si se quiere revisar la rama.
* Activar GitHub Pages para esta rama o migrar a repo propio antes de anunciar URL publica.

### Riesgos

* Tesseract.js requiere conexion inicial para cargar scripts/modelos desde CDN.
* OCR de documentos largos puede ser lento en equipos modestos.
* OCR con mala calidad de imagen puede introducir errores que afecten el juzgamiento.
* El limite de 10 paginas puede no capturar metodologia si aparece mas adelante en documentos escaneados extensos.

### Recomendaciones

* En prueba de usuario, cargar al menos un PDF textual, un PDF escaneado, una imagen y un DOCX.
* Revisar visualmente el texto OCR antes de considerar el dictamen como definitivo.
* En una fase posterior, permitir seleccionar rango de paginas OCR o ejecutar OCR por lotes con backend controlado.

## 2026-07-03 13:31

### Proyecto

* Nombre: App web evaluador metodologico de manuscritos
* Cliente o institucion: FACEN-UNA / DECENA_FACEN
* Ruta local: `/Users/diegobernardomezabogado/Library/CloudStorage/GoogleDrive-dmeza.py@gmail.com/Mi unidad/DECENA_FACEN/03_TESIS/APP_EVALUADOR_METODOLOGICO_ARTICULOS_2026-07-03`
* Repositorio: carpeta operativa local `DECENA_FACEN`
* URL publica: pendiente
* Responsable: Codex
* Version: mejora de calidad de juzgamiento `2026-07-03`

### Objetivo de la intervencion

* Mejorar la calidad del juzgamiento metodologico para que cada criterio no sea solo binario, sino trazable mediante estado, confianza, evidencia textual y recomendacion.

### Diagnostico inicial

* El motor inicial evaluaba criterios como `cumple` o `revisar`.
* Ese enfoque era util como primer filtro, pero insuficiente para auditoria porque no mostraba la evidencia textual que sustentaba el juicio.
* Para defender el resultado ante investigadores, editores o revisores, cada criterio debe distinguir ausencia de evidencia de incumplimiento real.

### Acciones realizadas

* Se reemplazo la evaluacion booleana por una escala de estados:
  * `cumple`;
  * `parcial`;
  * `no verificable`;
  * `no cumple`;
  * `no aplica`.
* Se agrego nivel de confianza por criterio:
  * `alta`;
  * `media`;
  * `baja`;
  * `no evaluable`.
* Se agrego extraccion de fragmentos breves de evidencia textual por criterio.
* Se agrego recomendacion especifica por criterio.
* Se ajusto el puntaje metodologico para ponderar `cumple` como 1, `parcial` como 0,5 y `no verificable` como 0.
* Se agregaron metricas de calidad del juicio:
  * total de evidencias detectadas;
  * criterios no verificables;
  * criterios de baja confianza.
* Se actualizo la interfaz para mostrar evidencia y confianza dentro de cada criterio.
* Se actualizo la bitacora local exportable JSON/CSV.
* Se actualizo el backend opcional Apps Script para recibir las nuevas metricas sin guardar texto completo.
* Se actualizaron README, arquitectura y diccionario de datos.

### Archivos modificados

* `app.js`
* `styles.css`
* `apps_script/Code.gs`
* `README.md`
* `docs/arquitectura.md`
* `data/diccionario_datos.md`
* `BITACORA_APP_EVALUADOR_METODOLOGICO_DECENA_FACEN.md`

### Comandos o scripts ejecutados

* `node --check app.js`
* `node --check data/journals_seed.js`
* `node --check service-worker.js`
* `node --check` sobre copia temporal de `apps_script/Code.gs`
* `curl -I http://localhost:8031/`
* `curl http://localhost:8031/app.js`
* Simulacion Node de extraccion de evidencias textuales por criterio.

### Resultados verificados

* La sintaxis de frontend, base de revistas, service worker y Apps Script es correcta.
* La app local en `http://localhost:8031/` responde HTTP 200.
* El archivo servido `app.js` contiene `extractEvidenceSnippets`, `No verificable`, `Confianza`, `evidencias_detectadas` y `criterios_no_verificables`.
* La simulacion Node recupero evidencia textual para criterios de objetivo, muestreo y alcance inferencial.

### Pruebas realizadas

* Validacion sintactica.
* Verificacion HTTP del servidor local.
* Verificacion de presencia de marcadores funcionales en JS/CSS servidos.
* Simulacion de extraccion de evidencias en texto metodologico.

### Errores o incidentes

* Se detecto que una senal suelta `r` podia generar evidencia falsa para el criterio de analisis; se reemplazo por senales mas especificas como `software r` y `lenguaje r`.

### Soluciones aplicadas

* Se adopto una regla conservadora: si no hay evidencia textual suficiente, el criterio queda como `no verificable` o `parcial`, no como incumplimiento automatico.
* Se agrego trazabilidad minima por criterio para que el juicio pueda revisarse despues.

### Pendientes

* Probar la visualizacion completa en navegador con manuscritos PDF y DOCX reales.
* Agregar criterio `no cumple` solo para contradicciones o fallas explicitamente detectadas.
* Separar rubricas por tipo de estudio.
* Generar reporte descargable en HTML/PDF.

### Riesgos

* La extraccion de evidencia depende de que el texto del PDF sea legible.
* Las reglas aun son heuristicas y deben calibrarse con casos patron.
* Un texto con buena redaccion pero mala metodologia puede requerir revision experta adicional.

### Recomendaciones

* Usar esta version para calibracion interna, no como veredicto final automatico.
* Armar una bateria de casos patron: robusto, parcial, falla fuerte, no verificable y no aplicable.
* Mostrar siempre evidencia y confianza al usuario antes de cualquier recomendacion editorial.

## 2026-07-03 13:04

### Proyecto

* Nombre: App web evaluador metodologico de manuscritos
* Cliente o institucion: FACEN-UNA / DECENA_FACEN
* Ruta local: `/Users/diegobernardomezabogado/Library/CloudStorage/GoogleDrive-dmeza.py@gmail.com/Mi unidad/DECENA_FACEN/03_TESIS/APP_EVALUADOR_METODOLOGICO_ARTICULOS_2026-07-03`
* Repositorio: carpeta operativa local `DECENA_FACEN`
* URL publica: pendiente
* Responsable: Codex
* Version: copia inicial transformada `2026-07-03`

### Objetivo de la intervencion

* Crear una copia separada del MVP de recomendador de revistas y transformarla en una app web general para evaluar robustez metodologica, trazabilidad y preparacion editorial de manuscritos.

### Diagnostico inicial

* El MVP original `APP_RECOMENDADOR_REVISTAS_2026-06-26` ya tenia carga de manuscritos, extraccion local de texto, ranking de revistas, checklist, bitacora y PWA basica.
* Para responder a la idea planteada por el Dr. Danilo, el foco debia pasar de recomendacion editorial a evaluacion metodologica general.
* La app publica `califica_articulos_inferenciales` audita el corpus DADOS, pero no acepta manuscritos nuevos de investigadores externos.

### Acciones realizadas

* Se creo la carpeta nueva `03_TESIS/APP_EVALUADOR_METODOLOGICO_ARTICULOS_2026-07-03`.
* Se copio la app base excluyendo el duplicado accidental de `Code.gs` en raiz.
* Se repuso `apps_script/Code.gs` como backend legitimo de la nueva app.
* Se cambio la identidad visual y textual a `Evaluador Metodologico de Manuscritos`.
* Se agrego una pestana nueva `Metodologia`.
* Se implemento un motor inicial con 11 criterios metodologicos ponderados.
* Se agrego puntaje de robustez metodologica, veredicto, alertas criticas y recomendaciones accionables.
* Se actualizo el backend opcional para registrar robustez, veredicto y numero de alertas sin guardar texto completo.
* Se actualizaron README, arquitectura, checklist de despliegue, manifest, service worker y diccionario.

### Archivos modificados

* `README.md`
* `index.html`
* `app.js`
* `styles.css`
* `manifest.webmanifest`
* `service-worker.js`
* `apps_script/Code.gs`
* `data/diccionario_datos.md`
* `docs/arquitectura.md`
* `docs/checklist_despliegue.md`
* `BITACORA_APP_EVALUADOR_METODOLOGICO_DECENA_FACEN.md`

### Comandos o scripts ejecutados

* `rsync -a --exclude 'Code.gs' ...`
* `cp apps_script/Code.gs ...`
* `date`
* Revision de archivos con `find`, `sed`, `diff`.

### Resultados verificados

* La copia nueva fue creada sin modificar el MVP original.
* La nueva interfaz ya distingue diagnostico, metodologia, revistas, checklist y auditoria.
* El motor metodologico inicial queda integrado en la app y en la bitacora local exportable.

### Pruebas realizadas

* `node --check app.js`
* `node --check data/journals_seed.js`
* `node --check service-worker.js`
* `node --check` sobre copia temporal de `apps_script/Code.gs`
* Carga programatica de `data/journals_seed.js`: `11` revistas y `11` bloques de impacto.
* Verificacion de revistas metodologicamente pertinentes: `dados`, `relmecs`, `relmis`, `rev_col_estadistica`, `rbe`.
* Servidor local iniciado con `python3 -m http.server 8031`.
* `curl -I http://localhost:8031/`: HTTP 200.
* `curl -I http://localhost:8031/app.js`: HTTP 200.
* `curl -I http://localhost:8031/data/journals_seed.js`: HTTP 200.
* Simulacion ligera con `03_TESIS/manuscript180526.pdf`: se detectaron `8` de `9` senales metodologicas revisadas en las primeras paginas extraidas.

### Errores o incidentes

* La exclusion `Code.gs` tambien excluyo inicialmente el archivo legitimo dentro de `apps_script`; se corrigio copiandolo nuevamente desde la fuente.

### Soluciones aplicadas

* Se mantuvo una copia limpia sin el `Code.gs` duplicado en raiz y con el backend correcto en `apps_script/Code.gs`.

### Pendientes

* Probar interactivamente en navegador con rol investigador.
* Probar carga real de PDF, DOCX y texto pegado desde la interfaz.
* Verificar vista movil con captura visual.
* Publicar solo despues de pruebas visuales y funcionales.

### Riesgos

* El motor inicial usa heuristicas transparentes; no reemplaza revision experta.
* La matriz todavia no esta separada por tipo de estudio.
* No debe prometerse como plataforma publica hasta publicacion y validacion.

### Recomendaciones

* Usar esta carpeta como base de la nueva app general.
* Mantener el procesamiento local del manuscrito.
* Integrar backend solo para metadatos, con consentimiento explicito.

## 2026-06-26 10:43

### Proyecto

* Nombre: App web recomendador de revistas sudamericanas
* Cliente o institucion: FACEN-UNA / DECENA_FACEN
* Ruta local: `/Users/diegobernardomezabogado/Library/CloudStorage/GoogleDrive-dmeza.py@gmail.com/Mi unidad/DECENA_FACEN/03_TESIS/APP_RECOMENDADOR_REVISTAS_2026-06-26`
* Repositorio: carpeta operativa local `DECENA_FACEN`
* URL publica: pendiente
* Responsable: Codex
* Version: MVP local `2026-06-26`

### Objetivo de la intervencion

* Crear una primera app web que permita cargar un articulo, extraer datos basicos, recomendar revistas sudamericanas compatibles y presentar recomendaciones de formato, estilo y documentacion requerida por revista.

### Diagnostico inicial

* El proyecto ya tenia una prospeccion de revistas sudamericanas en `03_TESIS/PROSPECCION_REVISTAS_SUDAMERICA_2026-06-23`.
* Existian notebooks previos para integrar SciELO, DOAJ, Redalyc, Latindex y SCImago, pero no una app de recomendacion para usuarios.
* La carpeta maestra institucional `MANUAL_MAESTRO_FORMATOS_FUNCIONES_APPWEB` esta disponible y fue considerada para mantener criterios de robustez, bitacora, trazabilidad y arquitectura web institucional.
* Se verificaron fuentes oficiales de revistas candidatas para poblar una base semilla inicial.

### Acciones realizadas

* Se creo la carpeta `03_TESIS/APP_RECOMENDADOR_REVISTAS_2026-06-26`.
* Se implemento frontend estatico HTML/CSS/JS compatible con GitHub Pages.
* Se agrego login local por responsable y rol.
* Se implemento carga de PDF, DOCX, TXT y MD, con extraccion local en navegador.
* Se implemento motor de perfilado basico del articulo:
  * titulo probable;
  * resumen;
  * idioma;
  * conteo de palabras;
  * palabras clave;
  * senales tematicas;
  * senales metodologicas;
  * preparacion editorial.
* Se implemento ranking explicable por revista.
* Se implemento checklist editorial por revista.
* Se agrego bitacora local exportable en JSON/CSV.
* Se preparo PWA basica con `manifest.webmanifest` y `service-worker.js`.
* Se preparo backend opcional Google Apps Script para registrar metadatos en Google Sheets.

### Archivos modificados

* `README.md`
* `index.html`
* `styles.css`
* `app.js`
* `manifest.webmanifest`
* `service-worker.js`
* `config.example.js`
* `data/journals_seed.js`
* `data/diccionario_datos.md`
* `docs/arquitectura.md`
* `docs/checklist_despliegue.md`
* `apps_script/Code.gs`
* `apps_script/appsscript.json`
* `BITACORA_APP_RECOMENDADOR_REVISTAS_DECENA_FACEN.md`

### Comandos o scripts ejecutados

* `rg` para localizar antecedentes y bitacoras.
* `find` para inspeccionar estructura del repositorio y carpeta maestra.
* `sed` y `jq` para revisar documentos y notebooks previos.
* Consulta web a paginas oficiales de revistas y fuentes abiertas.

### Resultados verificados

* La app existe como modulo separado y no altera el paquete de resometimiento DADOS.
* La base semilla incluye ocho revistas con fuente oficial y fecha de verificacion.
* El backend Apps Script rechaza payloads que intenten enviar texto completo del manuscrito.
* La documentacion tecnica minima fue creada.

### Pruebas realizadas

* `node --check app.js`: sintaxis correcta.
* `node --check data/journals_seed.js`: sintaxis correcta.
* `node --check service-worker.js`: sintaxis correcta.
* `node --check` sobre copia temporal `.js` de `apps_script/Code.gs`: sintaxis correcta.
* Carga de base semilla con Node: 8 revistas (`dados`, `rsp`, `rcp`, `opiniao`, `colombia_int`, `relmecs`, `cinta`, `rbcs`).
* Servidor local iniciado con `python3 -m http.server 8030`.
* `curl -I http://localhost:8030/`: respuesta HTTP 200.
* `curl -I` sobre `app.js`, `data/journals_seed.js` y `service-worker.js`: respuestas HTTP 200.
* Simulacion de scoring con perfil metodologico/cuantitativo en espanol: top 5 generado (`DADOS`, `Revista de Ciencia Politica`, `Revista de Sociologia e Politica`, `Opiniao Publica`, `RBCS`).

### Errores o incidentes

* No se realizo descarga desde Sci-Hub; el flujo queda limitado a fuentes oficiales y abiertas.
* La autenticacion implementada en el MVP es local y no debe considerarse seguridad de produccion.
* Playwright no esta instalado en el entorno, por lo que no se realizo prueba visual automatizada.

### Soluciones aplicadas

* Se adopto procesamiento local del manuscrito para proteger articulos ineditos.
* Se separo la base semilla de revistas en un archivo auditable.
* Se dejo backend GAS preparado solo para metadatos y bitacora, no para almacenar textos completos.

### Pendientes

* Validar visualmente la interfaz en navegador.
* Probar carga real de PDF textual y DOCX desde el navegador.
* Publicar en GitHub Pages cuando se defina rama/carpeta.
* Crear Google Sheet operativa y desplegar GAS si se requiere auditoria central.
* Ampliar la base con fuentes masivas: SciELO, DOAJ, Latindex, Redalyc, OpenAlex y Crossref.
* Agregar ejemplos PDF oficiales por revista con URL, licencia y fecha de captura.
* Convertir la autenticacion local en control real si la app manejara usuarios institucionales.

### Riesgos

* Las normas editoriales pueden cambiar y deben revalidarse antes de recomendar un envio real.
* La extraccion de PDF depende de que el archivo tenga texto y no solo imagen escaneada.
* El ranking inicial puede estar sesgado por una base semilla pequena.
* El puntaje no es probabilidad de aceptacion editorial.

### Recomendaciones

* Usar esta version como MVP de decision editorial asistida, no como sistema final.
* Mantener la base de revistas en Google Sheets para que un editor pueda actualizar normas sin tocar codigo.
* Registrar toda ampliacion de fuentes y reglas de scoring en esta bitacora.
* No almacenar manuscritos completos en backend salvo consentimiento y politica documental explicita.
* Se dejo copia central de esta bitacora en `MANUAL_MAESTRO_FORMATOS_FUNCIONES_APPWEB/BITACORAS_PROYECTOS/BITACORA_APP_RECOMENDADOR_REVISTAS_DECENA_FACEN.md`.

## 2026-06-26 11:01

### Proyecto

* Nombre: App web recomendador de revistas sudamericanas
* Cliente o institucion: FACEN-UNA / DECENA_FACEN
* Ruta local: `/Users/diegobernardomezabogado/Library/CloudStorage/GoogleDrive-dmeza.py@gmail.com/Mi unidad/DECENA_FACEN/03_TESIS/APP_RECOMENDADOR_REVISTAS_2026-06-26`
* Repositorio: carpeta operativa local `DECENA_FACEN`
* URL publica: pendiente
* Responsable: Codex
* Version: recalibracion metodologica `2026-06-26`

### Objetivo de la intervencion

* Corregir el motor de recomendacion para que articulos cuyo nucleo es errores de muestreo, inferencia, representatividad, validez o estadistica no sean enviados prioritariamente a revistas disciplinarias de ciencia politica sin anclaje tematico claro.

### Diagnostico inicial

* La primera version del ranking sobreponderaba prestigio/visibilidad y trataba `metodologia` como tema transversal.
* Esto permitia que revistas de ciencia politica quedaran demasiado arriba aunque el manuscrito tratara centralmente errores de muestreo.
* La base semilla no tenia suficientes revistas de metodologia social y estadistica aplicada.

### Acciones realizadas

* Se agrego `perfilEditorial` a cada revista:
  * `metodologia_pura`;
  * `estadistica`;
  * `estadistica_social`;
  * `generalista_metodologica`;
  * `disciplinaria_mixta`;
  * `disciplinaria_ciencia_politica`;
  * `disciplinaria_opinion_publica`;
  * `disciplinaria_general`.
* Se agregaron campos `afinidadMetodologica` y `disciplinasBase`.
* Se incorporaron tres revistas mas pertinentes para muestreo/metodologia:
  * Revista Latinoamericana de Metodologia de la Investigacion Social;
  * Revista Colombiana de Estadistica;
  * Revista Brasileira de Estatistica.
* Se agrego deteccion de `methodologicalCore` y `statisticalCore`.
* Se agrego compuerta de alcance editorial (`scopeFit`).
* Se redujo el peso de visibilidad cuando el nucleo del manuscrito es metodologico.
* Se agrego bonificacion para revistas de metodologia pura y estadistica.
* Se agrego penalizacion para revistas disciplinarias sin anclaje explicito.
* Se actualizo la explicacion del ranking con el chip `Alcance`.
* Se actualizo README, diccionario de datos y arquitectura.

### Archivos modificados

* `app.js`
* `data/journals_seed.js`
* `README.md`
* `data/diccionario_datos.md`
* `docs/arquitectura.md`
* `BITACORA_APP_RECOMENDADOR_REVISTAS_DECENA_FACEN.md`

### Comandos o scripts ejecutados

* `rg` para ubicar funciones de scoring.
* `sed` para revisar bloques de datos y algoritmo.
* Consulta web puntual a fuentes oficiales/abiertas para revistas metodologicas y estadisticas.
* `node --check app.js`
* `node --check data/journals_seed.js`
* `node` para cargar base semilla y simular ranking de caso de errores de muestreo.

### Resultados verificados

* La base semilla carga 11 revistas.
* La sintaxis de `app.js` es correcta.
* La sintaxis de `data/journals_seed.js` es correcta.
* En una simulacion con tema `errores de muestreo`, `inferencia`, `representatividad`, `sesgo`, `intervalos de confianza` y sin anclaje politico, el top quedo:
  * Revista Brasileira de Estatistica;
  * Revista Latinoamericana de Metodologia de la Investigacion Social;
  * ReLMeCS;
  * Revista Colombiana de Estadistica;
  * DADOS.
* Revista de Ciencia Politica quedo fuera del top 5 y bajo con `alcance=22`, como corresponde para un manuscrito metodologico sin anclaje politico.

### Pruebas realizadas

* Simulacion de scoring para manuscrito metodologico/estadistico en espanol.
* Validacion explicita de que `rcp` no aparece en el top 5 del caso de prueba.

### Errores o incidentes

* Incidente corregido: el ranking anterior podia recomendar una revista de ciencia politica por prestigio/compatibilidad general, aunque el tema central fuera errores de muestreo.

### Soluciones aplicadas

* Se separo `tema` de `alcance editorial`.
* Se introdujo regla de prioridad metodologica: muestreo/inferencia/validez prioriza metodologia y estadistica.
* Se dejo a las revistas disciplinarias como alternativas condicionadas cuando falta anclaje disciplinario.

### Pendientes

* Probar el flujo en navegador con el texto real del articulo.
* Ajustar manualmente la ficha de cada revista estadistica/metodologica con normas completas de envio.
* Ampliar la base con mas revistas de metodologia, estadistica aplicada y ciencias sociales no disciplinarias.

### Riesgos

* La nueva regla puede penalizar de mas a revistas disciplinarias cuando el manuscrito sea metodologico pero este fuertemente anclado en un campo especifico.
* Revista Colombiana de Estadistica puede requerir envio en ingles; debe mostrarse como opcion fuerte solo si el usuario acepta traducir o fortalecer el componente estadistico.

### Recomendaciones

* Mantener como criterio institucional que el ranking debe priorizar objeto editorial real, no solo prestigio.
* Para articulos sobre errores de muestreo, revisar primero revistas de metodologia social y estadistica aplicada.

## 2026-06-26 12:23

### Proyecto

* Nombre: App web recomendador de revistas sudamericanas
* Cliente o institucion: FACEN-UNA / DECENA_FACEN
* Ruta local: `/Users/diegobernardomezabogado/Library/CloudStorage/GoogleDrive-dmeza.py@gmail.com/Mi unidad/DECENA_FACEN/03_TESIS/APP_RECOMENDADOR_REVISTAS_2026-06-26`
* Repositorio: carpeta operativa local `DECENA_FACEN`
* URL publica: pendiente
* Responsable: Codex
* Version: indexacion e impacto `2026-06-26`

### Objetivo de la intervencion

* Incorporar a la app campos de indexacion, cuartil e importancia relativa de cada revista, diferenciando fuentes y estados de verificacion.

### Diagnostico inicial

* El usuario solicito conocer tipo de indexacion, cuartil o nivel de importancia.
* Se identifico que no existe un unico cuartil universal: SJR/SCImago, JCR/WoS, CiteScore/Scopus y otros sistemas pueden diferir por ano y categoria.
* Algunas revistas tienen cuartil SJR localizable, mientras otras solo tienen indexacion regional o especializada.

### Acciones realizadas

* Se agrego bloque `impacto` a cada revista de la base semilla.
* Se registraron campos:
  * `nivelImportancia`;
  * `nivelFuente`;
  * `indexaciones`;
  * `cuartiles`;
  * `fuentesImpacto`;
  * `estadoImpacto`.
* Se agrego visualizacion en la app:
  * chip `Nivel`;
  * detalle de `Cuartil`;
  * lista de indexaciones;
  * estado de verificacion.
* Se actualizo el diccionario de datos.
* Se actualizo el README con advertencia sobre cuartiles por sistema/fuente.

### Archivos modificados

* `data/journals_seed.js`
* `app.js`
* `data/diccionario_datos.md`
* `README.md`
* `BITACORA_APP_RECOMENDADOR_REVISTAS_DECENA_FACEN.md`

### Comandos o scripts ejecutados

* Busqueda web de SCImago/SJR, DOAJ, ISSN Portal, paginas oficiales y servicios de descubrimiento.
* `node --check app.js`
* `node --check data/journals_seed.js`
* `node` para verificar carga de 11 revistas con bloque `impacto`.
* `curl` para confirmar que el servidor local sigue respondiendo.

### Resultados verificados

* La base carga 11 revistas.
* Las 11 revistas tienen bloque `impacto`.
* `Revista de Ciencia Politica` tiene `SJR/SCImago 2025: Q1` registrado.
* `Revista Colombiana de Estadistica` tiene `SJR/SCImago 2025: Q4` registrado.
* Las revistas sin cuartil capturado quedan con estado `pendiente`, `no localizado` o `parcial`, no inventado.
* El servidor local responde HTTP 200.

### Pruebas realizadas

* Validacion de sintaxis JavaScript.
* Validacion de carga de base semilla.
* Verificacion de campos de cuartil para `rcp` y `rev_col_estadistica`.

### Errores o incidentes

* La API de DOAJ no devolvio resultados en una consulta rapida por ISSN con la sintaxis probada; se uso busqueda web/documentacion publica como respaldo.

### Soluciones aplicadas

* Se adopto un modelo de datos conservador: cada cuartil queda asociado a sistema, ano, categoria, fuente y estado.
* Se evita sintetizar un unico ranking de importancia sin fuente.

### Pendientes

* Automatizar captura de indexaciones desde DOAJ, Latindex, SciELO, OpenAlex y SCImago cuando sea posible.
* Completar cuartiles SJR de todas las revistas con captura manual o dataset descargable.
* Agregar JCR/WoS y CiteScore solo cuando se verifiquen en fuentes oficiales o institucionales.

### Riesgos

* Los cuartiles cambian por ano y por categoria.
* Una revista puede ser Q1 en una categoria y no estar indexada en otra.
* No debe usarse el nivel de impacto para desplazar el encaje metodologico real del manuscrito.

### Recomendaciones

* Mantener impacto/indexacion como criterio de informacion, no como criterio unico de recomendacion.
* Para recomendar envio real, revalidar la ficha de impacto el mismo dia o semana de la decision.

## 2026-07-03 12:40

### Proyecto

* Nombre: App web recomendador de revistas sudamericanas
* Cliente o institucion: FACEN-UNA / DECENA_FACEN
* Ruta local: `/Users/diegobernardomezabogado/Library/CloudStorage/GoogleDrive-dmeza.py@gmail.com/Mi unidad/DECENA_FACEN/03_TESIS/APP_RECOMENDADOR_REVISTAS_2026-06-26`
* Repositorio: carpeta operativa local `DECENA_FACEN`
* URL publica: pendiente
* Responsable: Codex
* Version: auditoria de estado para respuesta a Danilo `2026-07-03`

### Objetivo de la intervencion

* Revisar el estado real del MVP local antes de redactar una respuesta al Dr. Danilo sobre la posibilidad de una app web general para evaluar requisitos metodologicos minimos de articulos.

### Diagnostico inicial

* La app existe como MVP local orientado a carga de manuscritos, perfilado basico y recomendacion de revistas.
* La idea conversada con Danilo requiere una evolucion: pasar de recomendacion editorial a evaluacion metodologica general para cualquier investigador.
* La app publica mas cercana al flujo de auditoria metodologica es `califica_articulos_inferenciales`, pero esa app audita el corpus DADOS de 346 casos y no acepta manuscritos nuevos.

### Acciones realizadas

* Se revisaron README, arquitectura, checklist de despliegue, frontend, backend Apps Script y base semilla.
* Se verifico que el servidor local en `http://localhost:8030/` esta activo y sirve esta app.
* Se contrasto el estado del MVP con la app publica `califica_articulos_inferenciales`.
* Se creo un informe de estado para la respuesta a Danilo:
  * `RESPUESTA_DANILO/ESTADO_APPWEB_EVALUACION_METODOLOGICA_2026-07-03.md`

### Archivos modificados

* `RESPUESTA_DANILO/ESTADO_APPWEB_EVALUACION_METODOLOGICA_2026-07-03.md`
* `03_TESIS/APP_RECOMENDADOR_REVISTAS_2026-06-26/BITACORA_APP_RECOMENDADOR_REVISTAS_DECENA_FACEN.md`

### Comandos o scripts ejecutados

* `node --check app.js`
* `node --check data/journals_seed.js`
* `node --check service-worker.js`
* `node --check` sobre copia temporal de `apps_script/Code.gs`
* `curl -I http://localhost:8030/`
* `curl -I http://localhost:8030/app.js`
* `curl -I http://localhost:8030/data/journals_seed.js`
* `curl http://localhost:8030/manifest.webmanifest`
* `node` para cargar `data/journals_seed.js` en contexto aislado y contar revistas/bloques de impacto.

### Resultados verificados

* El servidor local `8030` sirve el MVP del recomendador.
* `index.html`, `app.js`, `data/journals_seed.js` y `manifest.webmanifest` responden correctamente.
* La base semilla carga `11` revistas.
* Las `11` revistas tienen bloque `impacto`.
* Cuartiles conocidos registrados: `rcp: Q1`, `colombia_int: Q1`, `rev_col_estadistica: Q4`.
* El backend Apps Script compila sintacticamente, pero no esta configurado: `SPREADSHEET_ID` sigue vacio.

### Pruebas realizadas

* Validacion sintactica del frontend, service worker, base semilla y Apps Script.
* Prueba HTTP local de archivos principales.
* Verificacion programatica de cantidad de revistas y campos de impacto.

### Errores o incidentes

* No se hizo prueba visual automatizada porque Playwright/Puppeteer no estan instalados.
* No se hizo prueba real de carga PDF/DOCX desde navegador en esta revision.

### Soluciones aplicadas

* Se documento el estado real como MVP local, evitando presentarlo como sistema publico o productivo.
* Se separo la conclusion en dos capas: recomendador local y app publica auditora del corpus DADOS.

### Pendientes

* Crear modulo especifico de evaluacion metodologica por tipo de estudio.
* Publicar frontend en GitHub Pages.
* Crear Google Sheet operativa y desplegar GAS si se necesita auditoria central.
* Probar carga real de PDF, DOCX y texto pegado desde navegador.
* Definir politica de privacidad para no almacenar manuscritos completos.

### Riesgos

* Confundir el MVP de recomendacion de revistas con una plataforma general de robustez metodologica.
* Prometer a terceros una funcionalidad aun no desplegada publicamente.
* Activar backend sin revisar consentimiento y minimizacion de datos.

### Recomendaciones

* Comunicar a Danilo que ya existe una version inicial funcional, pero en fase de integracion y ampliacion.
* Presentar como proxima fase la convergencia entre recomendador local, auditor publico y checklist metodologico general.
