/**
 * Backend opcional para Evaluador Metodologico de Manuscritos.
 *
 * Uso previsto:
 * 1. Crear una Google Sheet operativa.
 * 2. Pegar su ID en SPREADSHEET_ID.
 * 3. Ejecutar setup() una vez.
 * 4. Desplegar como Web App.
 *
 * El frontend MVP procesa el articulo localmente. Este backend solo debe guardar
 * metadatos de analisis, ranking y bitacora; no debe almacenar textos completos
 * de manuscritos sin consentimiento explicito.
 */

const SPREADSHEET_ID = '';

const SHEET_ANALISIS = 'ANALISIS';
const SHEET_LOGS = 'LOGS';
const SHEET_REVISTAS = 'REVISTAS';

const ANALISIS_HEADERS = [
  'timestamp',
  'usuario',
  'rol',
  'archivo',
  'extraccion_metodo',
  'extraccion_fuente',
  'extraccion_paginas',
  'extraccion_paginas_leidas',
  'ocr_usado',
  'ocr_paginas',
  'ocr_confianza',
  'extraccion_advertencias',
  'titulo',
  'idioma',
  'palabras',
  'readiness',
  'robustez_metodologica',
  'veredicto_metodologico',
  'alertas_criticas',
  'evidencias_detectadas',
  'criterios_no_verificables',
  'criterios_baja_confianza',
  'top1_revista',
  'top1_puntaje',
  'top_json'
];

const LOG_HEADERS = [
  'timestamp',
  'accion',
  'usuario',
  'detalle',
  'version'
];

const REVISTAS_HEADERS = [
  'id',
  'nombre',
  'pais',
  'idiomas',
  'palabras_min',
  'palabras_max',
  'estilo_citas',
  'plataforma',
  'fuente_url',
  'fecha_verificacion',
  'estado_validacion'
];

function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action === 'health') {
    return jsonOutput({
      ok: true,
      app: 'evaluador_metodologico_manuscritos',
      version: '2026-07-03',
      spreadsheetConfigured: Boolean(SPREADSHEET_ID)
    });
  }
  return jsonOutput({
    ok: true,
    message: 'Backend activo. Use POST para registrar evaluaciones.'
  });
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    validateAnalysisPayload(payload);
    const ss = getSpreadsheet();
    ensureSheets(ss);
    const top = Array.isArray(payload.top) ? payload.top : [];
    const top1 = top[0] || {};
    ss.getSheetByName(SHEET_ANALISIS).appendRow([
      new Date(),
      clean(payload.usuario),
      clean(payload.rol),
      clean(payload.archivo),
      clean(payload.extraccion_metodo),
      clean(payload.extraccion_fuente),
      Number(payload.extraccion_paginas || 0),
      Number(payload.extraccion_paginas_leidas || 0),
      Boolean(payload.ocr_usado),
      Number(payload.ocr_paginas || 0),
      payload.ocr_confianza === '' || payload.ocr_confianza == null ? '' : Number(payload.ocr_confianza || 0),
      Number(payload.extraccion_advertencias || 0),
      clean(payload.titulo),
      clean(payload.idioma),
      Number(payload.palabras || 0),
      Number(payload.readiness || 0),
      Number(payload.robustez_metodologica || 0),
      clean(payload.veredicto_metodologico),
      Number(payload.alertas_criticas || 0),
      Number(payload.evidencias_detectadas || 0),
      Number(payload.criterios_no_verificables || 0),
      Number(payload.criterios_baja_confianza || 0),
      clean(top1.revista),
      Number(top1.puntaje || 0),
      JSON.stringify(top)
    ]);
    appendLog(ss, 'registrar_evaluacion', payload.usuario, payload.titulo);
    return jsonOutput({ ok: true });
  } catch (error) {
    return jsonOutput({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function setup() {
  const ss = getSpreadsheet();
  ensureSheets(ss);
  appendLog(ss, 'setup', Session.getActiveUser().getEmail(), 'estructura inicial creada');
}

function ensureSheets(ss) {
  ensureSheet(ss, SHEET_ANALISIS, ANALISIS_HEADERS);
  ensureSheet(ss, SHEET_LOGS, LOG_HEADERS);
  ensureSheet(ss, SHEET_REVISTAS, REVISTAS_HEADERS);
}

function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  const range = sheet.getRange(1, 1, 1, headers.length);
  const current = range.getValues()[0];
  const needsHeader = current.every((cell) => String(cell || '').trim() === '');
  if (needsHeader) {
    range.setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function appendLog(ss, action, user, detail) {
  ss.getSheetByName(SHEET_LOGS).appendRow([
    new Date(),
    clean(action),
    clean(user),
    clean(detail),
    '2026-07-03'
  ]);
}

function getSpreadsheet() {
  if (!SPREADSHEET_ID) {
    throw new Error('Configurar SPREADSHEET_ID antes de usar el backend.');
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function validateAnalysisPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Payload invalido.');
  if (String(payload.titulo || '').length > 400) throw new Error('Titulo demasiado largo.');
  if (String(payload.archivo || '').length > 260) throw new Error('Nombre de archivo demasiado largo.');
  if (payload.textoCompleto) throw new Error('No enviar texto completo del manuscrito al backend.');
}

function clean(value) {
  return String(value == null ? '' : value).replace(/[\r\n\t]/g, ' ').trim();
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
