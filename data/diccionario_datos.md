# Diccionario de datos

## Resultado metodologico

| Campo | Descripcion |
|---|---|
| `robustez_metodologica` | Puntaje de 0 a 100 calculado desde criterios metodologicos ponderados. |
| `veredicto_metodologico` | Clasificacion sintetica: alto riesgo, requiere ajustes, robustez razonable o robustez alta. |
| `alertas_criticas` | Cantidad de alertas metodologicas detectadas por reglas transparentes. |
| `criteria` | Lista de criterios evaluados con estado cumple/revisar y peso. |
| `recommendations` | Recomendaciones accionables generadas desde criterios faltantes y alertas. |

La version inicial evalua requisitos minimos generales. En produccion debe separarse la matriz por tipo de estudio: cuantitativo, cualitativo, mixto, revision, simulacion y articulo metodologico.

## `REVISTAS_DB`

Base semilla cargada por `data/journals_seed.js`.

| Campo | Tipo | Descripcion |
|---|---|---|
| `id` | texto | Identificador estable de la revista. |
| `nombre` | texto | Nombre oficial o de uso editorial de la revista. |
| `pais` | texto | Pais de publicacion/editorial. |
| `region` | texto | Region geografica operativa. |
| `issn` | texto | ISSN impreso cuando esta disponible. |
| `eissn` | texto | ISSN electronico cuando esta disponible. |
| `idiomas` | lista | Idiomas aceptados para manuscritos. |
| `idiomasPublicacion` | lista | Idiomas de publicacion registrados. |
| `perfilEditorial` | texto | Tipo de encaje editorial: metodologia pura, estadistica, estadistica social, generalista metodologica, disciplinaria mixta o disciplinaria especializada. |
| `afinidadMetodologica` | numero | Puntaje base 0-100 de afinidad con articulos metodologicos cuando no hay suficientes senales especificas. |
| `disciplinasBase` | lista | Disciplinas o campos que deben aparecer como anclaje para priorizar revistas disciplinarias. |
| `areas` | lista | Areas tematicas usadas para scoring. |
| `metodos` | lista | Enfoques metodologicos compatibles. |
| `tiposArticulo` | lista | Tipos de contribucion aceptados o relevantes. |
| `palabrasMin` | numero | Extension minima si la norma la declara. |
| `palabrasMax` | numero | Extension maxima si la norma la declara. |
| `paginasMax` | numero | Limite de paginas cuando aplica. |
| `resumenMax` | numero | Limite de resumen en palabras o caracteres segun la revista. |
| `palabrasClave` | numero | Cantidad esperada de palabras clave. |
| `estiloCitas` | texto | Estilo bibliografico/citacion principal. |
| `plataforma` | texto | Plataforma o canal de envio. |
| `acceso` | texto | Condicion de acceso abierto/licencia si esta registrada. |
| `apc` | texto | Informacion de cobros o necesidad de verificacion. |
| `riesgoEditorial` | texto | Riesgo operativo estimado para priorizacion. |
| `visibilidad` | numero | Puntaje interno de visibilidad, 0-100. |
| `compatibilidadBase` | numero | Puntaje estrategico inicial, 0-100. |
| `fuenteUrl` | URL | Pagina oficial usada como evidencia. |
| `envioUrl` | URL | Plataforma o enlace de envio. |
| `fechaVerificacion` | fecha | Fecha en que se verifico la fuente. |
| `impacto` | objeto | Bloque de indexacion, cuartiles e importancia. |
| `requisitosClave` | lista | Requisitos editoriales sintetizados. |
| `formato` | lista | Reglas de formato/estilo. |
| `documentacion` | lista | Documentos o declaraciones requeridas. |
| `recomendaciones` | lista | Recomendaciones de adaptacion editorial. |

## Bloque `impacto`

| Campo | Tipo | Descripcion |
|---|---|---|
| `nivelImportancia` | texto | Clasificacion operativa: muy alto, alto, alto-especializado, medio-especializado o pendiente. |
| `nivelFuente` | texto | Justificacion breve del nivel asignado. |
| `indexaciones` | lista | Bases o sistemas donde la revista aparece o declara presencia. |
| `cuartiles` | lista | Registros por sistema y ano. No debe mezclarse SJR con JCR o CiteScore. |
| `fuentesImpacto` | lista | URLs usadas para verificar indexacion, cuartil o registro. |
| `estadoImpacto` | texto | Estado de verificacion: verificado_parcial, parcial, pendiente. |

### Campos dentro de `cuartiles`

| Campo | Tipo | Descripcion |
|---|---|---|
| `sistema` | texto | Sistema de cuartil, por ejemplo SJR/SCImago, JCR/WoS o CiteScore/Scopus. |
| `valor` | texto | Q1, Q2, Q3, Q4, pendiente o no localizado. |
| `anio` | texto | Ano del indicador. |
| `categoria` | texto | Categoria tematica donde se ubica el cuartil. |
| `sjr` | texto | Valor SJR cuando fue capturado. |
| `fuenteUrl` | URL | URL de evidencia del registro. |
| `estado` | texto | Estado de verificacion del dato. |

## Perfil de articulo extraido

Objeto generado en `app.js` luego del analisis.

| Campo | Tipo | Descripcion |
|---|---|---|
| `title` | texto | Titulo probable extraido del inicio del manuscrito. |
| `abstract` | texto | Resumen detectado o primer parrafo largo. |
| `keywords` | lista | Palabras clave detectadas. |
| `language` | texto | Idioma inferido: `es`, `pt` o `en`. |
| `wordCount` | numero | Conteo aproximado de palabras. |
| `charCount` | numero | Conteo de caracteres. |
| `topics` | lista | Senales tematicas detectadas. |
| `methods` | lista | Senales metodologicas detectadas. |
| `intent` | objeto | Intencion editorial inferida: nucleo metodologico, nucleo estadistico y anclajes disciplinarios. |
| `sections` | objeto | Presencia aproximada de introduccion, metodologia, resultados, discusion, conclusion y referencias. |
| `referencesCount` | numero | Estimacion de referencias detectadas. |
| `hasData` | booleano | Senal de datos, codigo, repositorio o replicacion. |
| `hasEthics` | booleano | Senal de etica, financiamiento o conflicto de interes. |
| `hasAI` | booleano | Senal de declaracion de uso de IA. |
| `readiness` | objeto | Puntaje y pendientes de preparacion editorial. |
| `extraction` | objeto | Metadatos de origen y calidad del texto usado para el analisis. |
| `methodology` | objeto | Puntaje, veredicto, criterios, alertas y recomendaciones metodologicas. |
| `aiReview` | objeto | Dictamen opcional de IA asistida cuando el usuario ejecuta o importa una respuesta JSON. |

### `extraction`

| Campo | Tipo | Descripcion |
|---|---|---|
| `method` | texto | Metodo usado: `pdf_texto`, `pdf_texto_bajo`, `pdf_texto_mas_ocr`, `ocr_pdf`, `ocr_imagen`, `docx_texto`, `archivo_texto`, `texto_manual`, `texto_editado_manual` u `ocr_editado_manual`. |
| `source` | texto | Fuente operativa: `pdf`, `docx`, `image`, `text` o `manual`. |
| `pageCount` | numero | Total de paginas cuando el archivo permite estimarlo. |
| `pagesRead` | numero | Paginas leidas por extractor textual. |
| `ocrUsed` | booleano | Indica si se aplico OCR. |
| `ocrPages` | numero | Cantidad de paginas o imagenes procesadas con OCR. |
| `ocrConfidence` | numero | Confianza promedio reportada por Tesseract.js, cuando esta disponible. |
| `warnings` | lista | Advertencias de extraccion o calidad. No contiene texto completo del manuscrito. |

### `methodology.criteria`

| Campo | Descripcion |
|---|---|
| `id` | Identificador estable del criterio. |
| `label` | Nombre visible del criterio. |
| `status` | Estado del juicio: `cumple`, `parcial`, `no verificable`, `no cumple` o `no aplica`. |
| `confidence` | Nivel de confianza: `alta`, `media`, `baja` o `no evaluable`. |
| `evidence` | Fragmentos breves del manuscrito usados como evidencia textual. |
| `recommendation` | Accion sugerida para mejorar o documentar el criterio. |

## Bitacora local

Guardada en `localStorage` bajo la clave:

`decena_evaluador_metodologico_audit_v1`

| Campo | Tipo | Descripcion |
|---|---|---|
| `timestamp` | fecha-hora | Momento del analisis. |
| `usuario` | texto | Responsable de la sesion. |
| `rol` | texto | Rol declarado. |
| `archivo` | texto | Nombre de archivo o texto pegado. |
| `extraccion_metodo` | texto | Metodo de extraccion usado para el texto evaluado. |
| `extraccion_fuente` | texto | Fuente operativa de extraccion. |
| `extraccion_paginas` | numero | Total de paginas del archivo cuando esta disponible. |
| `extraccion_paginas_leidas` | numero | Paginas leidas por extractor textual. |
| `ocr_usado` | booleano | Indica si se uso OCR. |
| `ocr_paginas` | numero | Paginas o imagenes procesadas con OCR. |
| `ocr_confianza` | numero | Confianza promedio OCR, si esta disponible. |
| `extraccion_advertencias` | numero | Cantidad de advertencias de extraccion registradas. |
| `titulo` | texto | Titulo probable. |
| `idioma` | texto | Idioma inferido. |
| `palabras` | numero | Conteo aproximado. |
| `readiness` | numero | Preparacion editorial 0-100. |
| `robustez_metodologica` | numero | Puntaje metodologico 0-100. |
| `veredicto_metodologico` | texto | Veredicto sintetico de robustez. |
| `alertas_criticas` | numero | Cantidad de alertas criticas detectadas. |
| `evidencias_detectadas` | numero | Total de fragmentos textuales localizados para criterios metodologicos. |
| `criterios_no_verificables` | numero | Cantidad de criterios sin evidencia suficiente. |
| `criterios_baja_confianza` | numero | Cantidad de criterios con confianza baja o no evaluable. |
| `top` | lista | Top 5 de revistas recomendadas con puntaje. |

## Dataset local de entrenamiento supervisado

Guardado en `localStorage` bajo la clave:

`decena_evaluador_metodologico_training_v1`

| Campo | Tipo | Descripcion |
|---|---|---|
| `timestamp` | fecha-hora | Momento en que se guarda el caso. |
| `usuario` | texto | Responsable de la sesion. |
| `rol` | texto | Rol declarado. |
| `archivo` | texto | Nombre de archivo o texto pegado. |
| `titulo` | texto | Titulo probable. |
| `idioma` | texto | Idioma inferido. |
| `palabras` | numero | Conteo aproximado. |
| `extraccion` | objeto | Metadatos de extraccion/OCR. |
| `senales` | objeto | Temas, metodos, nucleo metodologico y nucleo estadistico detectados. |
| `juicio_reglas` | objeto | Resumen del dictamen por reglas transparentes. |
| `juicio_ia` | objeto | Resumen del dictamen IA importado o generado. |
| `top_revistas` | lista | Tres primeras revistas recomendadas al momento de guardar. |
| `feedback_humano` | objeto | Decision humana: pendiente, validado, requiere correccion o descartar; mas nota de calibracion. |

Este dataset no debe contener texto completo del manuscrito.

## Hoja `ENTRENAMIENTO` en Google Sheets

Cuando se configure Apps Script, la hoja `ENTRENAMIENTO` debe usar estos campos minimos:

| Campo | Tipo | Descripcion |
|---|---|---|
| `timestamp` | fecha-hora | Momento de registro. |
| `usuario` | texto | Responsable. |
| `rol` | texto | Rol declarado. |
| `archivo` | texto | Nombre de archivo o texto pegado. |
| `titulo` | texto | Titulo probable. |
| `idioma` | texto | Idioma inferido. |
| `palabras` | numero | Conteo aproximado. |
| `feedback_decision` | texto | Decision humana para entrenamiento. |
| `feedback_nota` | texto | Nota breve de calibracion. |
| `reglas_score` | numero | Puntaje por reglas. |
| `reglas_veredicto` | texto | Veredicto por reglas. |
| `ia_modelo` | texto | Modelo usado. |
| `ia_endpoint_tipo` | texto | `local` o `externo`. |
| `ia_score` | numero | Puntaje IA. |
| `ia_veredicto` | texto | Veredicto IA. |
| `ia_confianza` | texto | Confianza IA. |
| `ocr_usado` | booleano | Si el texto dependio de OCR. |
| `top_json` | JSON | Top de revistas resumido. |
| `criterios_reglas_json` | JSON | Estados por criterio segun reglas. |
| `criterios_ia_json` | JSON | Estados por criterio segun IA. |
