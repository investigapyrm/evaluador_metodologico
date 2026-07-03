(function () {
  "use strict";

  const AUDIT_KEY = "decena_evaluador_metodologico_audit_v1";
  const TRAINING_KEY = "decena_evaluador_metodologico_training_v1";
  const SESSION_KEY = "decena_evaluador_metodologico_session_v1";
  const GAS_ENDPOINT = (window.RECOMENDADOR_CONFIG && window.RECOMENDADOR_CONFIG.gasEndpoint) || "";
  const AI_DEFAULTS = {
    endpoint: "http://localhost:11434/api/chat",
    model: "qwen3:8b",
    maxChars: 12000,
    probeTimeoutMs: 7000,
    requestTimeoutMs: 120000
  };
  const PDF_TEXT_MAX_PAGES = 30;
  const OCR_MAX_PAGES = 10;
  const OCR_MIN_TEXT_CHARS = 900;
  const OCR_MIN_CHARS_PER_PAGE = 70;
  const OCR_RENDER_SCALE = 1.7;
  const OCR_LANGUAGES = "spa+eng+por";

  const state = {
    user: null,
    fileName: "",
    extractedText: "",
    extraction: null,
    profile: null,
    ranking: [],
    aiReview: null,
    expertReview: null
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    $("#journalCount").textContent = `${window.REVISTAS_DB.length} revistas`;
    $("#methodologyCount").textContent = `${METHODOLOGY_CRITERIA.length} criterios`;
    populateJournalSelect();
    bindEvents();
    restoreSession();
    renderAuditLog();
    initAiControls();
    renderTrainingCount();
    registerServiceWorker();
    refreshIcons();
  }

  function bindEvents() {
    $("#loginForm").addEventListener("submit", onLogin);
    $("#logoutBtn").addEventListener("click", logout);
    $("#fileInput").addEventListener("change", onFileChange);
    $("#analyzeBtn").addEventListener("click", analyzeCurrentText);
    $("#clearBtn").addEventListener("click", clearArticle);
    $("#journalSelect").addEventListener("change", () => renderJournalDetail($("#journalSelect").value));
    $("#exportJsonBtn").addEventListener("click", exportAuditJson);
    $("#exportCsvBtn").addEventListener("click", exportAuditCsv);
    $("#clearAuditBtn").addEventListener("click", clearAuditLog);
    $("#exportExpertReportBtn").addEventListener("click", exportExpertReport);
    $("#buildAiPromptBtn").addEventListener("click", buildAiPromptForCurrentProfile);
    $("#testAiBtn").addEventListener("click", testAiEndpoint);
    $("#copyAiPromptBtn").addEventListener("click", copyAiPrompt);
    $("#runAiBtn").addEventListener("click", runAiReview);
    $("#importAiResponseBtn").addEventListener("click", importAiResponse);
    $("#clearAiBtn").addEventListener("click", clearAiReview);
    $("#saveTrainingBtn").addEventListener("click", saveTrainingCase);
    $("#exportTrainingJsonBtn").addEventListener("click", exportTrainingJson);
    $("#exportTrainingCsvBtn").addEventListener("click", exportTrainingCsv);
    $("#topicWeight").addEventListener("input", rerankIfReady);
    $("#formatWeight").addEventListener("input", rerankIfReady);

    $$(".tab-btn").forEach((button) => {
      button.addEventListener("click", () => activateTab(button.dataset.tab));
    });
  }

  function onLogin(event) {
    event.preventDefault();
    const name = $("#loginName").value.trim();
    const role = $("#loginRole").value;
    const code = $("#loginCode").value.trim();
    if (!name || code.length < 4) {
      setStatus("Complete responsable y codigo de sesion.");
      return;
    }
    state.user = { name, role, loginAt: new Date().toISOString() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(state.user));
    showApp();
  }

  function restoreSession() {
    try {
      const saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (saved && saved.name && saved.role) {
        state.user = saved;
        showApp();
      }
    } catch (error) {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  function showApp() {
    $("#loginView").hidden = true;
    $("#appView").hidden = false;
    $("#sessionName").textContent = state.user.name;
    $("#sessionRole").textContent = roleLabel(state.user.role);
    $("#weightBox").hidden = state.user.role === "investigador";
    renderJournalDetail($("#journalSelect").value || window.REVISTAS_DB[0].id);
    refreshIcons();
  }

  function initAiControls() {
    const aiConfig = (window.RECOMENDADOR_CONFIG && window.RECOMENDADOR_CONFIG.ai) || {};
    $("#aiEndpoint").value = aiConfig.endpoint || AI_DEFAULTS.endpoint;
    $("#aiModel").value = aiConfig.model || AI_DEFAULTS.model;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    state.user = null;
    $("#appView").hidden = true;
    $("#loginView").hidden = false;
    $("#loginCode").value = "";
    refreshIcons();
  }

  function roleLabel(role) {
    const labels = {
      investigador: "Investigador",
      editor: "Editor academico",
      admin: "Administrador"
    };
    return labels[role] || role;
  }

  async function onFileChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    state.fileName = file.name;
    setFileState("leyendo", "warn");
    setStatus("Extrayendo texto");
    try {
      const extraction = await extractFileText(file);
      state.extractedText = extraction.text;
      state.extraction = extraction;
      $("#manualText").value = extraction.text;
      setFileState(extraction.ocrUsed ? "OCR aplicado" : file.name, "ready");
      setStatus(extractionStatusText(extraction));
    } catch (error) {
      console.error(error);
      state.extraction = null;
      setFileState("requiere texto manual", "warn");
      setStatus("No se pudo extraer el archivo");
      $("#manualText").value = "";
      alert("No se pudo extraer el texto. Si el archivo es escaneado, verifique conexion para cargar OCR o pegue el resumen/manuscrito en el cuadro de texto.");
    }
  }

  async function extractFileText(file) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".pdf") || file.type === "application/pdf") {
      return extractPdf(file);
    }
    if (lower.endsWith(".docx") || file.type.includes("wordprocessingml")) {
      return extractDocx(file);
    }
    if (file.type.startsWith("image/") || /\.(png|jpe?g|tiff?|bmp|webp)$/i.test(lower)) {
      return extractImageWithOcr(file);
    }
    const text = await file.text();
    return createExtractionResult({
      text,
      method: "archivo_texto",
      source: "text",
      warnings: text.trim().length < 80 ? ["El archivo textual contiene poco texto util para juzgamiento metodologico."] : []
    });
  }

  async function extractPdf(file) {
    if (!window.pdfjsLib) throw new Error("PDF.js no disponible");
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    const buffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
    const pages = [];
    const maxPages = Math.min(pdf.numPages, PDF_TEXT_MAX_PAGES);
    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(" "));
      if (typeof page.cleanup === "function") page.cleanup();
    }
    const embeddedText = pages.join("\n\n");
    const diagnostics = pdfTextDiagnostics(embeddedText, pdf.numPages, maxPages);
    const warnings = [...diagnostics.warnings];

    if (!shouldRunPdfOcr(diagnostics)) {
      return createExtractionResult({
        text: embeddedText,
        method: "pdf_texto",
        source: "pdf",
        pageCount: pdf.numPages,
        pagesRead: maxPages,
        warnings
      });
    }

    if (!window.Tesseract || typeof window.Tesseract.recognize !== "function") {
      if (embeddedText.trim().length >= 80) {
        warnings.push("El PDF parece tener poca capa textual, pero Tesseract.js no esta disponible para OCR. El analisis usa solo el texto embebido.");
        return createExtractionResult({
          text: embeddedText,
          method: "pdf_texto_bajo",
          source: "pdf",
          pageCount: pdf.numPages,
          pagesRead: maxPages,
          warnings
        });
      }
      throw new Error("El PDF parece escaneado y Tesseract.js no esta disponible para OCR.");
    }

    setStatus("PDF posiblemente escaneado: iniciando OCR");
    const ocr = await extractPdfWithOcr(pdf, Math.min(pdf.numPages, OCR_MAX_PAGES));
    warnings.push(...ocr.warnings);
    if (pdf.numPages > OCR_MAX_PAGES) {
      warnings.push(`OCR limitado a las primeras ${OCR_MAX_PAGES} paginas para mantener rendimiento en navegador.`);
    }
    return createExtractionResult({
      text: mergeExtractionText(embeddedText, ocr.text),
      method: embeddedText.trim().length >= 80 ? "pdf_texto_mas_ocr" : "ocr_pdf",
      source: "pdf",
      pageCount: pdf.numPages,
      pagesRead: maxPages,
      ocrUsed: true,
      ocrPages: ocr.pages,
      ocrConfidence: ocr.confidence,
      warnings
    });
  }

  async function extractDocx(file) {
    if (!window.mammoth) throw new Error("Mammoth no disponible");
    const buffer = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer: buffer });
    return createExtractionResult({
      text: result.value || "",
      method: "docx_texto",
      source: "docx",
      warnings: result.messages && result.messages.length ? [`Mammoth reporto ${result.messages.length} advertencias al leer DOCX.`] : []
    });
  }

  async function extractImageWithOcr(file) {
    if (!window.Tesseract || typeof window.Tesseract.recognize !== "function") {
      throw new Error("Tesseract.js no disponible para OCR de imagen.");
    }
    setStatus("Aplicando OCR a imagen");
    const ocr = await runTesseractOcr(file, "OCR imagen");
    return createExtractionResult({
      text: ocr.text,
      method: "ocr_imagen",
      source: "image",
      pageCount: 1,
      pagesRead: 1,
      ocrUsed: true,
      ocrPages: 1,
      ocrConfidence: ocr.confidence,
      warnings: ocr.text.trim().length < 80 ? ["El OCR de imagen recupero poco texto; el juzgamiento puede ser inestable."] : []
    });
  }

  async function extractPdfWithOcr(pdf, maxPages) {
    const texts = [];
    const confidences = [];
    const warnings = [];

    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: OCR_RENDER_SCALE });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("No se pudo crear contexto canvas para OCR.");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      await page.render({ canvasContext: context, viewport }).promise;
      const ocr = await runTesseractOcr(canvas, `OCR pagina ${pageNumber}/${maxPages}`);
      if (ocr.text.trim()) texts.push(`--- Pagina ${pageNumber} OCR ---\n${ocr.text.trim()}`);
      if (Number.isFinite(ocr.confidence)) confidences.push(ocr.confidence);
      if (typeof page.cleanup === "function") page.cleanup();
      canvas.width = 0;
      canvas.height = 0;
    }

    const confidence = confidences.length
      ? Math.round(confidences.reduce((sum, value) => sum + value, 0) / confidences.length)
      : null;
    if (!texts.join(" ").trim()) warnings.push("El OCR no recupero texto suficiente desde las paginas renderizadas.");
    if (Number.isFinite(confidence) && confidence < 55) warnings.push("La confianza promedio del OCR es baja; conviene revisar manualmente el texto extraido.");

    return {
      text: texts.join("\n\n"),
      pages: maxPages,
      confidence,
      warnings
    };
  }

  async function runTesseractOcr(source, label) {
    const result = await window.Tesseract.recognize(source, OCR_LANGUAGES, {
      logger: (message) => {
        if (!message || !message.status) return;
        if (message.status === "recognizing text" && Number.isFinite(message.progress)) {
          setStatus(`${label}: ${Math.round(message.progress * 100)}%`);
          return;
        }
        if (/loading|initializing|recognizing/.test(message.status)) {
          setStatus(`${label}: ${message.status}`);
        }
      }
    });
    return {
      text: result && result.data && result.data.text ? result.data.text : "",
      confidence: result && result.data && Number.isFinite(result.data.confidence) ? result.data.confidence : null
    };
  }

  function pdfTextDiagnostics(text, pageCount, pagesRead) {
    const compactText = String(text || "").replace(/\s+/g, "");
    const chars = compactText.length;
    const charsPerPage = Math.round(chars / Math.max(1, pagesRead));
    const lowTextLayer = isLowPdfTextLayer(chars, charsPerPage, pagesRead);
    const warnings = [];
    if (pageCount > PDF_TEXT_MAX_PAGES) warnings.push(`Lectura textual limitada a ${PDF_TEXT_MAX_PAGES} paginas de ${pageCount}.`);
    if (lowTextLayer) {
      warnings.push("La capa textual del PDF es baja o ausente; se intenta OCR si esta disponible.");
    }
    return { chars, charsPerPage, pageCount, pagesRead, lowTextLayer, warnings };
  }

  function shouldRunPdfOcr(diagnostics) {
    return diagnostics.lowTextLayer;
  }

  function isLowPdfTextLayer(chars, charsPerPage, pagesRead) {
    const almostEmpty = chars < 160;
    const multiPageSparse = pagesRead >= 3 && chars < OCR_MIN_TEXT_CHARS;
    const pageDensityLow = charsPerPage < OCR_MIN_CHARS_PER_PAGE;
    return almostEmpty || multiPageSparse || pageDensityLow;
  }

  function mergeExtractionText(nativeText, ocrText) {
    const nativeClean = String(nativeText || "").trim();
    const ocrClean = String(ocrText || "").trim();
    if (!nativeClean) return ocrClean;
    if (!ocrClean) return nativeClean;
    return `${nativeClean}\n\n--- TEXTO OCR COMPLEMENTARIO ---\n\n${ocrClean}`;
  }

  function createExtractionResult(options) {
    const text = cleanExtractedText(options.text);
    return {
      text,
      method: options.method || "desconocido",
      source: options.source || "unknown",
      pageCount: Number(options.pageCount || 0),
      pagesRead: Number(options.pagesRead || 0),
      ocrUsed: Boolean(options.ocrUsed),
      ocrPages: Number(options.ocrPages || 0),
      ocrConfidence: Number.isFinite(options.ocrConfidence) ? Math.round(options.ocrConfidence) : null,
      warnings: Array.isArray(options.warnings) ? options.warnings.filter(Boolean) : []
    };
  }

  function cleanExtractedText(text) {
    return String(text || "")
      .replace(/\u0000/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{4,}/g, "\n\n\n")
      .trim();
  }

  function extractionStatusText(extraction) {
    if (!extraction) return "Sin extraccion";
    if (extraction.ocrUsed) {
      const confidence = Number.isFinite(extraction.ocrConfidence) ? `, confianza ${extraction.ocrConfidence}%` : "";
      return `Texto extraido con OCR (${extraction.ocrPages} pag.${confidence})`;
    }
    if (extraction.method === "pdf_texto") return "Texto PDF extraido";
    if (extraction.method === "docx_texto") return "Texto DOCX extraido";
    return "Texto extraido";
  }

  function summarizeExtraction(extraction) {
    if (!extraction) return null;
    return {
      method: extraction.method,
      source: extraction.source,
      pageCount: extraction.pageCount,
      pagesRead: extraction.pagesRead,
      ocrUsed: extraction.ocrUsed,
      ocrPages: extraction.ocrPages,
      ocrConfidence: extraction.ocrConfidence,
      warnings: extraction.warnings.slice(0, 6)
    };
  }

  function resolveCurrentExtraction(text) {
    if (state.extraction && state.extraction.text === text) return state.extraction;
    if (state.extraction) {
      return createExtractionResult({
        text,
        method: state.extraction.ocrUsed ? "ocr_editado_manual" : "texto_editado_manual",
        source: state.extraction.source,
        pageCount: state.extraction.pageCount,
        pagesRead: state.extraction.pagesRead,
        ocrUsed: state.extraction.ocrUsed,
        ocrPages: state.extraction.ocrPages,
        ocrConfidence: state.extraction.ocrConfidence,
        warnings: [...state.extraction.warnings, "El texto extraido fue editado manualmente antes del analisis."]
      });
    }
    return createExtractionResult({
      text,
      method: "texto_manual",
      source: "manual"
    });
  }

  function analyzeCurrentText() {
    const text = ($("#manualText").value || "").trim();
    if (text.length < 80) {
      setStatus("Texto insuficiente");
      alert("El texto es muy corto para evaluar el manuscrito. Pegue al menos el titulo, resumen, palabras clave y una parte de metodologia/resultados.");
      return;
    }
    state.extractedText = text;
    state.extraction = resolveCurrentExtraction(text);
    state.profile = buildArticleProfile(text, state.extraction);
    state.expertReview = state.profile.expertReview;
    state.ranking = rankJournals(state.profile);
    state.aiReview = null;
    renderProfile(state.profile);
    renderRanking(state.ranking);
    renderAiReview(null);
    renderJournalDetail(state.ranking[0].journal.id);
    saveAuditEntry();
    renderAuditLog();
    setStatus("Evaluacion generada");
    activateTab("tabMetodologia");
  }

  function clearArticle() {
    state.fileName = "";
    state.extractedText = "";
    state.extraction = null;
    state.profile = null;
    state.ranking = [];
    state.aiReview = null;
    state.expertReview = null;
    $("#fileInput").value = "";
    $("#manualText").value = "";
    $("#aiPrompt").value = "";
    $("#aiResponse").value = "";
    setFileState("pendiente", "");
    setStatus("Sin analisis");
    renderProfile(null);
    renderMethodology(null);
    renderExpertReview(null);
    renderAiReview(null);
    renderRanking([]);
  }

  function buildArticleProfile(text, extraction) {
    const normalized = normalize(text);
    const words = tokenize(text);
    const title = extractTitle(text);
    const abstract = extractAbstract(text);
    const keywords = extractKeywords(text);
    const language = detectLanguage(normalized);
    const topics = detectSignals(normalized, TOPIC_PATTERNS);
    const methods = detectSignals(normalized, METHOD_PATTERNS);
    const intent = inferArticleIntent(normalized, topics, methods);
    const sections = detectSections(normalized);
    const referencesCount = estimateReferences(text);
    const readiness = calculateReadiness({ title, abstract, keywords, sections, referencesCount, normalized });
    const profile = {
      title,
      abstract,
      keywords,
      language,
      wordCount: words.length,
      charCount: text.length,
      topics,
      methods,
      intent,
      sections,
      referencesCount,
      extraction: summarizeExtraction(extraction),
      hasData: /datos|data set|dataset|base de datos|replicacion|replication|codigo|code|github|osf|dataverse/.test(normalized),
      hasEthics: /etica|comite de etica|consentimiento|irb|conflicto de interes|financiamiento|funding/.test(normalized),
      hasAI: /inteligencia artificial|ia generativa|chatgpt|openai|gemini|claude|large language model/.test(normalized),
      readiness,
      methodology: null,
      expertReview: null
    };
    profile.methodology = evaluateMethodology(profile, text, normalized);
    profile.expertReview = evaluateExpertReview(profile, text, normalized);
    return profile;
  }

  const TOPIC_PATTERNS = {
    "metodologia": ["metodolog", "muestreo", "inferenc", "generalizacion", "validez", "sesgo", "replicab", "cobertura", "medicion", "error de muestreo", "errores de muestreo"],
    "estadistica": ["estadistica", "probabilidad", "estimacion", "estimador", "varianza", "error estandar", "intervalo de confianza", "muestra probabilistica"],
    "ciencia politica": ["ciencia politica", "partido", "eleccion", "democracia", "institucion", "parlamento", "gobierno", "vot"],
    "sociologia": ["sociolog", "estratificacion", "desigualdad", "clase social", "movimiento social", "accion colectiva"],
    "politicas publicas": ["politica publica", "policy", "evaluacion", "programa", "estado", "capacidades estatales"],
    "opinion publica": ["opinion publica", "encuesta", "survey", "comportamiento politico", "actitudes", "percepcion"],
    "relaciones internacionales": ["relaciones internacionales", "politica exterior", "internacional", "comparada", "global"],
    "epistemologia": ["epistemolog", "filosofia de la ciencia", "conocimiento cientifico", "teoria social"],
    "ciencia abierta": ["ciencia abierta", "open science", "datos abiertos", "codigo abierto", "reproducibilidad", "transparencia"]
  };

  const METHOD_PATTERNS = {
    "cuantitativo": ["cuantitativ", "regresion", "modelo", "estadistic", "intervalo de confianza", "p-valor", "muestra", "n="],
    "muestreo": ["muestreo", "sampling", "muestra probabilistica", "muestra no probabilistica", "representatividad", "marco muestral", "seleccion muestral"],
    "estadistico": ["estadistico", "estimador", "varianza", "error estandar", "probabilidad", "intervalo de confianza", "cobertura"],
    "cualitativo": ["cualitativ", "entrevista", "etnograf", "analisis de contenido", "codificacion", "grupo focal"],
    "comparado": ["comparad", "cross-national", "regional", "america latina", "sudamerica", "casos"],
    "revision": ["revision", "estado del arte", "literatura", "scoping", "sistematica", "bibliograf"],
    "metodologico": ["metodolog", "procedimiento", "validez", "confiabilidad", "sesgo", "limitacion"],
    "replicacion": ["replicacion", "replication", "reproducibilidad", "codigo", "github", "dataverse", "osf"]
  };

  const METHODOLOGY_CRITERIA = [
    {
      id: "objetivo",
      label: "Pregunta u objetivo explicito",
      weight: 9,
      terms: ["objetivo", "pregunta de investigacion", "aim", "objective", "proposito", "hipotesis"],
      support: (profile) => profile.abstract !== "Resumen no detectado" ? 1 : 0,
      recommendation: "Formular una pregunta u objetivo explicito al inicio del manuscrito."
    },
    {
      id: "diseno",
      label: "Diseno o enfoque metodologico identificable",
      weight: 10,
      terms: ["diseno", "diseño", "metodo", "metodologia", "method", "estudio", "analisis", "revision", "simulacion"],
      support: (profile) => profile.sections.methodology ? 1 : 0,
      recommendation: "Nombrar el diseno o enfoque metodologico y justificar por que es adecuado."
    },
    {
      id: "poblacion_muestra",
      label: "Poblacion, universo o muestra descrita",
      weight: 11,
      terms: ["poblacion", "universo", "muestra", "participantes", "observaciones", "casos", "corpus", "dataset", "base de datos"],
      recommendation: "Describir poblacion, universo, corpus o muestra, incluyendo criterios de inclusion/exclusion."
    },
    {
      id: "muestreo",
      label: "Procedimiento de muestreo o seleccion documentado",
      weight: 12,
      terms: ["muestreo", "muestra probabilistica", "muestra no probabilistica", "conveniencia", "aleator", "intencional", "bola de nieve", "criterios de inclusion", "criterios de exclusion", "seleccion"],
      recommendation: "Explicar el procedimiento de muestreo o seleccion y sus consecuencias inferenciales."
    },
    {
      id: "variables",
      label: "Variables, indicadores o dimensiones operacionales",
      weight: 9,
      terms: ["variable", "indicador", "dimension", "categoria", "codificacion", "operacional", "medicion", "escala", "instrumento"],
      recommendation: "Definir variables, indicadores, categorias o dimensiones operacionales."
    },
    {
      id: "analisis",
      label: "Procedimiento de analisis suficientemente trazable",
      weight: 11,
      terms: ["analisis", "modelo", "regresion", "estimacion", "prueba", "estadistic", "intervalo", "p-valor", "codificacion", "matriz", "script", "software", "software r", "lenguaje r", "python", "stata", "spss"],
      recommendation: "Hacer trazable el procedimiento de analisis: software, scripts, modelos, supuestos y salidas clave."
    },
    {
      id: "alcance_inferencia",
      label: "Alcance de inferencia o generalizacion delimitado",
      weight: 12,
      terms: ["inferencia", "generalizacion", "extrapol", "validez externa", "representatividad", "alcance", "limitacion", "limites", "cautela", "no probabilistica"],
      recommendation: "Delimitar que poblacion o fenomeno puede inferirse y que generalizaciones no son justificables."
    },
    {
      id: "coherencia",
      label: "Coherencia entre resultados, discusion y conclusiones",
      weight: 8,
      terms: ["resultados", "discusion", "conclusion", "conclusiones", "consideraciones finales"],
      support: (profile) => {
        let value = 0;
        if (profile.sections.results) value += 1;
        if (profile.sections.discussion || profile.sections.conclusion) value += 1;
        return value;
      },
      recommendation: "Revisar que resultados, discusion y conclusiones sostengan el mismo alcance argumental."
    },
    {
      id: "datos_codigo",
      label: "Datos, codigo o replicabilidad declarados",
      weight: 8,
      terms: ["datos", "dataset", "base de datos", "replicacion", "codigo", "github", "osf", "dataverse"],
      support: (profile) => profile.hasData ? 1 : 0,
      recommendation: "Agregar disponibilidad de datos/codigo o justificar por que no corresponde."
    },
    {
      id: "declaraciones",
      label: "Declaraciones editoriales basicas",
      weight: 5,
      terms: ["etica", "comite de etica", "consentimiento", "conflicto de interes", "financiamiento", "funding", "uso de ia", "inteligencia artificial"],
      support: (profile) => profile.hasEthics || profile.hasAI ? 1 : 0,
      recommendation: "Preparar declaraciones de etica, financiamiento, conflictos de interes y uso de IA cuando aplique."
    },
    {
      id: "referencias",
      label: "Referencias o bibliografia identificables",
      weight: 5,
      terms: ["referencias", "references", "bibliografia"],
      support: (profile) => profile.sections.references || profile.referencesCount > 6 ? 1 : 0,
      recommendation: "Verificar seccion de referencias y correspondencia entre citas y bibliografia."
    }
  ];

  const STUDY_TYPE_PATTERNS = {
    sampling_survey: {
      label: "Muestreo, encuesta o error de muestreo",
      terms: ["muestreo", "sampling", "encuesta", "survey", "muestra", "marco muestral", "diseno muestral", "error de muestreo", "errores de muestreo", "margen de error", "representatividad", "estrato", "conglomerado", "ponderador", "no respuesta"]
    },
    quantitative: {
      label: "Cuantitativo/estadistico",
      terms: ["cuantitativo", "regresion", "modelo estadistico", "estimacion", "p-valor", "intervalo de confianza", "varianza", "error estandar", "variable dependiente", "variable independiente", "n="]
    },
    qualitative: {
      label: "Cualitativo",
      terms: ["cualitativo", "entrevista", "grupo focal", "etnografia", "codificacion", "analisis de contenido", "saturacion", "triangulacion", "categorias emergentes", "corpus"]
    },
    review: {
      label: "Revision de literatura",
      terms: ["revision sistematica", "scoping review", "estado del arte", "revision de literatura", "busqueda bibliografica", "criterios de inclusion", "criterios de exclusion", "prisma", "bases de datos", "screening"]
    },
    simulation: {
      label: "Simulacion o experimento computacional",
      terms: ["simulacion", "monte carlo", "escenario", "parametros", "algoritmo", "replicaciones", "sensibilidad", "datos sinteticos", "experimento computacional"]
    },
    methodological: {
      label: "Metodologico/conceptual",
      terms: ["metodologico", "metodologia", "validez", "sesgo", "reproducibilidad", "replicabilidad", "medicion", "inferencia", "procedimiento", "protocolo", "calibracion"]
    }
  };

  const EXPERT_RUBRICS = {
    sampling_survey: {
      label: "Rubrica para muestreo, encuestas y errores de muestreo",
      criteria: [
        expertCriterion("universo_marco", "Universo y marco muestral definidos", 12, ["universo", "poblacion objetivo", "marco muestral", "cobertura", "unidad de analisis"], "Definir universo, poblacion objetivo, marco muestral y cobertura efectiva.", true),
        expertCriterion("diseno_muestral", "Diseno muestral documentado", 13, ["diseno muestral", "muestreo probabilistico", "muestreo estratificado", "conglomerado", "aleatorio", "sampling design"], "Nombrar y justificar el diseno muestral usado.", true),
        expertCriterion("seleccion_unidades", "Seleccion de unidades trazable", 10, ["seleccion", "unidades", "etapas", "probabilidad de seleccion", "criterios de inclusion", "criterios de exclusion"], "Explicar como se seleccionaron unidades, casos o respondentes."),
        expertCriterion("tamano_muestra", "Tamano muestral y precision", 10, ["tamano de muestra", "n=", "muestra efectiva", "precision", "potencia", "margen de error"], "Justificar tamano muestral o precision esperada."),
        expertCriterion("error_varianza", "Error de muestreo, varianza o incertidumbre", 14, ["error de muestreo", "errores de muestreo", "varianza", "error estandar", "intervalo de confianza", "deff", "efecto de diseno"], "Cuantificar o discutir error de muestreo, varianza, DEFF o incertidumbre.", true),
        expertCriterion("ponderacion_no_respuesta", "Ponderacion, no respuesta y sesgos", 10, ["ponderador", "ponderacion", "peso muestral", "no respuesta", "sesgo de seleccion", "sesgo de cobertura", "ajuste"], "Documentar ponderaciones, no respuesta y sesgos de cobertura/seleccion."),
        expertCriterion("alcance_inferencia", "Alcance inferencial delimitado", 13, ["inferencia", "representatividad", "generalizacion", "validez externa", "extrapolacion", "limitaciones"], "Delimitar a que poblacion se puede inferir y que no se puede generalizar.", true),
        expertCriterion("instrumento_campo", "Instrumento o fuente de datos", 8, ["cuestionario", "instrumento", "trabajo de campo", "base de datos", "fuente de datos", "operativo"], "Describir instrumento, fuente o operativo que produjo los datos."),
        expertCriterion("replicabilidad", "Datos, codigo o documentacion replicable", 10, ["replicacion", "codigo", "datos", "github", "osf", "dataverse", "anexo", "microdatos"], "Preparar datos, codigo o anexo metodologico para verificar calculos.")
      ]
    },
    quantitative: {
      label: "Rubrica para estudios cuantitativos/estadisticos",
      criteria: [
        expertCriterion("datos_muestra", "Datos y muestra descritos", 12, ["datos", "dataset", "base de datos", "muestra", "observaciones", "n="], "Describir origen de datos, muestra y periodo de analisis.", true),
        expertCriterion("variables", "Variables operacionalizadas", 12, ["variable", "indicador", "operacionalizacion", "medicion", "escala"], "Definir variables, indicadores, unidades y escalas.", true),
        expertCriterion("modelo", "Modelo o estimacion especificada", 14, ["modelo", "regresion", "estimacion", "ecuacion", "coeficiente", "efecto"], "Especificar modelo, estimador y ecuacion o procedimiento de estimacion.", true),
        expertCriterion("supuestos", "Supuestos y diagnosticos", 11, ["supuesto", "diagnostico", "colinealidad", "heterocedasticidad", "residuo", "normalidad"], "Explicitar supuestos y pruebas diagnosticas relevantes."),
        expertCriterion("incertidumbre", "Incertidumbre reportada", 12, ["intervalo de confianza", "error estandar", "p-valor", "significancia", "incertidumbre"], "Reportar incertidumbre, intervalos o errores estandar.", true),
        expertCriterion("sensibilidad", "Robustez o sensibilidad", 11, ["robustez", "sensibilidad", "especificacion alternativa", "validacion", "bootstrap"], "Agregar pruebas de robustez o sensibilidad."),
        expertCriterion("causalidad", "Alcance causal/inferencial prudente", 12, ["causal", "asociacion", "inferencia", "limitacion", "endogeneidad", "confusion"], "Separar descripcion, asociacion, prediccion e inferencia causal."),
        expertCriterion("replicabilidad", "Codigo/datos replicables", 16, ["codigo", "script", "github", "replicacion", "osf", "dataverse", "software", "r ", "python"], "Publicar o preparar codigo y datos necesarios para verificar calculos.")
      ]
    },
    qualitative: {
      label: "Rubrica para estudios cualitativos",
      criteria: [
        expertCriterion("caso_contexto", "Caso y contexto delimitados", 12, ["caso", "contexto", "territorio", "periodo", "escenario"], "Delimitar caso, periodo, contexto y unidad de analisis.", true),
        expertCriterion("seleccion", "Seleccion de participantes/documentos", 12, ["participantes", "entrevistados", "corpus", "seleccion", "muestreo teorico", "criterios"], "Explicar criterios de seleccion de participantes, casos o documentos.", true),
        expertCriterion("instrumento", "Instrumento o guia de recoleccion", 10, ["guia", "entrevista", "protocolo", "observacion", "grupo focal"], "Describir instrumento, guia o protocolo de recoleccion."),
        expertCriterion("codificacion", "Codificacion y analisis trazable", 14, ["codificacion", "categorias", "analisis tematico", "analisis de contenido", "software"], "Documentar codificacion, categorias y procedimiento analitico.", true),
        expertCriterion("saturacion", "Saturacion o suficiencia del corpus", 10, ["saturacion", "suficiencia", "redundancia", "densidad", "corpus"], "Justificar suficiencia del corpus o saturacion."),
        expertCriterion("triangulacion", "Triangulacion o validacion", 10, ["triangulacion", "validacion", "contraste", "member checking", "intercodificador"], "Agregar triangulacion, contraste o validacion."),
        expertCriterion("reflexividad", "Reflexividad y posicionamiento", 9, ["reflexividad", "posicionamiento", "sesgo del investigador", "rol del investigador"], "Explicitar reflexividad y posibles sesgos del investigador."),
        expertCriterion("evidencia", "Evidencia cualitativa suficiente", 13, ["cita", "fragmento", "testimonio", "memo", "extracto"], "Vincular interpretaciones con citas o evidencia documental."),
        expertCriterion("etica", "Etica y consentimiento", 10, ["etica", "consentimiento", "anonimato", "confidencialidad"], "Documentar consentimiento, anonimato y resguardo etico.")
      ]
    },
    review: {
      label: "Rubrica para revisiones de literatura",
      criteria: [
        expertCriterion("pregunta", "Pregunta de revision explicita", 12, ["pregunta de revision", "objetivo", "research question", "alcance"], "Formular pregunta y alcance de la revision.", true),
        expertCriterion("busqueda", "Estrategia de busqueda", 14, ["busqueda", "search string", "palabras clave", "bases de datos", "scopus", "web of science", "scielo"], "Reportar bases, terminos, fechas y filtros de busqueda.", true),
        expertCriterion("criterios", "Criterios de inclusion/exclusion", 13, ["criterios de inclusion", "criterios de exclusion", "inclusion", "exclusion"], "Definir criterios de inclusion y exclusion.", true),
        expertCriterion("cribado", "Proceso de cribado trazable", 10, ["cribado", "screening", "prisma", "diagrama", "seleccion de estudios"], "Documentar cribado, registros removidos y estudios incluidos."),
        expertCriterion("extraccion", "Extraccion de informacion", 11, ["extraccion de datos", "matriz", "codificacion", "ficha"], "Describir como se extrajo y codifico informacion."),
        expertCriterion("calidad", "Evaluacion de calidad/sesgo", 12, ["calidad", "riesgo de sesgo", "appraisal", "evaluacion critica"], "Evaluar calidad o riesgo de sesgo de fuentes."),
        expertCriterion("sintesis", "Metodo de sintesis", 14, ["sintesis", "metaanalisis", "narrativa", "tematica", "bibliometrica"], "Explicar metodo de sintesis de evidencia.", true),
        expertCriterion("replicabilidad", "Protocolo o anexos replicables", 14, ["protocolo", "anexo", "osf", "prisma", "repositorio", "tabla suplementaria"], "Agregar protocolo, anexo o repositorio replicable.")
      ]
    },
    simulation: {
      label: "Rubrica para simulaciones o experimentos computacionales",
      criteria: [
        expertCriterion("objetivo", "Objetivo del modelo/simulacion", 12, ["objetivo", "simulacion", "experimento computacional", "modelo"], "Explicar que evalua la simulacion y por que.", true),
        expertCriterion("supuestos", "Supuestos y parametros", 14, ["supuesto", "parametro", "escenario", "distribucion", "calibracion"], "Documentar supuestos, parametros y distribuciones.", true),
        expertCriterion("algoritmo", "Algoritmo reproducible", 14, ["algoritmo", "pseudocodigo", "codigo", "script", "iteracion"], "Describir algoritmo o publicar codigo.", true),
        expertCriterion("escenarios", "Escenarios comparables", 10, ["escenario", "condicion", "comparacion", "tratamiento"], "Definir escenarios y condiciones comparadas."),
        expertCriterion("validacion", "Validacion del modelo", 12, ["validacion", "benchmark", "datos reales", "calibracion", "verificacion"], "Validar contra datos, benchmarks o casos conocidos."),
        expertCriterion("sensibilidad", "Analisis de sensibilidad", 13, ["sensibilidad", "robustez", "parametro", "incertidumbre"], "Explorar sensibilidad a parametros clave.", true),
        expertCriterion("salidas", "Salidas e incertidumbre", 11, ["resultado", "intervalo", "distribucion", "variabilidad", "incertidumbre"], "Reportar variabilidad e incertidumbre de salidas."),
        expertCriterion("replicabilidad", "Paquete replicable", 14, ["github", "repositorio", "codigo", "datos sinteticos", "semilla"], "Publicar codigo, semilla y configuracion.")
      ]
    },
    methodological: {
      label: "Rubrica para articulos metodologicos",
      criteria: [
        expertCriterion("problema", "Problema metodologico claro", 13, ["problema metodologico", "limitacion", "sesgo", "validez", "error"], "Declarar con precision el problema metodologico que se resuelve.", true),
        expertCriterion("marco", "Marco conceptual/metodologico", 11, ["marco", "teoria", "metodologia", "conceptual", "estado del arte"], "Ubicar el aporte frente a literatura metodologica previa."),
        expertCriterion("procedimiento", "Procedimiento propuesto trazable", 15, ["procedimiento", "protocolo", "algoritmo", "pasos", "metodo propuesto"], "Explicar el procedimiento paso a paso.", true),
        expertCriterion("comparacion", "Comparacion con alternativas", 12, ["comparacion", "alternativa", "baseline", "metodo existente", "contraste"], "Comparar con alternativas o practica usual."),
        expertCriterion("demostracion", "Evidencia, ejemplo o aplicacion", 14, ["ejemplo", "aplicacion", "caso", "datos", "simulacion", "demostracion"], "Mostrar ejemplo verificable o aplicacion empirica.", true),
        expertCriterion("limites", "Limites y condiciones de uso", 12, ["limite", "limitacion", "condicion", "alcance", "no aplica"], "Delimitar condiciones donde el metodo funciona o no."),
        expertCriterion("replicabilidad", "Materiales replicables", 13, ["codigo", "anexo", "repositorio", "replicacion", "datos"], "Agregar materiales para verificar la propuesta."),
        expertCriterion("aplicabilidad", "Implicaciones editoriales o practicas", 10, ["implicacion", "recomendacion", "aplicabilidad", "uso", "practica"], "Explicar como usar el aporte en revision o investigacion.")
      ]
    },
    generic: {
      label: "Rubrica experta general",
      criteria: [
        expertCriterion("objetivo", "Objetivo verificable", 13, ["objetivo", "pregunta", "hipotesis"], "Formular objetivo o pregunta verificable.", true),
        expertCriterion("diseno", "Diseno coherente", 13, ["metodo", "metodologia", "diseno", "enfoque"], "Nombrar el diseno y justificarlo.", true),
        expertCriterion("datos", "Datos/corpus/muestra claros", 13, ["datos", "muestra", "corpus", "casos", "participantes"], "Describir datos, corpus, casos o participantes.", true),
        expertCriterion("analisis", "Analisis trazable", 14, ["analisis", "modelo", "codificacion", "procedimiento", "software"], "Explicar el procedimiento analitico."),
        expertCriterion("inferencia", "Inferencia prudente", 14, ["inferencia", "generalizacion", "alcance", "limitacion"], "Delimitar alcance de inferencia o interpretacion."),
        expertCriterion("coherencia", "Resultados y conclusiones alineados", 12, ["resultados", "discusion", "conclusion"], "Alinear resultados, discusion y conclusiones."),
        expertCriterion("replicabilidad", "Documentacion verificable", 11, ["datos", "codigo", "anexo", "replicacion"], "Agregar documentacion verificable."),
        expertCriterion("editorial", "Requisitos editoriales minimos", 10, ["referencias", "etica", "financiamiento", "conflicto de interes"], "Completar referencias y declaraciones editoriales.")
      ]
    }
  };

  const COHERENCE_COMPONENTS = [
    expertCriterion("objetivo", "Objetivo/pregunta", 1, ["objetivo", "pregunta de investigacion", "hipotesis", "proposito"], "Declarar objetivo o pregunta de forma explicita.", true),
    expertCriterion("datos", "Datos/muestra/corpus", 1, ["datos", "muestra", "corpus", "participantes", "base de datos", "fuente de datos"], "Conectar objetivo con datos, muestra o corpus."),
    expertCriterion("metodo", "Metodo/procedimiento", 1, ["metodo", "metodologia", "procedimiento", "diseno", "analisis"], "Explicar el procedimiento que transforma datos en resultados.", true),
    expertCriterion("resultados", "Resultados", 1, ["resultados", "hallazgos", "estimacion", "evidencia empirica"], "Mostrar resultados directamente vinculados al metodo."),
    expertCriterion("conclusion", "Conclusion/alcance", 1, ["conclusion", "conclusiones", "discusion", "limitacion", "alcance"], "Alinear conclusiones con evidencia y limites."),
    expertCriterion("replicabilidad", "Verificacion", 1, ["replicacion", "codigo", "datos", "anexo", "repositorio"], "Permitir verificar calculos o decisiones analiticas.")
  ];

  function expertCriterion(id, label, weight, terms, recommendation, critical) {
    return { id, label, weight, terms, recommendation, critical: Boolean(critical) };
  }

  function inferArticleIntent(normalized, topics, methods) {
    const methodologicalHits = countMatches(normalized, [
      "muestreo",
      "muestra",
      "sampling",
      "inferencia",
      "inferencial",
      "generalizacion",
      "validez",
      "representatividad",
      "sesgo",
      "cobertura",
      "error estandar",
      "intervalo de confianza",
      "marco muestral",
      "muestra no probabilistica",
      "muestra probabilistica"
    ]);
    const statisticalHits = countMatches(normalized, [
      "estadistica",
      "probabilidad",
      "estimador",
      "varianza",
      "modelo",
      "bayes",
      "p-valor",
      "regresion",
      "intervalo de confianza"
    ]);
    const politicalHits = countMatches(normalized, [
      "ciencia politica",
      "partido",
      "eleccion",
      "democracia",
      "votacion",
      "parlamento",
      "relaciones internacionales",
      "politica comparada"
    ]);
    const opinionHits = countMatches(normalized, [
      "opinion publica",
      "encuesta electoral",
      "comportamiento politico",
      "actitudes politicas"
    ]);
    const socialHits = countMatches(normalized, [
      "sociologia",
      "ciencias sociales",
      "investigacion social",
      "desigualdad",
      "estratificacion"
    ]);
    const disciplinaryAnchors = [];
    if (politicalHits >= 2) disciplinaryAnchors.push("ciencia politica");
    if (opinionHits >= 2) disciplinaryAnchors.push("opinion publica");
    if (socialHits >= 2) disciplinaryAnchors.push("ciencias sociales");
    return {
      methodologicalCore: methodologicalHits >= 2 || (topics.includes("metodologia") && methods.includes("muestreo")),
      statisticalCore: statisticalHits >= 2 || topics.includes("estadistica") || methods.includes("estadistico"),
      methodologicalHits,
      statisticalHits,
      politicalHits,
      opinionHits,
      socialHits,
      disciplinaryAnchors
    };
  }

  function countMatches(normalized, terms) {
    return terms.reduce((sum, term) => sum + (normalized.includes(normalize(term).trim()) ? 1 : 0), 0);
  }

  function evaluateExpertReview(profile, sourceText, normalized) {
    const studyType = classifyStudyType(profile, sourceText, normalized);
    const rubric = EXPERT_RUBRICS[studyType.id] || EXPERT_RUBRICS.generic;
    const criteria = rubric.criteria.map((criterion) => evaluateExpertCriterion(criterion, profile, sourceText, normalized));
    const score = weightedScore(criteria);
    const coherence = buildCoherenceMatrix(profile, sourceText, normalized);
    const coherenceScore = Math.round(coherence.reduce((sum, item) => sum + item.value, 0) / coherence.length * 100);
    const combinedScore = Math.round((score * 0.72) + (coherenceScore * 0.28));
    const criticalGaps = criteria.filter((item) => item.critical && !["cumple", "no aplica"].includes(item.status));
    const coherenceGaps = coherence.filter((item) => !["cumple", "parcial"].includes(item.status));
    const verdict = expertVerdict(combinedScore, criticalGaps.length, coherenceGaps.length);
    const narrative = expertNarrative(studyType, combinedScore, criticalGaps.length, coherenceGaps.length);
    const corrections = buildExpertCorrections(criteria, coherence, profile, studyType);
    const journalGuidance = buildExpertJournalGuidance(profile, studyType, combinedScore, criticalGaps);
    const evidenceCount = criteria.reduce((sum, item) => sum + item.evidence.length, 0) +
      coherence.reduce((sum, item) => sum + item.evidence.length, 0);

    return {
      timestamp: new Date().toISOString(),
      studyType,
      rubricName: rubric.label,
      score: combinedScore,
      rubricScore: score,
      coherenceScore,
      verdict,
      narrative,
      confidence: expertConfidence(studyType.confidence, criteria, coherence),
      criteria,
      coherence,
      corrections,
      journalGuidance,
      evidenceCount,
      criticalGaps: criticalGaps.length,
      coherenceGaps: coherenceGaps.length
    };
  }

  function classifyStudyType(profile, sourceText, normalized) {
    const scores = Object.entries(STUDY_TYPE_PATTERNS).map(([id, config]) => {
      let score = countMatches(normalized, config.terms);
      if (id === "sampling_survey" && /error(?:es)? de muestreo|marco muestral|margen de error/.test(normalized)) score += 3;
      if (id === "quantitative" && profile.methods.includes("cuantitativo")) score += 2;
      if (id === "methodological" && profile.intent.methodologicalCore) score += 2;
      if (id === "sampling_survey" && profile.methods.includes("muestreo")) score += 2;
      return { id, label: config.label, score };
    }).sort((a, b) => b.score - a.score);

    const quantitative = scores.find((item) => item.id === "quantitative");
    const qualitative = scores.find((item) => item.id === "qualitative");
    const mixed = quantitative && qualitative && quantitative.score >= 3 && qualitative.score >= 3;
    const primary = mixed
      ? { id: "generic", label: "Mixto o multimetodo", score: Math.min(quantitative.score, qualitative.score) }
      : (scores[0] && scores[0].score > 0 ? scores[0] : { id: "generic", label: "No clasificado con seguridad", score: 0 });
    const second = scores.find((item) => item.id !== primary.id);
    const gap = second ? primary.score - second.score : primary.score;
    const confidence = primary.score >= 5 && gap >= 2 ? "alta" : primary.score >= 3 ? "media" : "baja";
    const evidenceTerms = primary.id === "generic"
      ? ["metodo", "metodologia", "datos", "muestra", "analisis"]
      : STUDY_TYPE_PATTERNS[primary.id].terms;

    return {
      id: primary.id,
      label: primary.label,
      confidence,
      score: primary.score,
      secondary: second && second.score > 0 ? second.label : "",
      scores,
      evidence: extractEvidenceSnippets(sourceText, evidenceTerms, 3)
    };
  }

  function evaluateExpertCriterion(criterion, profile, sourceText, normalized) {
    const evidence = extractEvidenceSnippets(sourceText, criterion.terms || [], 2);
    const hits = countMatches(normalized, criterion.terms || []);
    let status = "no verificable";
    let confidence = "no evaluable";
    let value = 0;

    if (evidence.length >= 2 || hits >= 3) {
      status = "cumple";
      confidence = evidence.length ? "alta" : "media";
      value = 1;
    } else if (evidence.length === 1 || hits >= 1) {
      status = "parcial";
      confidence = evidence.length ? "media" : "baja";
      value = 0.5;
    } else if (profile.wordCount >= 1200 && criterion.critical) {
      status = "no verificable";
      confidence = "no evaluable";
    }

    return {
      id: criterion.id,
      label: criterion.label,
      weight: criterion.weight,
      status,
      statusLabel: statusLabel(status),
      confidence,
      value,
      critical: criterion.critical,
      evidence,
      recommendation: criterion.recommendation
    };
  }

  function weightedScore(criteria) {
    const total = criteria.reduce((sum, item) => sum + item.weight, 0) || 1;
    const achieved = criteria.reduce((sum, item) => sum + item.weight * item.value, 0);
    return Math.round((achieved / total) * 100);
  }

  function buildCoherenceMatrix(profile, sourceText, normalized) {
    return COHERENCE_COMPONENTS.map((component) => {
      const item = evaluateExpertCriterion(component, profile, sourceText, normalized);
      if (component.id === "resultados" && profile.sections.results && item.value < 0.5) {
        item.status = "parcial";
        item.statusLabel = statusLabel(item.status);
        item.confidence = "baja";
        item.value = 0.5;
      }
      if (component.id === "conclusion" && (profile.sections.discussion || profile.sections.conclusion) && item.value < 0.5) {
        item.status = "parcial";
        item.statusLabel = statusLabel(item.status);
        item.confidence = "baja";
        item.value = 0.5;
      }
      item.gap = coherenceGapText(item);
      return item;
    });
  }

  function coherenceGapText(item) {
    if (item.status === "cumple") return "Evidencia localizada.";
    if (item.status === "parcial") return "Evidencia parcial; conviene hacer mas explicita la conexion.";
    return item.recommendation;
  }

  function expertVerdict(score, criticalGaps, coherenceGaps) {
    if (score >= 82 && criticalGaps === 0 && coherenceGaps <= 1) return "Dictamen experto favorable";
    if (score >= 68 && criticalGaps <= 1) return "Favorable con correcciones metodologicas";
    if (score >= 50) return "Requiere revision metodologica sustantiva";
    return "No recomendable para envio sin reconstruccion metodologica";
  }

  function expertNarrative(studyType, score, criticalGaps, coherenceGaps) {
    const typeText = studyType.label.toLowerCase();
    if (score >= 82 && criticalGaps === 0) {
      return `El manuscrito fue clasificado como ${typeText} y presenta evidencia suficiente para una revision metodologica avanzada.`;
    }
    if (score >= 68) {
      return `El manuscrito parece ${typeText}, pero todavia debe cerrar brechas criticas o de coherencia antes del envio.`;
    }
    if (score >= 50) {
      return `El manuscrito tiene senales de ${typeText}, aunque la evidencia metodologica localizada es incompleta.`;
    }
    return `No hay evidencia suficiente para sostener un dictamen experto robusto como ${typeText}.`;
  }

  function expertConfidence(typeConfidence, criteria, coherence) {
    const evidenceCount = criteria.reduce((sum, item) => sum + item.evidence.length, 0) +
      coherence.reduce((sum, item) => sum + item.evidence.length, 0);
    if (typeConfidence === "alta" && evidenceCount >= 8) return "alta";
    if (typeConfidence !== "baja" && evidenceCount >= 4) return "media";
    return "baja";
  }

  function buildExpertCorrections(criteria, coherence, profile, studyType) {
    const corrections = [];
    criteria
      .filter((item) => item.status !== "cumple")
      .sort((a, b) => Number(b.critical) - Number(a.critical) || b.weight - a.weight)
      .slice(0, 6)
      .forEach((item) => corrections.push(item.recommendation));
    coherence
      .filter((item) => !["cumple", "parcial"].includes(item.status))
      .slice(0, 3)
      .forEach((item) => corrections.push(item.recommendation));
    if (studyType.id === "sampling_survey" && !profile.hasData) {
      corrections.push("Agregar anexo o paquete minimo para verificar calculos de error, muestra, pesos o intervalos.");
    }
    if (profile.extraction && profile.extraction.ocrUsed) {
      corrections.push("Revisar visualmente el texto OCR antes de usar este dictamen como evidencia final.");
    }
    return unique(corrections).slice(0, 9);
  }

  function buildExpertJournalGuidance(profile, studyType, score, criticalGaps) {
    const guidance = [];
    if (studyType.id === "sampling_survey") {
      guidance.push("Priorizar revistas de metodologia, estadistica aplicada, encuestas, ciencia abierta o investigacion social cuantitativa.");
      guidance.push("Evitar revistas puramente disciplinarias si el manuscrito no demuestra aporte sustantivo a esa disciplina.");
    } else if (studyType.id === "qualitative") {
      guidance.push("Priorizar revistas que acepten evidencia cualitativa y expliciten criterios de transparencia analitica.");
    } else if (studyType.id === "review") {
      guidance.push("Priorizar revistas que acepten revisiones y exigir protocolo, busqueda y matriz de extraccion.");
    } else if (studyType.id === "simulation") {
      guidance.push("Priorizar revistas metodologicas o de estadistica computacional; adjuntar codigo y parametros.");
    } else if (studyType.id === "methodological") {
      guidance.push("Priorizar revistas metodologicas o generalistas con seccion tecnica; mostrar aplicacion verificable.");
    }
    if (score < 68 || criticalGaps.length) {
      guidance.push("No recomendar envio inmediato: primero resolver criterios criticos no verificables.");
    }
    if (profile.intent.disciplinaryAnchors.length) {
      guidance.push(`Hay anclaje disciplinario detectado en ${profile.intent.disciplinaryAnchors.join(", ")}; usarlo solo si el argumento sustantivo esta desarrollado.`);
    }
    return unique(guidance).slice(0, 6);
  }

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  function tokenize(text) {
    return String(text || "").match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]+/g) || [];
  }

  function extractTitle(text) {
    const lines = String(text || "")
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 30);
    const skip = /^(resumen|abstract|resumo|palabras clave|keywords|introduccion|author|autor)/i;
    const candidate = lines.find((line) => line.length >= 12 && line.length <= 180 && !skip.test(line));
    return candidate || "Titulo no detectado";
  }

  function extractAbstract(text) {
    const clean = String(text || "").replace(/\r/g, "\n");
    const match = clean.match(/(?:resumen|abstract|resumo)\s*[:\n]\s*([\s\S]{80,1800}?)(?:palabras clave|keywords|palavras-chave|introducci[oó]n|introduction|1\.)/i);
    if (match) return compact(match[1], 520);
    const firstParagraph = clean.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p.length > 160);
    return firstParagraph ? compact(firstParagraph, 520) : "Resumen no detectado";
  }

  function extractKeywords(text) {
    const match = String(text || "").match(/(?:palabras clave|keywords|palavras-chave)\s*[:\n]\s*([^\n.]{8,260})/i);
    if (!match) return [];
    return match[1]
      .split(/[;,|]/)
      .map((word) => word.trim().replace(/\.$/, ""))
      .filter(Boolean)
      .slice(0, 8);
  }

  function detectLanguage(normalized) {
    const scores = {
      es: scoreTokens(normalized, [" el ", " la ", " los ", " las ", " que ", " para ", " investigacion ", " metodo ", " resultados "]),
      pt: scoreTokens(normalized, [" o ", " a ", " os ", " as ", " que ", " para ", " pesquisa ", " metodo ", " resultados "]),
      en: scoreTokens(normalized, [" the ", " and ", " for ", " research ", " method ", " results ", " paper ", " study "])
    };
    const code = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    const labels = { es: "es", pt: "pt", en: "en" };
    return labels[code];
  }

  function scoreTokens(text, tokens) {
    return tokens.reduce((sum, token) => sum + (text.includes(token) ? 1 : 0), 0);
  }

  function detectSignals(normalized, patterns) {
    return Object.entries(patterns)
      .filter(([, terms]) => terms.some((term) => normalized.includes(normalize(term).trim())))
      .map(([name]) => name);
  }

  function detectSections(normalized) {
    return {
      introduction: /introduccion|introduction|introducao/.test(normalized),
      methodology: /metodologia|methodology|metodos|methods/.test(normalized),
      results: /resultados|results|achados/.test(normalized),
      discussion: /discusion|discussion|discussao/.test(normalized),
      conclusion: /conclusion|conclusiones|consideraciones finales/.test(normalized),
      references: /referencias|references|bibliografia/.test(normalized)
    };
  }

  function estimateReferences(text) {
    const refBlock = String(text || "").split(/referencias|references|bibliografia/i).pop() || "";
    const lines = refBlock.split(/\n/).map((line) => line.trim()).filter((line) => line.length > 25);
    return Math.min(lines.length, 250);
  }

  function calculateReadiness(profile) {
    let score = 0;
    const notes = [];
    if (profile.title && profile.title !== "Titulo no detectado") score += 15;
    else notes.push("Revisar titulo");
    if (profile.abstract && profile.abstract !== "Resumen no detectado") score += 20;
    else notes.push("Agregar resumen detectable");
    if (profile.keywords.length >= 3) score += 15;
    else notes.push("Agregar palabras clave");
    if (profile.sections.introduction) score += 8;
    if (profile.sections.methodology) score += 10;
    if (profile.sections.results || profile.sections.discussion) score += 8;
    if (profile.sections.references || profile.referencesCount > 6) score += 12;
    else notes.push("Revisar referencias");
    if (/orcid/.test(profile.normalized)) score += 4;
    else notes.push("Preparar ORCID");
    if (/conflicto de interes|financiamiento|funding|agradecimientos/.test(profile.normalized)) score += 4;
    else notes.push("Declaraciones editoriales pendientes");
    if (/datos|dataset|codigo|github|osf|dataverse|replicacion/.test(profile.normalized)) score += 4;
    else notes.push("Datos/codigo no detectados");
    return { score: Math.min(100, score), notes };
  }

  function evaluateMethodology(profile, sourceText, normalized) {
    const evaluated = METHODOLOGY_CRITERIA.map((criterion) => evaluateCriterion(criterion, profile, sourceText, normalized));
    const scorable = evaluated.filter((item) => item.status !== "no aplica");
    const totalWeight = scorable.reduce((sum, item) => sum + item.weight, 0) || 1;
    const achieved = scorable.reduce((sum, item) => sum + (item.weight * item.value), 0);
    const score = Math.round((achieved / totalWeight) * 100);
    const alerts = buildCriticalAlerts(profile, normalized, evaluated);
    const recommendations = buildMethodologyRecommendations(evaluated, alerts, profile);
    const verdict = methodologyVerdict(score, alerts.length);
    const narrative = methodologyNarrative(score, alerts.length);
    const evidenceCount = evaluated.reduce((sum, item) => sum + item.evidence.length, 0);
    const notVerifiableCount = evaluated.filter((item) => item.status === "no verificable").length;
    const lowConfidenceCount = evaluated.filter((item) => ["baja", "no evaluable"].includes(item.confidence)).length;
    return {
      score,
      verdict,
      narrative,
      criteria: evaluated,
      alerts,
      recommendations,
      evidenceCount,
      notVerifiableCount,
      lowConfidenceCount
    };
  }

  function evaluateCriterion(criterion, profile, sourceText, normalized) {
    const evidence = extractEvidenceSnippets(sourceText, criterion.terms || [], 2);
    const support = typeof criterion.support === "function" ? Number(criterion.support(profile, normalized, evidence) || 0) : 0;
    const signalStrength = evidence.length + support;
    const notApplicable = typeof criterion.notApplicable === "function" && criterion.notApplicable(profile, normalized);
    let status = "no verificable";
    let confidence = "no evaluable";
    let value = 0;

    if (notApplicable) {
      status = "no aplica";
      confidence = "alta";
      value = 1;
    } else if (signalStrength >= 2) {
      status = "cumple";
      confidence = evidence.length ? "alta" : "media";
      value = 1;
    } else if (signalStrength === 1) {
      status = "parcial";
      confidence = evidence.length ? "media" : "baja";
      value = 0.5;
    } else if (profile.wordCount >= 1200) {
      status = "no verificable";
      confidence = "no evaluable";
      value = 0;
    }

    return {
      id: criterion.id,
      label: criterion.label,
      weight: criterion.weight,
      status,
      statusLabel: statusLabel(status),
      confidence,
      value,
      passed: status === "cumple",
      evidence,
      recommendation: criterion.recommendation
    };
  }

  function statusLabel(status) {
    const labels = {
      cumple: "Cumple",
      parcial: "Parcial",
      "no cumple": "No cumple",
      "no verificable": "No verificable",
      "no aplica": "No aplica"
    };
    return labels[status] || status;
  }

  function statusClass(status) {
    return String(status || "no verificable").replace(/\s+/g, "-");
  }

  function extractEvidenceSnippets(sourceText, terms, limit) {
    const cleanText = String(sourceText || "").replace(/\s+/g, " ").trim();
    const normalizedText = normalize(cleanText);
    const snippets = [];
    terms.forEach((term) => {
      if (snippets.length >= limit) return;
      const needle = normalize(term).trim();
      if (!needle) return;
      const index = normalizedText.indexOf(needle);
      if (index < 0) return;
      const start = Math.max(0, index - 110);
      const end = Math.min(cleanText.length, index + needle.length + 150);
      const prefix = start > 0 ? "... " : "";
      const suffix = end < cleanText.length ? " ..." : "";
      const snippet = `${prefix}${cleanText.slice(start, end).trim()}${suffix}`;
      if (!snippets.some((item) => item === snippet)) snippets.push(compact(snippet, 320));
    });
    return snippets;
  }

  function buildCriticalAlerts(profile, normalized, evaluated) {
    const missing = new Set(evaluated.filter((item) => !["cumple", "parcial", "no aplica"].includes(item.status)).map((item) => item.id));
    const alerts = [];
    const generalizes = /generaliz|extrapol|representativ|poblacion|universo|sudamerica|america latina|latinoamerica|concluir que/.test(normalized);
    const hasSamplingSignal = /muestreo|muestra|participantes|casos|observaciones|corpus/.test(normalized);
    const hasLimitationSignal = /limitacion|limitaciones|cautela|no probabilistica|sesgo|validez externa|representatividad/.test(normalized);

    if (generalizes && hasSamplingSignal && !hasLimitationSignal) {
      alerts.push("El texto parece generalizar resultados, pero no se detecta una delimitacion clara de limitaciones o representatividad.");
    }
    if (profile.intent.methodologicalCore && missing.has("muestreo")) {
      alerts.push("El manuscrito tiene nucleo metodologico, pero no describe de forma suficiente el procedimiento de muestreo o seleccion.");
    }
    if ((profile.intent.methodologicalCore || profile.intent.statisticalCore) && missing.has("alcance_inferencia")) {
      alerts.push("Falta delimitar el alcance de la inferencia, generalizacion o validez externa.");
    }
    if (missing.has("analisis") && (profile.intent.statisticalCore || profile.methods.includes("cuantitativo"))) {
      alerts.push("Se detecta enfoque cuantitativo/estadistico, pero el procedimiento de analisis no queda suficientemente trazable.");
    }
    if (profile.wordCount > 2500 && missing.has("referencias")) {
      alerts.push("No se detecta seccion de referencias suficiente para un manuscrito academico completo.");
    }
    return unique(alerts);
  }

  function buildMethodologyRecommendations(evaluated, alerts, profile) {
    const missing = new Set(evaluated.filter((item) => !["cumple", "parcial", "no aplica"].includes(item.status)).map((item) => item.id));
    const recommendations = [];
    evaluated.forEach((item) => {
      if (missing.has(item.id) && item.recommendation) recommendations.push(item.recommendation);
    });
    if (!evaluated.some((item) => !["cumple", "no aplica"].includes(item.status)) && !alerts.length) {
      recommendations.push("El manuscrito puede avanzar a revision editorial fina y seleccion de revista compatible.");
    }
    return unique(recommendations).slice(0, 8);
  }

  function methodologyVerdict(score, alertCount) {
    if (score >= 80 && alertCount === 0) return "Robustez metodologica alta";
    if (score >= 68 && alertCount <= 1) return "Robustez razonable con ajustes";
    if (score >= 50) return "Requiere ajustes metodologicos";
    return "Alto riesgo metodologico";
  }

  function methodologyNarrative(score, alertCount) {
    if (score >= 80 && alertCount === 0) {
      return "El manuscrito contiene la mayoria de los elementos minimos para sostener una revision metodologica preliminar.";
    }
    if (score >= 68) {
      return "La estructura metodologica es aprovechable, pero conviene resolver las alertas antes de recomendar envio editorial.";
    }
    if (score >= 50) {
      return "El manuscrito requiere ajustes sustantivos para mejorar trazabilidad, inferencia o documentacion metodologica.";
    }
    return "El texto no deja evidencia suficiente de los requisitos minimos para una evaluacion metodologica robusta.";
  }

  function compact(value, max) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > max ? `${text.slice(0, max - 1)}...` : text;
  }

  function rankJournals(profile) {
    return window.REVISTAS_DB
      .map((journal) => scoreJournal(profile, journal))
      .sort((a, b) => b.score - a.score);
  }

  function scoreJournal(profile, journal) {
    const topicWeight = Number($("#topicWeight").value || 40);
    const formatWeight = Number($("#formatWeight").value || 25);
    const visibilityWeight = Math.max(10, 100 - topicWeight - formatWeight);
    const effectiveVisibilityWeight = profile.intent.methodologicalCore
      ? Math.min(visibilityWeight, 20)
      : visibilityWeight;
    const topicMatches = [...profile.topics, ...profile.methods].filter((signal) =>
      journal.areas.includes(signal) || journal.metodos.includes(signal)
    );
    const matchFit = Math.min(100, (unique(topicMatches).length / 5) * 100);
    const scopeFit = editorialScopeFit(profile, journal);
    const topicFit = Math.round(
      profile.intent.methodologicalCore
        ? (matchFit * 0.35) + (scopeFit * 0.65)
        : (matchFit * 0.65) + (scopeFit * 0.35)
    );
    const languageFit = journal.idiomas.includes(profile.language) ? 100 : 25;
    const wordFit = wordCompatibility(profile.wordCount, journal);
    const readinessFit = profile.readiness.score;
    const formatFit = Math.round((languageFit * 0.35) + (wordFit * 0.35) + (readinessFit * 0.30));
    const visibilityFit = Math.round((journal.compatibilidadBase * 0.65) + (journal.visibilidad * 0.35));
    let score = Math.round(
      (topicFit * topicWeight + formatFit * formatWeight + visibilityFit * effectiveVisibilityWeight) /
      (topicWeight + formatWeight + effectiveVisibilityWeight)
    );
    if (profile.intent.methodologicalCore && journal.perfilEditorial === "metodologia_pura") score += 4;
    if (profile.intent.statisticalCore && ["estadistica", "estadistica_social"].includes(journal.perfilEditorial)) score += 3;
    if (profile.expertReview && profile.expertReview.studyType.id === "sampling_survey" && journal.metodos.includes("encuestas")) score += 3;
    if (profile.expertReview && profile.expertReview.studyType.id === "sampling_survey" && journal.perfilEditorial && journal.perfilEditorial.startsWith("disciplinaria_") && scopeFit < 60) score -= 6;
    if (profile.expertReview && profile.expertReview.score < 55 && journal.riesgoEditorial === "alto") score -= 4;
    if (profile.intent.methodologicalCore && journal.perfilEditorial && journal.perfilEditorial.startsWith("disciplinaria_") && scopeFit < 50) score -= 8;
    score = Math.max(0, Math.min(100, score));

    const why = buildWhy(profile, journal, unique(topicMatches), languageFit, wordFit, scopeFit);
    const missing = buildMissing(profile, journal, languageFit, wordFit, scopeFit);
    return { journal, score, topicFit, formatFit, visibilityFit, scopeFit, why, missing };
  }

  function editorialScopeFit(profile, journal) {
    const perfil = journal.perfilEditorial || "generalista";
    const anchors = profile.intent.disciplinaryAnchors || [];
    const hasAnchor = anchors.some((anchor) => (journal.disciplinasBase || []).includes(anchor));

    if (profile.intent.methodologicalCore) {
      let base = 45;
      if (perfil === "metodologia_pura") base = 100;
      else if (perfil === "estadistica") base = profile.intent.statisticalCore ? 100 : 88;
      else if (perfil === "estadistica_social") base = profile.intent.statisticalCore ? 96 : 90;
      else if (perfil === "generalista_metodologica") base = 78;
      else if (perfil === "epistemologia_metodologia") base = 72;
      else if (perfil === "disciplinaria_general") base = 52;
      else if (perfil === "disciplinaria_mixta") base = hasAnchor ? 66 : 38;
      else if (perfil.startsWith("disciplinaria_")) base = hasAnchor ? 70 : 22;

      if (hasAnchor && base < 80) base += 10;
      if (!hasAnchor && perfil.includes("ciencia_politica") && profile.intent.politicalHits < 2) base = Math.min(base, 22);
      if (!hasAnchor && perfil.includes("opinion_publica") && profile.intent.opinionHits < 2) base = Math.min(base, 26);
      return Math.max(0, Math.min(100, base));
    }

    if (hasAnchor) return 92;
    if (perfil === "metodologia_pura" && profile.topics.includes("metodologia")) return 88;
    if (perfil === "estadistica" && profile.intent.statisticalCore) return 95;
    return journal.afinidadMetodologica || 60;
  }

  function unique(items) {
    return Array.from(new Set(items));
  }

  function wordCompatibility(wordCount, journal) {
    if (!journal.palabrasMin && !journal.palabrasMax) return 80;
    if (journal.palabrasMin && wordCount < journal.palabrasMin) {
      const ratio = wordCount / journal.palabrasMin;
      return ratio > 0.75 ? 70 : 35;
    }
    if (journal.palabrasMax && wordCount > journal.palabrasMax) {
      const ratio = journal.palabrasMax / wordCount;
      return ratio > 0.85 ? 70 : 35;
    }
    return 100;
  }

  function buildWhy(profile, journal, topicMatches, languageFit, wordFit, scopeFit) {
    const why = [];
    if (profile.intent.methodologicalCore && scopeFit >= 85) {
      why.push("El nucleo detectado es metodologico/estadistico y la revista esta orientada a metodologia, estadistica o investigacion social.");
    }
    if (profile.expertReview && profile.expertReview.studyType.id === "sampling_survey" && journal.metodos.includes("encuestas")) {
      why.push("El revisor experto clasifico el texto como muestreo/encuesta y la revista registra afinidad con estudios de encuesta.");
    }
    if (profile.expertReview && profile.expertReview.score >= 75 && journal.metodos.some((m) => ["metodologico", "replicacion", "ciencia abierta"].includes(m))) {
      why.push("El dictamen experto sugiere una base metodologica aprovechable para una revista con exigencia de trazabilidad.");
    }
    if (profile.intent.methodologicalCore && scopeFit < 50) {
      why.push("Encaje condicionado: la revista es disciplinaria y solo conviene si el manuscrito se reencuadra a su campo principal.");
    }
    if (topicMatches.length) {
      why.push(`Coincide con ${topicMatches.slice(0, 4).join(", ")}.`);
    }
    if (languageFit === 100) {
      why.push(`Acepta manuscritos en ${profile.language.toUpperCase()}.`);
    }
    if (wordFit === 100) {
      why.push("El rango de palabras es compatible con la norma registrada.");
    }
    if (profile.hasData && journal.metodos.some((m) => ["replicacion", "ciencia abierta", "nota metodologica"].includes(m))) {
      why.push("El texto menciona datos, codigo o replicacion, lo que fortalece el encaje.");
    }
    if (!why.length) why.push("Compatibilidad parcial; requiere revision editorial manual.");
    return why;
  }

  function buildMissing(profile, journal, languageFit, wordFit, scopeFit) {
    const missing = [];
    if (profile.intent.methodologicalCore && scopeFit < 50) {
      missing.push("No usar como primera opcion: el manuscrito parece de errores de muestreo/metodologia y la revista es principalmente disciplinaria.");
    }
    if (profile.expertReview && profile.expertReview.score < 68) {
      missing.push("Resolver primero las correcciones del revisor experto antes del envio editorial.");
    }
    if (languageFit !== 100) missing.push("El idioma detectado no esta entre los idiomas registrados para la revista.");
    if (wordFit < 100 && journal.palabrasMin && profile.wordCount < journal.palabrasMin) {
      missing.push(`Aumentar desarrollo: minimo registrado ${journal.palabrasMin.toLocaleString("es-PY")} palabras.`);
    }
    if (wordFit < 100 && journal.palabrasMax && profile.wordCount > journal.palabrasMax) {
      missing.push(`Reducir extension: maximo registrado ${journal.palabrasMax.toLocaleString("es-PY")} palabras.`);
    }
    if (!profile.keywords.length) missing.push("Agregar palabras clave.");
    if (profile.abstract === "Resumen no detectado") missing.push("Agregar resumen estructurado o identificable.");
    if (!profile.sections.references && profile.referencesCount < 5) missing.push("Verificar seccion de referencias.");
    if (!profile.hasData && journal.id === "dados") missing.push("Preparar paquete de datos/codigo o justificar no aplicabilidad.");
    journal.documentacion.slice(0, 3).forEach((doc) => missing.push(`Preparar: ${doc}.`));
    return unique(missing).slice(0, 8);
  }

  function renderProfile(profile) {
    if (!profile) {
      $("#metaTitle").textContent = "-";
      $("#metaLanguage").textContent = "-";
      $("#metaWords").textContent = "-";
      $("#metaExtraction").textContent = "-";
      $("#metaAbstract").textContent = "-";
      $("#metaKeywords").textContent = "-";
      $("#signalChips").className = "chip-wrap empty";
      $("#signalChips").textContent = "Sin senales todavia";
      $("#readinessMeter").value = 0;
      $("#readinessScore").textContent = "0%";
      $("#diagnosticList").innerHTML = "<li>Sube o pega un manuscrito para evaluar robustez metodologica y preparacion editorial.</li>";
      renderMethodology(null);
      renderExpertReview(null);
      return;
    }
    $("#metaTitle").textContent = profile.title;
    $("#metaLanguage").textContent = languageLabel(profile.language);
    $("#metaWords").textContent = profile.wordCount.toLocaleString("es-PY");
    $("#metaExtraction").textContent = formatExtractionSummary(profile.extraction);
    $("#metaAbstract").textContent = profile.abstract;
    $("#metaKeywords").textContent = profile.keywords.length ? profile.keywords.join(", ") : "No detectadas";
    renderSignals(profile);
    $("#readinessMeter").value = profile.readiness.score;
    $("#readinessScore").textContent = `${profile.readiness.score}%`;
    renderDiagnostics(profile);
    renderMethodology(profile);
    renderExpertReview(profile.expertReview);
  }

  function languageLabel(code) {
    return { es: "Espanol", pt: "Portugues", en: "Ingles" }[code] || code;
  }

  function formatExtractionSummary(extraction) {
    if (!extraction) return "Texto manual o sin metadatos";
    const labels = {
      pdf_texto: "PDF con texto embebido",
      pdf_texto_bajo: "PDF con texto embebido insuficiente",
      pdf_texto_mas_ocr: "PDF textual complementado con OCR",
      ocr_pdf: "PDF escaneado procesado con OCR",
      ocr_imagen: "Imagen procesada con OCR",
      docx_texto: "DOCX",
      archivo_texto: "Archivo textual",
      texto_manual: "Texto pegado manualmente",
      texto_editado_manual: "Texto extraido y editado",
      ocr_editado_manual: "Texto OCR editado"
    };
    const parts = [labels[extraction.method] || extraction.method || "Extraccion no clasificada"];
    if (extraction.pageCount) parts.push(`${extraction.pageCount} pag.`);
    if (extraction.ocrUsed) parts.push(`OCR ${extraction.ocrPages} pag.`);
    if (Number.isFinite(extraction.ocrConfidence)) parts.push(`confianza ${extraction.ocrConfidence}%`);
    if (extraction.warnings && extraction.warnings.length) parts.push(`${extraction.warnings.length} advert.`);
    return parts.join(" · ");
  }

  function renderSignals(profile) {
    const container = $("#signalChips");
    const chips = [
      ...profile.topics.map((label) => ({ label, type: "topic" })),
      ...profile.methods.map((label) => ({ label, type: "method" }))
    ];
    if (!chips.length) {
      container.className = "chip-wrap empty";
      container.textContent = "Sin senales tematicas fuertes";
      return;
    }
    container.className = "chip-wrap";
    container.innerHTML = "";
    chips.forEach((chip) => {
      const span = document.createElement("span");
      span.className = `chip ${chip.type}`;
      span.textContent = chip.label;
      container.appendChild(span);
    });
  }

  function renderDiagnostics(profile) {
    const items = [];
    if (profile.intent.methodologicalCore) {
      items.push("Tema central metodologico detectado: se priorizan revistas de metodologia, estadistica o investigacion social y se penalizan revistas disciplinarias sin anclaje claro.");
    }
    if (profile.intent.statisticalCore) {
      items.push("Senal estadistica detectada: conviene evaluar revistas de estadistica aplicada o metodologia cuantitativa.");
    }
    if (profile.wordCount < 3500) items.push("El texto parece corto para revistas con rango de articulo completo.");
    if (!profile.keywords.length) items.push("No se detectaron palabras clave; varias revistas las exigen en dos o tres idiomas.");
    if (profile.abstract === "Resumen no detectado") items.push("No se detecto resumen; esto reduce la confianza del ranking.");
    if (!profile.hasData) items.push("No se detecto mencion a datos, codigo o repositorio; preparar documentacion si el articulo es empirico.");
    if (!profile.hasAI) items.push("No se detecto declaracion de uso de IA; algunas revistas ya la solicitan.");
    if (profile.methodology) {
      items.unshift(`Resultado metodologico: ${profile.methodology.verdict} (${profile.methodology.score}/100).`);
      items.push(`Calidad del juzgamiento: ${profile.methodology.evidenceCount} evidencias textuales, ${profile.methodology.notVerifiableCount} criterios no verificables.`);
    }
    if (profile.expertReview) {
      items.unshift(`Revisor experto: ${profile.expertReview.studyType.label}; ${profile.expertReview.verdict} (${profile.expertReview.score}/100).`);
      if (profile.expertReview.criticalGaps) items.push(`Brechas criticas del revisor experto: ${profile.expertReview.criticalGaps}.`);
    }
    if (profile.extraction && profile.extraction.ocrUsed) {
      items.push(`OCR aplicado: ${profile.extraction.ocrPages} paginas procesadas; revisar visualmente el texto extraido antes de tomar el dictamen como definitivo.`);
    }
    if (profile.extraction && Number.isFinite(profile.extraction.ocrConfidence) && profile.extraction.ocrConfidence < 60) {
      items.push("Confianza OCR baja: el resultado metodologico debe considerarse preliminar y requiere revision manual.");
    }
    if (profile.extraction && profile.extraction.warnings && profile.extraction.warnings.length) {
      profile.extraction.warnings.slice(0, 3).forEach((warning) => items.push(`Extraccion: ${warning}`));
    }
    if (!items.length) items.push("El manuscrito tiene senales basicas suficientes para iniciar revision editorial.");
    $("#diagnosticList").innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  function renderMethodology(profile) {
    if (!profile || !profile.methodology) {
      $("#methodologyVerdict").textContent = "Sin evaluacion";
      $("#methodologyNarrative").textContent = "La evaluacion aparecera despues de analizar el manuscrito.";
      $("#methodologyScore").textContent = "0";
      $("#methodologyCriteria").className = "criteria-list empty";
      $("#methodologyCriteria").textContent = "Sin criterios evaluados.";
      $("#criticalAlerts").innerHTML = "<li>Sin alertas todavia.</li>";
      $("#methodologyRecommendations").innerHTML = "<li>Analiza un manuscrito para generar recomendaciones.</li>";
      return;
    }
    const result = profile.methodology;
    $("#methodologyVerdict").textContent = result.verdict;
    $("#methodologyNarrative").textContent = result.narrative;
    $("#methodologyScore").textContent = String(result.score);
    $("#methodologyCriteria").className = "criteria-list";
    $("#methodologyCriteria").innerHTML = result.criteria.map((item) => `
      <div class="criteria-item ${statusClass(item.status)}">
        <span>${escapeHtml(item.statusLabel)}</span>
        <div class="criteria-body">
          <strong>${escapeHtml(item.label)}</strong>
          <small>Confianza: ${escapeHtml(item.confidence)} · Peso: ${item.weight} pts</small>
          ${renderEvidenceList(item.evidence)}
          <p>${escapeHtml(item.recommendation || "Sin recomendacion especifica.")}</p>
        </div>
        <em>${Math.round(item.value * item.weight)}/${item.weight}</em>
      </div>
    `).join("");
    $("#criticalAlerts").innerHTML = result.alerts.length
      ? result.alerts.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : "<li>No se detectaron alertas criticas con las reglas actuales.</li>";
    $("#methodologyRecommendations").innerHTML = result.recommendations.length
      ? result.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : "<li>El manuscrito puede pasar a revision editorial fina.</li>";
  }

  function renderExpertReview(review) {
    if (!review) {
      $("#expertVerdict").textContent = "Sin dictamen experto";
      $("#expertNarrative").textContent = "Analiza un manuscrito para activar la clasificacion del tipo de estudio y la rubrica especializada.";
      $("#expertScore").textContent = "0";
      $("#expertStudyType").textContent = "-";
      $("#expertConfidence").textContent = "-";
      $("#expertRubricName").textContent = "-";
      $("#expertTypeEvidence").className = "evidence-box empty";
      $("#expertTypeEvidence").textContent = "Sin evidencia de clasificacion.";
      $("#expertActions").innerHTML = "<li>El dictamen aparecera despues del analisis.</li>";
      $("#coherenceMatrix").className = "coherence-matrix empty";
      $("#coherenceMatrix").textContent = "Sin matriz generada.";
      $("#expertRubricCriteria").className = "criteria-list empty";
      $("#expertRubricCriteria").textContent = "Sin criterios especializados.";
      $("#expertCorrections").innerHTML = "<li>Sin correcciones todavia.</li>";
      $("#expertJournalGuidance").innerHTML = "<li>Sin orientacion todavia.</li>";
      return;
    }

    $("#expertVerdict").textContent = review.verdict;
    $("#expertNarrative").textContent = review.narrative;
    $("#expertScore").textContent = String(review.score);
    $("#expertStudyType").textContent = review.studyType.label;
    $("#expertConfidence").textContent = review.confidence;
    $("#expertRubricName").textContent = review.rubricName;
    $("#expertTypeEvidence").className = review.studyType.evidence.length ? "evidence-box" : "evidence-box empty";
    $("#expertTypeEvidence").innerHTML = review.studyType.evidence.length
      ? `<span>Evidencia de clasificacion</span><ul>${review.studyType.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : "Sin evidencia textual fuerte para clasificar el tipo de estudio.";
    $("#expertActions").innerHTML = [
      `Rubrica: ${review.rubricScore}/100.`,
      `Coherencia: ${review.coherenceScore}/100.`,
      `Brechas criticas: ${review.criticalGaps}.`,
      `Evidencias textuales localizadas: ${review.evidenceCount}.`
    ].map((item) => `<li>${escapeHtml(item)}</li>`).join("");

    $("#coherenceMatrix").className = "coherence-matrix";
    $("#coherenceMatrix").innerHTML = review.coherence.map((item) => `
      <div class="coherence-item ${statusClass(item.status)}">
        <span>${escapeHtml(item.statusLabel)}</span>
        <strong>${escapeHtml(item.label)}</strong>
        <p>${escapeHtml(item.gap)}</p>
        ${item.evidence.length ? `<small>${escapeHtml(item.evidence[0])}</small>` : "<small>Sin evidencia textual localizada.</small>"}
      </div>
    `).join("");

    $("#expertRubricCriteria").className = "criteria-list";
    $("#expertRubricCriteria").innerHTML = review.criteria.map((item) => `
      <div class="criteria-item ${statusClass(item.status)}">
        <span>${escapeHtml(item.statusLabel)}</span>
        <div class="criteria-body">
          <strong>${escapeHtml(item.label)}${item.critical ? " *" : ""}</strong>
          <small>Confianza: ${escapeHtml(item.confidence)} · Peso: ${item.weight} pts</small>
          ${renderEvidenceList(item.evidence)}
          <p>${escapeHtml(item.recommendation || "Sin recomendacion especifica.")}</p>
        </div>
        <em>${Math.round(item.value * item.weight)}/${item.weight}</em>
      </div>
    `).join("");
    $("#expertCorrections").innerHTML = review.corrections.length
      ? review.corrections.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : "<li>No se detectaron correcciones prioritarias con la rubrica aplicada.</li>";
    $("#expertJournalGuidance").innerHTML = review.journalGuidance.length
      ? review.journalGuidance.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
      : "<li>Usar el ranking de revistas despues de revisar el dictamen experto.</li>";
  }

  function exportExpertReport() {
    if (!state.profile || !state.profile.expertReview) {
      alert("Primero analiza un manuscrito para exportar el dictamen experto.");
      return;
    }
    const profile = state.profile;
    const review = profile.expertReview;
    const top = state.ranking.slice(0, 5);
    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Dictamen experto metodologico</title>
  <style>
    body{font-family:Arial,sans-serif;color:#172026;line-height:1.45;margin:32px}
    h1,h2{color:#0f4a5c}
    table{border-collapse:collapse;width:100%;margin:12px 0}
    th,td{border:1px solid #d9e1df;padding:8px;text-align:left;vertical-align:top}
    th{background:#f7fafc}
    .meta{color:#65737c}
    .box{border:1px solid #d9e1df;padding:12px;margin:12px 0}
  </style>
</head>
<body>
  <h1>Dictamen experto metodologico</h1>
  <p class="meta">Generado: ${escapeHtml(new Date().toLocaleString("es-PY"))} · Archivo: ${escapeHtml(state.fileName || "texto pegado")}</p>
  <div class="box">
    <h2>${escapeHtml(profile.title)}</h2>
    <p><strong>Tipo de estudio:</strong> ${escapeHtml(review.studyType.label)} (${escapeHtml(review.confidence)})</p>
    <p><strong>Veredicto:</strong> ${escapeHtml(review.verdict)} · <strong>Puntaje:</strong> ${review.score}/100</p>
    <p>${escapeHtml(review.narrative)}</p>
  </div>
  <h2>Matriz de coherencia</h2>
  <table><thead><tr><th>Componente</th><th>Estado</th><th>Brecha</th><th>Evidencia</th></tr></thead><tbody>
    ${review.coherence.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.statusLabel)}</td><td>${escapeHtml(item.gap)}</td><td>${escapeHtml(item.evidence[0] || "Sin evidencia localizada")}</td></tr>`).join("")}
  </tbody></table>
  <h2>Rubrica especializada</h2>
  <table><thead><tr><th>Criterio</th><th>Estado</th><th>Confianza</th><th>Recomendacion</th><th>Evidencia</th></tr></thead><tbody>
    ${review.criteria.map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.statusLabel)}</td><td>${escapeHtml(item.confidence)}</td><td>${escapeHtml(item.recommendation)}</td><td>${escapeHtml(item.evidence.join(" | ") || "Sin evidencia localizada")}</td></tr>`).join("")}
  </tbody></table>
  <h2>Correcciones prioritarias</h2>
  <ul>${review.corrections.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  <h2>Orientacion editorial</h2>
  <ul>${review.journalGuidance.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  <h2>Revistas mejor posicionadas</h2>
  <ol>${top.map((item) => `<li>${escapeHtml(item.journal.nombre)} (${escapeHtml(item.journal.pais)}): ${item.score}/100. ${escapeHtml(item.why[0] || "")}</li>`).join("")}</ol>
  <p class="meta">El informe no incluye texto completo del manuscrito; solo metadatos y fragmentos breves de evidencia.</p>
</body>
</html>`;
    downloadFile("dictamen_experto_metodologico.html", html, "text/html;charset=utf-8");
  }

  function renderEvidenceList(evidence) {
    if (!evidence || !evidence.length) {
      return `<div class="evidence-box empty">Evidencia textual: no localizada. El criterio queda como no verificable o parcial segun las senales estructurales.</div>`;
    }
    return `
      <div class="evidence-box">
        <span>Evidencia textual</span>
        <ul>${evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
    `;
  }

  function buildAiPromptForCurrentProfile() {
    if (!state.profile) {
      alert("Primero evalua un manuscrito para generar el prompt IA.");
      return;
    }
    const prompt = buildAiPrompt(state.profile, state.extractedText);
    $("#aiPrompt").value = prompt;
    setAiStatus("Prompt preparado. Puede ejecutarse localmente o copiarse para revision externa controlada.");
    activateTab("tabIA");
  }

  function buildAiPrompt(profile, sourceText) {
    const localCriteria = profile.methodology.criteria.map((item) => ({
      id: item.id,
      criterio: item.label,
      estado_reglas: item.status,
      confianza_reglas: item.confidence,
      evidencia_reglas: item.evidence.slice(0, 2),
      recomendacion_reglas: item.recommendation
    }));
    const payload = {
      tarea: "evaluacion_metodologica_asistida",
      idioma_detectado: profile.language,
      titulo_probable: profile.title,
      resumen_detectado: profile.abstract,
      palabras: profile.wordCount,
      temas_detectados: profile.topics,
      metodos_detectados: profile.methods,
      extraccion: profile.extraction,
      criterios: localCriteria,
      revisor_experto: summarizeExpertForTraining(profile.expertReview),
      instrucciones: [
        "Evalua solo con evidencia disponible en el texto.",
        "No inventes secciones, resultados, datos, muestras ni pruebas estadisticas.",
        "Si no hay evidencia suficiente, usa no verificable.",
        "Usa el tipo de estudio y la rubrica especializada como contexto, pero corrige si el texto demuestra otra cosa.",
        "Devuelve exclusivamente JSON valido, sin markdown.",
        "Usa fragmentos de evidencia breves y no copies parrafos largos."
      ],
      esquema_salida: {
        model_family: "nombre del modelo o familia",
        study_type: "cuantitativo|cualitativo|mixto|revision|metodologico|simulacion|no claro",
        overall_verdict: "texto corto",
        score_0_100: "numero",
        confidence: "alta|media|baja|no evaluable",
        criteria: [
          {
            id: "id del criterio recibido",
            status: "cumple|parcial|no verificable|no cumple|no aplica",
            confidence: "alta|media|baja|no evaluable",
            evidence: ["fragmento breve"],
            recommendation: "accion concreta",
            reason: "justificacion breve"
          }
        ],
        risks: ["alertas metodologicas"],
        journal_recommendation_notes: ["notas para seleccion de revista"]
      },
      texto_manuscrito: compact(String(sourceText || ""), getAiMaxChars())
    };
    return JSON.stringify(payload, null, 2);
  }

  function getAiMaxChars() {
    const aiConfig = (window.RECOMENDADOR_CONFIG && window.RECOMENDADOR_CONFIG.ai) || {};
    return Number(aiConfig.maxChars || AI_DEFAULTS.maxChars);
  }

  async function copyAiPrompt() {
    const prompt = $("#aiPrompt").value || "";
    if (!prompt) {
      buildAiPromptForCurrentProfile();
    }
    const value = $("#aiPrompt").value || "";
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setAiStatus("Prompt copiado.");
    } catch (error) {
      $("#aiPrompt").focus();
      $("#aiPrompt").select();
      setAiStatus("No se pudo copiar automaticamente; el prompt quedo seleccionado.");
    }
  }

  async function testAiEndpoint() {
    const endpoint = getAiEndpoint();
    const model = getAiModel();
    setAiStatus("Probando conexion con endpoint IA...");
    try {
      const probe = await probeAiEndpoint(endpoint, model);
      setAiStatus(probe.message);
    } catch (error) {
      console.error(error);
      setAiStatus(formatAiConnectionError(error, endpoint, model));
    }
  }

  async function runAiReview() {
    if (!state.profile) {
      alert("Primero evalua un manuscrito.");
      return;
    }
    if (!$("#aiPrompt").value.trim()) buildAiPromptForCurrentProfile();
    const endpoint = getAiEndpoint();
    const model = getAiModel();
    if (!isLocalEndpoint(endpoint) && !confirm("El endpoint IA no parece local. Esto podria enviar texto del manuscrito fuera del equipo. Continuar?")) {
      return;
    }
    setAiStatus("Consultando modelo IA...");
    try {
      if (isOllamaEndpoint(endpoint)) {
        const probe = await probeAiEndpoint(endpoint, model);
        if (probe.blocking) throw new Error(probe.message);
        setAiStatus(`${probe.message} Consultando modelo IA...`);
      }
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: "Eres un evaluador metodologico academico. Respondes solo JSON valido y trazable."
            },
            { role: "user", content: $("#aiPrompt").value }
          ],
          stream: false,
          options: { temperature: 0.1 }
        })
      }, getAiRequestTimeout());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const content = extractAiContent(data);
      if (!content) throw new Error("La respuesta IA no contiene texto interpretable.");
      $("#aiResponse").value = content;
      const parsed = parseAiJson(content);
      state.aiReview = normalizeAiReview(parsed, model, endpoint);
      renderAiReview(state.aiReview);
      setAiStatus("Dictamen IA recibido. Revise y valide antes de guardar como caso de aprendizaje.");
    } catch (error) {
      console.error(error);
      setAiStatus(formatAiConnectionError(error, endpoint, model));
    }
  }

  function getAiEndpoint() {
    return $("#aiEndpoint").value.trim() || AI_DEFAULTS.endpoint;
  }

  function getAiModel() {
    return $("#aiModel").value.trim() || AI_DEFAULTS.model;
  }

  async function probeAiEndpoint(endpoint, model) {
    if (!endpoint) throw new Error("Endpoint IA vacio.");
    if (!isOllamaEndpoint(endpoint)) {
      return {
        blocking: false,
        message: "Endpoint externo configurado. La prueba de modelos solo esta automatizada para Ollama; al evaluar se pedira confirmacion de envio."
      };
    }
    const tagsEndpoint = getOllamaTagsEndpoint(endpoint);
    const response = await fetchWithTimeout(tagsEndpoint, {
      method: "GET",
      cache: "no-store"
    }, getAiProbeTimeout());
    if (!response.ok) throw new Error(`Ollama respondio HTTP ${response.status} en ${tagsEndpoint}.`);
    const data = await response.json();
    const models = parseOllamaModels(data);
    if (models.length && !models.includes(model)) {
      return {
        blocking: true,
        message: `Ollama responde, pero no aparece el modelo ${model}. Ejecute: ollama pull ${model}.`
      };
    }
    const suffix = models.length ? ` Modelo verificado: ${model}.` : " No se pudo listar modelos, pero el servicio responde.";
    return {
      blocking: false,
      message: `Ollama responde en ${tagsEndpoint}.${suffix}`
    };
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => window.clearTimeout(timeout));
  }

  function getAiProbeTimeout() {
    const aiConfig = (window.RECOMENDADOR_CONFIG && window.RECOMENDADOR_CONFIG.ai) || {};
    return Number(aiConfig.probeTimeoutMs || AI_DEFAULTS.probeTimeoutMs);
  }

  function getAiRequestTimeout() {
    const aiConfig = (window.RECOMENDADOR_CONFIG && window.RECOMENDADOR_CONFIG.ai) || {};
    return Number(aiConfig.requestTimeoutMs || AI_DEFAULTS.requestTimeoutMs);
  }

  function isOllamaEndpoint(endpoint) {
    try {
      const url = new URL(endpoint);
      return url.port === "11434" || url.pathname === "/api/chat" || url.pathname.endsWith("/api/chat");
    } catch (error) {
      return false;
    }
  }

  function getOllamaTagsEndpoint(endpoint) {
    const url = new URL(endpoint);
    url.pathname = "/api/tags";
    url.search = "";
    url.hash = "";
    return url.toString();
  }

  function parseOllamaModels(data) {
    if (!data || !Array.isArray(data.models)) return [];
    return data.models
      .map((item) => String(item.name || item.model || "").trim())
      .filter(Boolean);
  }

  function formatAiConnectionError(error, endpoint, model) {
    const rawMessage = error && error.name === "AbortError"
      ? "tiempo de espera agotado"
      : String((error && error.message) || error || "error desconocido");
    const networkPattern = /failed to fetch|load failed|networkerror|could not connect|connection refused|tiempo de espera/i;
    if (isLocalEndpoint(endpoint) && networkPattern.test(rawMessage)) {
      return `No se pudo conectar con Ollama local (${endpoint}). Abra Ollama, ejecute "ollama pull ${model}" y "ollama serve"; si usa GitHub Pages, permita CORS para esta pagina. Puede copiar el prompt e importar el JSON.`;
    }
    if (isOllamaEndpoint(endpoint) && /modelo|model|pull/i.test(rawMessage)) {
      return `${rawMessage} Puede copiar el prompt e importar el JSON.`;
    }
    return `No se pudo consultar IA: ${rawMessage}. Puede copiar el prompt y pegar luego el JSON.`;
  }

  function importAiResponse() {
    const value = $("#aiResponse").value.trim();
    if (!value) {
      alert("Pegue primero una respuesta JSON del modelo.");
      return;
    }
    try {
      const parsed = parseAiJson(value);
      state.aiReview = normalizeAiReview(parsed, $("#aiModel").value.trim() || AI_DEFAULTS.model, $("#aiEndpoint").value.trim() || AI_DEFAULTS.endpoint);
      renderAiReview(state.aiReview);
      setAiStatus("Respuesta IA importada. Revise antes de guardar.");
    } catch (error) {
      alert(`No se pudo leer el JSON IA: ${error.message || error}`);
    }
  }

  function clearAiReview() {
    state.aiReview = null;
    $("#aiPrompt").value = "";
    $("#aiResponse").value = "";
    renderAiReview(null);
    setAiStatus("Sin evaluacion asistida.");
  }

  function extractAiContent(data) {
    if (data && data.message && typeof data.message.content === "string") return data.message.content;
    if (data && typeof data.response === "string") return data.response;
    if (data && data.choices && data.choices[0] && data.choices[0].message) return data.choices[0].message.content || "";
    return "";
  }

  function parseAiJson(value) {
    const cleaned = String(value || "")
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    try {
      return JSON.parse(cleaned);
    } catch (error) {
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
      throw error;
    }
  }

  function normalizeAiReview(parsed, model, endpoint) {
    const criteria = Array.isArray(parsed.criteria) ? parsed.criteria : [];
    const normalizedCriteria = criteria.map((item) => ({
      id: String(item.id || "").trim(),
      label: criterionLabel(item.id),
      status: normalizeStatus(item.status),
      statusLabel: statusLabel(normalizeStatus(item.status)),
      confidence: normalizeConfidence(item.confidence),
      evidence: Array.isArray(item.evidence) ? item.evidence.map((text) => compact(text, 260)).slice(0, 2) : [],
      recommendation: compact(item.recommendation || "", 320),
      reason: compact(item.reason || "", 320)
    })).filter((item) => item.id);
    return {
      timestamp: new Date().toISOString(),
      model,
      endpointType: isLocalEndpoint(endpoint) ? "local" : "externo",
      modelFamily: compact(parsed.model_family || model, 120),
      studyType: compact(parsed.study_type || "no claro", 80),
      verdict: compact(parsed.overall_verdict || parsed.verdict || "Sin veredicto", 180),
      score: clampScore(parsed.score_0_100 ?? parsed.score ?? parsed.puntaje),
      confidence: normalizeConfidence(parsed.confidence),
      criteria: normalizedCriteria,
      risks: Array.isArray(parsed.risks) ? parsed.risks.map((item) => compact(item, 240)).slice(0, 8) : [],
      journalNotes: Array.isArray(parsed.journal_recommendation_notes)
        ? parsed.journal_recommendation_notes.map((item) => compact(item, 240)).slice(0, 6)
        : []
    };
  }

  function criterionLabel(id) {
    const found = METHODOLOGY_CRITERIA.find((item) => item.id === id);
    return found ? found.label : String(id || "");
  }

  function normalizeStatus(status) {
    const text = normalize(status).trim();
    if (["cumple", "parcial", "no cumple", "no verificable", "no aplica"].includes(text)) return text;
    if (text.includes("verific")) return "no verificable";
    if (text.includes("aplica")) return "no aplica";
    if (text.includes("parcial")) return "parcial";
    if (text.includes("cumple")) return text.includes("no") ? "no cumple" : "cumple";
    return "no verificable";
  }

  function normalizeConfidence(confidence) {
    const text = normalize(confidence).trim();
    if (["alta", "media", "baja", "no evaluable"].includes(text)) return text;
    if (text.includes("alto")) return "alta";
    if (text.includes("medio")) return "media";
    if (text.includes("bajo")) return "baja";
    return "no evaluable";
  }

  function clampScore(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "";
    return Math.max(0, Math.min(100, Math.round(number)));
  }

  function renderAiReview(review) {
    const container = $("#aiResult");
    if (!review) {
      container.className = "ai-result empty";
      container.textContent = "Sin dictamen IA.";
      return;
    }
    container.className = "ai-result";
    container.innerHTML = `
      <div class="ai-summary">
        <div><span>Modelo</span><strong>${escapeHtml(review.model)}</strong></div>
        <div><span>Tipo</span><strong>${escapeHtml(review.studyType)}</strong></div>
        <div><span>Puntaje IA</span><strong>${escapeHtml(review.score || "-")}</strong></div>
        <div><span>Confianza</span><strong>${escapeHtml(review.confidence)}</strong></div>
      </div>
      <p>${escapeHtml(review.verdict)}</p>
      <div class="criteria-list ai-criteria">
        ${review.criteria.map((item) => `
          <div class="criteria-item ${statusClass(item.status)}">
            <span>${escapeHtml(item.statusLabel)}</span>
            <div class="criteria-body">
              <strong>${escapeHtml(item.label)}</strong>
              <small>Confianza IA: ${escapeHtml(item.confidence)}</small>
              ${renderEvidenceList(item.evidence)}
              <p>${escapeHtml(item.reason || item.recommendation || "Sin justificacion especifica.")}</p>
            </div>
            <em>IA</em>
          </div>
        `).join("")}
      </div>
      ${review.risks.length ? `<h3>Riesgos IA</h3><ul class="clean-list">${review.risks.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
      ${review.journalNotes.length ? `<h3>Notas editoriales IA</h3><ul class="clean-list">${review.journalNotes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
    `;
  }

  function setAiStatus(text) {
    const node = $("#aiStatus span");
    if (node) node.textContent = text;
  }

  function isLocalEndpoint(endpoint) {
    try {
      const url = new URL(endpoint);
      return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    } catch (error) {
      return false;
    }
  }

  function saveTrainingCase() {
    if (!state.profile) {
      alert("Primero evalua un manuscrito.");
      return;
    }
    const feedback = $("#humanFeedback").value;
    const note = $("#humanFeedbackNote").value.trim();
    if (feedback === "pendiente" && !confirm("El caso esta pendiente. Guardarlo igualmente como no validado?")) return;
    const entries = getTrainingEntries();
    const entry = {
      timestamp: new Date().toISOString(),
      usuario: state.user ? state.user.name : "sin sesion",
      rol: state.user ? state.user.role : "sin rol",
      archivo: state.fileName || "texto pegado",
      titulo: state.profile.title,
      idioma: state.profile.language,
      palabras: state.profile.wordCount,
      extraccion: state.profile.extraction,
      senales: {
        temas: state.profile.topics,
        metodos: state.profile.methods,
        nucleo_metodologico: state.profile.intent.methodologicalCore,
        nucleo_estadistico: state.profile.intent.statisticalCore
      },
      juicio_reglas: summarizeMethodologyForTraining(state.profile.methodology),
      juicio_experto: summarizeExpertForTraining(state.profile.expertReview),
      juicio_ia: summarizeAiForTraining(state.aiReview),
      top_revistas: state.ranking.slice(0, 3).map((item) => ({
        revista: item.journal.nombre,
        puntaje: item.score,
        alcance: item.scopeFit
      })),
      feedback_humano: {
        decision: feedback,
        nota: note
      }
    };
    entries.unshift(entry);
    localStorage.setItem(TRAINING_KEY, JSON.stringify(entries.slice(0, 500)));
    syncTrainingEntry(entry);
    renderTrainingCount();
    setAiStatus("Caso guardado para calibracion supervisada.");
  }

  function syncTrainingEntry(entry) {
    if (!GAS_ENDPOINT || !entry) return;
    fetch(GAS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ tipo: "entrenamiento", ...entry })
    }).catch(() => {});
  }

  function summarizeMethodologyForTraining(methodology) {
    if (!methodology) return null;
    return {
      score: methodology.score,
      verdict: methodology.verdict,
      alertas: methodology.alerts.length,
      evidencias: methodology.evidenceCount,
      no_verificables: methodology.notVerifiableCount,
      baja_confianza: methodology.lowConfidenceCount,
      criterios: methodology.criteria.map((item) => ({
        id: item.id,
        estado: item.status,
        confianza: item.confidence,
        evidencias: item.evidence.length
      }))
    };
  }

  function summarizeExpertForTraining(review) {
    if (!review) return null;
    return {
      tipo_estudio: review.studyType.label,
      tipo_estudio_id: review.studyType.id,
      confianza: review.confidence,
      rubrica: review.rubricName,
      score: review.score,
      rubrica_score: review.rubricScore,
      coherencia_score: review.coherenceScore,
      verdict: review.verdict,
      brechas_criticas: review.criticalGaps,
      brechas_coherencia: review.coherenceGaps,
      evidencias: review.evidenceCount,
      criterios: review.criteria.map((item) => ({
        id: item.id,
        estado: item.status,
        confianza: item.confidence,
        critico: item.critical,
        evidencias: item.evidence.length
      })),
      coherencia: review.coherence.map((item) => ({
        id: item.id,
        estado: item.status,
        evidencias: item.evidence.length
      }))
    };
  }

  function summarizeAiForTraining(review) {
    if (!review) return null;
    return {
      modelo: review.model,
      endpoint_tipo: review.endpointType,
      tipo_estudio: review.studyType,
      score: review.score,
      verdict: review.verdict,
      confianza: review.confidence,
      riesgos: review.risks.length,
      criterios: review.criteria.map((item) => ({
        id: item.id,
        estado: item.status,
        confianza: item.confidence,
        evidencias: item.evidence.length
      }))
    };
  }

  function getTrainingEntries() {
    try {
      return JSON.parse(localStorage.getItem(TRAINING_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function renderTrainingCount() {
    const count = getTrainingEntries().length;
    $("#trainingCount").textContent = `${count.toLocaleString("es-PY")} casos guardados.`;
  }

  function exportTrainingJson() {
    downloadFile("casos_entrenamiento_evaluador_metodologico.json", JSON.stringify(getTrainingEntries(), null, 2), "application/json");
  }

  function exportTrainingCsv() {
    const rows = getTrainingEntries().map((entry) => ({
      timestamp: entry.timestamp,
      usuario: entry.usuario,
      archivo: entry.archivo,
      titulo: entry.titulo,
      idioma: entry.idioma,
      palabras: entry.palabras,
      metodo_extraccion: entry.extraccion ? entry.extraccion.method : "",
      ocr_usado: entry.extraccion ? entry.extraccion.ocrUsed : "",
      feedback: entry.feedback_humano ? entry.feedback_humano.decision : "",
      reglas_score: entry.juicio_reglas ? entry.juicio_reglas.score : "",
      reglas_verdict: entry.juicio_reglas ? entry.juicio_reglas.verdict : "",
      experto_tipo: entry.juicio_experto ? entry.juicio_experto.tipo_estudio : "",
      experto_score: entry.juicio_experto ? entry.juicio_experto.score : "",
      experto_verdict: entry.juicio_experto ? entry.juicio_experto.verdict : "",
      ia_modelo: entry.juicio_ia ? entry.juicio_ia.modelo : "",
      ia_score: entry.juicio_ia ? entry.juicio_ia.score : "",
      ia_verdict: entry.juicio_ia ? entry.juicio_ia.verdict : "",
      ia_confianza: entry.juicio_ia ? entry.juicio_ia.confianza : ""
    }));
    const header = Object.keys(rows[0] || { timestamp: "", titulo: "", feedback: "" });
    const csv = [header.join(",")]
      .concat(rows.map((row) => header.map((field) => csvCell(row[field])).join(",")))
      .join("\n");
    downloadFile("casos_entrenamiento_evaluador_metodologico.csv", csv, "text/csv;charset=utf-8");
  }

  function renderRanking(results) {
    const container = $("#rankingList");
    if (!results.length) {
      container.className = "ranking-list empty";
      container.textContent = "Sin ranking generado.";
      $("#rankingSubtitle").textContent = "El ranking aparecera despues del analisis.";
      return;
    }
    $("#rankingSubtitle").textContent = `${results.length} revistas evaluadas con scoring explicable.`;
    container.className = "ranking-list";
    container.innerHTML = "";
    const template = $("#rankingItemTemplate");
    results.forEach((result) => {
      const node = template.content.cloneNode(true);
      node.querySelector(".journal-score strong").textContent = result.score;
      node.querySelector("h3").textContent = result.journal.nombre;
      node.querySelector(".country-pill").textContent = result.journal.pais;
      node.querySelector(".journal-summary").textContent =
        `${result.journal.areas.slice(0, 4).join(", ")}. Riesgo editorial: ${result.journal.riesgoEditorial}.`;
      const chips = node.querySelector(".journal-chips");
      [
        `Tema ${result.topicFit}%`,
        `Alcance ${result.scopeFit}%`,
        `Formato ${result.formatFit}%`,
        `Visibilidad ${result.visibilityFit}%`,
        `Nivel ${impactLabel(result.journal)}`
      ].forEach((label) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = label;
        chips.appendChild(chip);
      });
      node.querySelector(".why-list").innerHTML = result.why.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      node.querySelector(".missing-list").innerHTML = result.missing.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
      node.querySelector(".select-journal").addEventListener("click", () => {
        $("#journalSelect").value = result.journal.id;
        renderJournalDetail(result.journal.id);
        activateTab("tabChecklist");
      });
      container.appendChild(node);
    });
    refreshIcons();
  }

  function populateJournalSelect() {
    $("#journalSelect").innerHTML = window.REVISTAS_DB
      .map((journal) => `<option value="${journal.id}">${escapeHtml(journal.nombre)} (${escapeHtml(journal.pais)})</option>`)
      .join("");
  }

  function renderJournalDetail(journalId) {
    const journal = window.REVISTAS_DB.find((item) => item.id === journalId) || window.REVISTAS_DB[0];
    $("#journalSelect").value = journal.id;
    $("#journalDetail").innerHTML = `
      <h2>${escapeHtml(journal.nombre)}</h2>
      <p>${escapeHtml(journal.pais)} · ${escapeHtml(journal.acceso)} · ${escapeHtml(journal.plataforma)}</p>
      <div class="detail-grid">
        <div><span>Idiomas</span><strong>${journal.idiomas.map((i) => i.toUpperCase()).join(", ")}</strong></div>
        <div><span>Extension</span><strong>${formatWordRule(journal)}</strong></div>
        <div><span>Citas</span><strong>${escapeHtml(journal.estiloCitas)}</strong></div>
        <div><span>Riesgo</span><strong>${escapeHtml(journal.riesgoEditorial)}</strong></div>
        <div><span>Nivel</span><strong>${escapeHtml(impactLabel(journal))}</strong></div>
        <div><span>Cuartil</span><strong>${escapeHtml(formatQuartile(journal))}</strong></div>
      </div>
      <h3>Indexacion e importancia</h3>
      <ul class="clean-list">
        <li>${escapeHtml(formatIndexaciones(journal))}</li>
        <li>${escapeHtml((journal.impacto && journal.impacto.nivelFuente) || "Sin nota de impacto registrada.")}</li>
        <li>Estado: ${escapeHtml((journal.impacto && journal.impacto.estadoImpacto) || "pendiente")}</li>
      </ul>
      <h3>Requisitos clave</h3>
      <ul class="clean-list">${journal.requisitosClave.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <p class="source-note"><strong>Fuente verificada:</strong> <a href="${journal.fuenteUrl}" target="_blank" rel="noopener">${journal.fuenteUrl}</a></p>
    `;
    renderSubmissionChecklist(journal);
  }

  function renderSubmissionChecklist(journal) {
    const profile = state.profile;
    const items = [];
    journal.documentacion.forEach((doc) => {
      items.push({ text: doc, status: "warn" });
    });
    if (profile) {
      items.unshift({
        text: journal.idiomas.includes(profile.language) ? `Idioma compatible: ${languageLabel(profile.language)}` : `Traducir o ajustar idioma: ${languageLabel(profile.language)}`,
        status: journal.idiomas.includes(profile.language) ? "ok" : "warn"
      });
      items.unshift({
        text: wordCompatibility(profile.wordCount, journal) === 100 ? "Extension compatible con la norma registrada" : `Ajustar extension: ${formatWordRule(journal)}`,
        status: wordCompatibility(profile.wordCount, journal) === 100 ? "ok" : "warn"
      });
      items.unshift({
        text: profile.abstract !== "Resumen no detectado" ? "Resumen detectado" : "Preparar resumen segun norma de la revista",
        status: profile.abstract !== "Resumen no detectado" ? "ok" : "warn"
      });
    }
    $("#submissionChecklist").innerHTML = items
      .map((item) => `<li class="${item.status}">${escapeHtml(item.text)}</li>`)
      .join("");
  }

  function formatWordRule(journal) {
    if (journal.palabrasMin && journal.palabrasMax) {
      return `${journal.palabrasMin.toLocaleString("es-PY")} a ${journal.palabrasMax.toLocaleString("es-PY")} palabras`;
    }
    if (journal.palabrasMax) return `hasta ${journal.palabrasMax.toLocaleString("es-PY")} palabras`;
    if (journal.paginasMax) return `hasta ${journal.paginasMax} paginas`;
    return "verificar norma vigente";
  }

  function impactLabel(journal) {
    return (journal.impacto && journal.impacto.nivelImportancia) || "pendiente";
  }

  function formatIndexaciones(journal) {
    const indexaciones = journal.impacto && Array.isArray(journal.impacto.indexaciones)
      ? journal.impacto.indexaciones
      : [];
    return indexaciones.length ? `Indexaciones: ${indexaciones.join(", ")}` : "Indexaciones: pendiente de verificacion";
  }

  function formatQuartile(journal) {
    const quartile = journal.impacto &&
      Array.isArray(journal.impacto.cuartiles) &&
      journal.impacto.cuartiles.find((item) => item.valor && !["pendiente", "no localizado"].includes(item.valor));
    if (!quartile) return "pendiente / no localizado";
    const sjr = quartile.sjr ? `, SJR ${quartile.sjr}` : "";
    return `${quartile.sistema} ${quartile.anio}: ${quartile.valor}${sjr}`;
  }

  function rerankIfReady() {
    if (!state.profile) return;
    state.ranking = rankJournals(state.profile);
    renderRanking(state.ranking);
  }

  function saveAuditEntry() {
    if (!state.profile || !state.ranking.length) return;
    const logs = getAuditEntries();
    const extraction = state.profile.extraction || {};
    logs.unshift({
      timestamp: new Date().toISOString(),
      usuario: state.user ? state.user.name : "sin sesion",
      rol: state.user ? state.user.role : "sin rol",
      archivo: state.fileName || "texto pegado",
      extraccion_metodo: extraction.method || "sin_metadatos",
      extraccion_fuente: extraction.source || "",
      extraccion_paginas: extraction.pageCount || 0,
      extraccion_paginas_leidas: extraction.pagesRead || 0,
      ocr_usado: Boolean(extraction.ocrUsed),
      ocr_paginas: extraction.ocrPages || 0,
      ocr_confianza: Number.isFinite(extraction.ocrConfidence) ? extraction.ocrConfidence : "",
      extraccion_advertencias: extraction.warnings ? extraction.warnings.length : 0,
      titulo: state.profile.title,
      idioma: state.profile.language,
      palabras: state.profile.wordCount,
      readiness: state.profile.readiness.score,
      robustez_metodologica: state.profile.methodology ? state.profile.methodology.score : "",
      veredicto_metodologico: state.profile.methodology ? state.profile.methodology.verdict : "",
      tipo_estudio_experto: state.profile.expertReview ? state.profile.expertReview.studyType.label : "",
      confianza_experta: state.profile.expertReview ? state.profile.expertReview.confidence : "",
      puntaje_experto: state.profile.expertReview ? state.profile.expertReview.score : "",
      veredicto_experto: state.profile.expertReview ? state.profile.expertReview.verdict : "",
      coherencia_experta: state.profile.expertReview ? state.profile.expertReview.coherenceScore : "",
      brechas_criticas_expertas: state.profile.expertReview ? state.profile.expertReview.criticalGaps : "",
      alertas_criticas: state.profile.methodology ? state.profile.methodology.alerts.length : 0,
      evidencias_detectadas: state.profile.methodology ? state.profile.methodology.evidenceCount : 0,
      criterios_no_verificables: state.profile.methodology ? state.profile.methodology.notVerifiableCount : 0,
      criterios_baja_confianza: state.profile.methodology ? state.profile.methodology.lowConfidenceCount : 0,
      criterios: state.profile.methodology ? state.profile.methodology.criteria.map((item) => ({
        id: item.id,
        estado: item.status,
        confianza: item.confidence,
        evidencias: item.evidence.length
      })) : [],
      top: state.ranking.slice(0, 5).map((item) => ({
        revista: item.journal.nombre,
        pais: item.journal.pais,
        puntaje: item.score
      }))
    });
    const stored = logs.slice(0, 100);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(stored));
    syncAuditEntry(stored[0]);
  }

  function syncAuditEntry(entry) {
    if (!GAS_ENDPOINT || !entry) return;
    fetch(GAS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(entry)
    }).catch(() => {});
  }

  function getAuditEntries() {
    try {
      return JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]");
    } catch (error) {
      return [];
    }
  }

  function renderAuditLog() {
    const logs = getAuditEntries();
    const container = $("#auditLog");
    if (!logs.length) {
      container.className = "audit-log empty";
      container.textContent = "No hay registros locales.";
      return;
    }
    container.className = "audit-log";
    container.innerHTML = logs.map((entry) => {
      const top = entry.top && entry.top[0] ? `${entry.top[0].revista} (${entry.top[0].puntaje})` : "sin ranking";
      return `
        <article class="audit-item">
          <strong>${escapeHtml(entry.titulo)}</strong>
          <span class="audit-meta">${new Date(entry.timestamp).toLocaleString("es-PY")} · ${escapeHtml(entry.usuario)} · ${escapeHtml(entry.archivo)}</span>
          <span>Extraccion: ${escapeHtml(entry.extraccion_metodo || "sin dato")} · OCR: ${entry.ocr_usado ? "si" : "no"}${entry.ocr_confianza ? ` · ${entry.ocr_confianza}%` : ""}</span>
          <span>Robustez metodologica: ${escapeHtml(entry.veredicto_metodologico || "sin dato")} ${entry.robustez_metodologica || ""}/100</span>
          <span>Revisor experto: ${escapeHtml(entry.tipo_estudio_experto || "sin tipo")} · ${escapeHtml(entry.veredicto_experto || "sin dictamen")} ${entry.puntaje_experto || ""}/100</span>
          <span>Evidencias: ${entry.evidencias_detectadas || 0} · No verificables: ${entry.criterios_no_verificables || 0}</span>
          <span>Top recomendado: ${escapeHtml(top)}</span>
        </article>
      `;
    }).join("");
  }

  function exportAuditJson() {
    downloadFile("bitacora_evaluador_metodologico.json", JSON.stringify(getAuditEntries(), null, 2), "application/json");
  }

  function exportAuditCsv() {
    const rows = getAuditEntries().map((entry) => ({
      timestamp: entry.timestamp,
      usuario: entry.usuario,
      rol: entry.rol,
      archivo: entry.archivo,
      titulo: entry.titulo,
      idioma: entry.idioma,
      palabras: entry.palabras,
      extraccion_metodo: entry.extraccion_metodo,
      extraccion_fuente: entry.extraccion_fuente,
      extraccion_paginas: entry.extraccion_paginas,
      extraccion_paginas_leidas: entry.extraccion_paginas_leidas,
      ocr_usado: entry.ocr_usado,
      ocr_paginas: entry.ocr_paginas,
      ocr_confianza: entry.ocr_confianza,
      extraccion_advertencias: entry.extraccion_advertencias,
      readiness: entry.readiness,
      robustez_metodologica: entry.robustez_metodologica,
      veredicto_metodologico: entry.veredicto_metodologico,
      tipo_estudio_experto: entry.tipo_estudio_experto,
      confianza_experta: entry.confianza_experta,
      puntaje_experto: entry.puntaje_experto,
      veredicto_experto: entry.veredicto_experto,
      coherencia_experta: entry.coherencia_experta,
      brechas_criticas_expertas: entry.brechas_criticas_expertas,
      alertas_criticas: entry.alertas_criticas,
      evidencias_detectadas: entry.evidencias_detectadas,
      criterios_no_verificables: entry.criterios_no_verificables,
      criterios_baja_confianza: entry.criterios_baja_confianza,
      top1: entry.top && entry.top[0] ? entry.top[0].revista : "",
      puntaje_top1: entry.top && entry.top[0] ? entry.top[0].puntaje : ""
    }));
    const header = Object.keys(rows[0] || { timestamp: "", usuario: "", titulo: "" });
    const csv = [header.join(",")]
      .concat(rows.map((row) => header.map((field) => csvCell(row[field])).join(",")))
      .join("\n");
    downloadFile("bitacora_evaluador_metodologico.csv", csv, "text/csv;charset=utf-8");
  }

  function clearAuditLog() {
    if (!confirm("Vaciar la bitacora local de este navegador?")) return;
    localStorage.removeItem(AUDIT_KEY);
    renderAuditLog();
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  function downloadFile(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function activateTab(tabId) {
    $$(".tab-btn").forEach((button) => button.classList.toggle("active", button.dataset.tab === tabId));
    $$(".tab-panel").forEach((panel) => panel.classList.toggle("active", panel.id === tabId));
  }

  function setFileState(text, mode) {
    const node = $("#fileState");
    node.textContent = text;
    node.className = `state-pill ${mode || ""}`.trim();
  }

  function setStatus(text) {
    $("#analysisStatus").textContent = text;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
  }
})();
