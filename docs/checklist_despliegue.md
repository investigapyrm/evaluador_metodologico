# Checklist de despliegue

## Local

- [x] Crear copia separada del MVP original.
- [x] Reorientar identidad a evaluador metodologico general.
- [x] Agregar pestana de evaluacion metodologica.
- [x] Verificar sintaxis de `app.js`, `data/journals_seed.js` y `service-worker.js`.
- [x] Verificar sintaxis de Apps Script mediante copia temporal `.js`.
- [x] Verificar carga de base semilla de revistas.
- [x] Simular caso metodologico/estadistico con Node.
- [x] Ejecutar `python3 -m http.server 8031`.
- [x] Abrir `http://localhost:8031/` por HTTP 200.
- [ ] Iniciar sesion con rol investigador.
- [ ] Pegar texto de prueba y generar diagnostico metodologico.
- [ ] Probar carga de TXT o MD.
- [ ] Probar carga de DOCX.
- [ ] Probar carga de PDF textual.
- [ ] Probar carga de PDF escaneado y verificar que se active OCR.
- [ ] Probar carga de imagen y verificar confianza/advertencias OCR.
- [ ] Exportar bitacora JSON.
- [ ] Exportar bitacora CSV.
- [ ] Verificar que no se guarde texto completo en la bitacora.
- [ ] Verificar que solo se guarden metadatos OCR, no texto OCR completo.
- [ ] Verificar vista movil.

## Google Apps Script

- [ ] Crear Google Sheet operativa.
- [ ] Copiar el ID en `apps_script/Code.gs`.
- [ ] Crear proyecto Apps Script.
- [ ] Subir `Code.gs` y `appsscript.json`.
- [ ] Ejecutar `setup()`.
- [ ] Verificar hojas `ANALISIS`, `LOGS` y `REVISTAS`.
- [ ] Desplegar como Web App.
- [ ] Probar `?action=health`.
- [ ] Configurar endpoint en `window.RECOMENDADOR_CONFIG.gasEndpoint`.
- [ ] Confirmar registro de metadatos desde frontend.

## GitHub Pages

- [ ] Publicar carpeta de app o copiar archivos a rama/sitio definido.
- [ ] Confirmar que `index.html`, `app.js`, `styles.css`, `data/journals_seed.js`, `manifest.webmanifest` y `service-worker.js` estan accesibles.
- [ ] Probar URL publica en escritorio.
- [ ] Probar URL publica en movil.
- [ ] Validar que GitHub Pages y GAS respondan por separado.
- [ ] Actualizar README con URL publica.
- [ ] Registrar version y evidencia en bitacora.

## Datos y criterios

- [ ] Revisar manualmente cada criterio metodologico.
- [ ] Crear matriz por tipo de estudio.
- [ ] Incorporar criterios para revision sistematica, cualitativo, mixto, simulacion y articulo metodologico.
- [ ] Revisar manualmente cada ficha de revista.
- [ ] Completar campos no verificados.
- [ ] Agregar estado de validacion por registro.

## Seguridad

- [ ] No publicar credenciales ni IDs sensibles.
- [ ] Proteger hojas de configuracion.
- [ ] Definir roles reales si la app pasa a produccion.
- [ ] Evitar guardar manuscritos completos.
- [ ] Informar al usuario si se sincronizan metadatos al backend.
