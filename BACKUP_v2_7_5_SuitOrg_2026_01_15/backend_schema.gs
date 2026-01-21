/**
 * SISTEMA EVASOL - BACKEND v2.7.0
 * Versión: 2.7.0
 * Fecha: 2026-01-15
 * Hora: 10:48:00
 * Líneas: 362
 * 
 * CAMBIOS:
 * - Implementación de Flujo de Proyecto Dinámico (Gestión de Temperatura).
 * - Tabla Config_Flujo_Proyecto para pesos porcentuales y estados.
 * - Soporte para RBAC y Persistencia de Créditos mejorada.
 */

const CONFIG = {
  VERSION: "2.7.0",
  ID_SHEET: "", 
  BACKUP_RETENTION_DAYS: 60,
  GEMINI_API_KEY: "AIzaSyARtQDMaNnqUthixeFRH9-PB3ych4E7btI",
  WA_TOKEN: "TU_META_ACCESS_TOKEN",
  WA_PHONE_ID: "TU_PHONE_NUMBER_ID"
};

/* =========================================
   API ENDPOINTS (doGet / doPost)
   ========================================= */

function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || "ping";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === "ping") {
    return jsonResponse({status: "online", version: CONFIG.VERSION});
  }
  
  if (action === "getAll") {
    const data = {};
    const sheets = [
        "Prompts", "Config_Empresas", "Config_Roles", "Config_Flujo_Proyecto",
        "Catalogo", "Usuarios", "Leads", "Proyectos", "Proyectos_Etapas",
        "Proyectos_Materiales", "Proyectos_Pagos", "Proyectos_Bitacora",
        "Empresa_Documentos", "Logs", "Prompts_IA"
    ];
    
    sheets.forEach(name => {
      const s = ss.getSheetByName(name);
      if(s) {
        const rows = s.getDataRange().getValues();
        const headers = rows.shift();
        data[name] = rows.map(row => {
          let obj = {};
          headers.forEach((h, i) => obj[h] = row[i]);
          return obj;
        });
      } else { data[name] = []; }
    });
    return jsonResponse(data);
  }
  
  return jsonResponse({error: "Action not found"});
}

function doPost(e) {
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(15000)) return jsonResponse({error: "Servidor ocupado", success: false});

    try {
        if(!e || !e.postData) return jsonResponse({error: "No data sent"});
        const data = JSON.parse(e.postData.contents);
        const action = data.action;
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let result = { success: true };

        // --- 0. INITIALIZATION ---
        if(action === "initializeRbac") {
            const rolesHeaders = ["id_rol", "nombre_rol", "nivel_acceso", "creditos_base", "vigencia_dias", "modulos_visibles"];
            crearTabla(ss, "Config_Roles", rolesHeaders);
            
            // Add initial column to Config_Empresas if not exists
            const confSheet = ss.getSheetByName("Config_Empresas");
            if(confSheet) {
                const headers = confSheet.getRange(1, 1, 1, confSheet.getLastColumn()).getValues()[0];
                if(headers.indexOf("origen_politicas") === -1) {
                    confSheet.getRange(1, confSheet.getLastColumn() + 1).setValue("origen_politicas");
                }
            }
            
            // Ensure Usuarios has username and id_rol
            const userSheet = ss.getSheetByName("Usuarios");
            if(userSheet) {
                const h = userSheet.getRange(1, 1, 1, userSheet.getLastColumn()).getValues()[0];
                if(h.indexOf("username") === -1) {
                    userSheet.getRange(1, userSheet.getLastColumn() + 1).setValue("username");
                }
                if (h.indexOf("id_rol") === -1) {
                    userSheet.getRange(1, userSheet.getLastColumn() + 1).setValue("id_rol");
                }
            }

            // Create Project Flow Table
            const flowHeaders = ["id_fase", "nombre_fase", "peso_porcentaje", "orden", "color_hex", "descripcion"];
            crearTabla(ss, "Config_Flujo_Proyecto", flowHeaders);

            return jsonResponse({ success: true, msg: "Tablas de Roles, Usuarios y Flujo de Proyecto inicializados correctamente." });
        }

        // --- 1. AGENTES IA (GEMINI) ---
        if(action === "askGemini") {
            const apiKey = (CONFIG.GEMINI_API_KEY || "").trim();
            const history = data.history || [];
            const contents = history.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }]
            }));
            const promptBase = data.promptBase || "";
            if (promptBase && contents.length > 0) {
                contents[0].parts[0].text = `[RULES: ${promptBase}]\n\nUSER: ${contents[0].parts[0].text}`;
            }

            // Modelos EXTRAÍDOS de tu lista de diagnóstico real
            const models = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest", "gemini-2.0-flash-exp"];
            let lastErr = "";

            for (let modelId of models) {
                try {
                    const apiVer = "v1beta"; 
                    const url = `https://generativelanguage.googleapis.com/${apiVer}/models/${modelId}:generateContent?key=${apiKey}`;
                    const payload = {
                        contents: contents.map(c => ({
                            role: c.role,
                            parts: c.parts.map(p => ({ text: p.text }))
                        }))
                    };
                    const res = UrlFetchApp.fetch(url, {
                        method: "POST", contentType: "application/json",
                        payload: JSON.stringify(payload), muteHttpExceptions: true
                    });
                    const resJson = JSON.parse(res.getContentText());
                    
                    if (resJson.candidates && resJson.candidates[0].content) {
                        return jsonResponse({ 
                            success: true, 
                            modelUsed: `${modelId} (${apiVer})`, 
                            answer: resJson.candidates[0].content.parts[0].text 
                        });
                    }
                    lastErr = `[${modelId}] ` + (resJson.error ? resJson.error.message : "Sin respuesta");
                    try { ss.getSheetByName("Logs").appendRow([new Date(), "DEBUG", "AI_FAILURE", modelId, lastErr]); } catch(e){}
                } catch (e) { lastErr = e.toString(); }
            }
            
            return jsonResponse({ success: false, error: "Verifica tu API Key en AI Studio.", detail: lastErr });
        }

        else if(action === "listAiModels") {
            const apiKey = (CONFIG.GEMINI_API_KEY || "").trim();
            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            const res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
            return jsonResponse(JSON.parse(res.getContentText()));
        }

        // --- 2. GESTIÓN DE LEADS ---
        else if(action === "createLead") {
            const s = ss.getSheetByName("Leads");
            const newId = generateId(s, "LEAD", 1); 
            const companyId = data.lead.id_empresa || "EVASOL";
            const row = [
                newId, companyId, data.lead.nombre, data.lead.telefono, data.lead.email,
                data.lead.direccion, data.lead.origen, "NUEVO", "", new Date()
            ];
            s.appendRow(row);
            result.newId = newId;

            try {
              const companyConfig = getCompanyConfig(companyId);
              if (companyConfig) sendAdminAlert(data.lead, companyConfig);
            } catch (e) { console.error("Error alerta: " + e.toString()); }
        }

        // --- 3. GESTIÓN DE PRODUCTOS ---
        else if(action === "createProduct") {
            const s = ss.getSheetByName("Catalogo");
            const newId = generateId(s, "PROD", 2);
            const row = [ "EVASOL", newId, data.product.categoria, data.product.nombre, "", data.product.precio, data.product.precio, data.product.unidad, false, data.product.stock, "", true ];
            s.appendRow(row);
            result.newId = newId;
        }

        // --- 4. GESTIÓN DE PROYECTOS ---
        else if(action === "createProject") {
            const s = ss.getSheetByName("Proyectos");
            const newId = generateId(s, "PROJ", 1);
            const row = [ newId, "EVASOL", data.project.id_cliente, data.project.nombre_proyecto, data.project.estado, "ADMIN", data.project.fecha_inicio, data.project.fecha_fin ];
            s.appendRow(row);
            result.newId = newId;
        }

        // --- 5. ELIMINACIÓN GENÉRICA ---
        else if(action === "deleteItem") {
            const sheetName = data.type;
            const id = data.id;
            const s = ss.getSheetByName(sheetName);
            if(!s) return jsonResponse({error: "Sheet not found"});
            let colIndex = 0; 
            if(sheetName === "Catalogo") colIndex = 1;
            const rows = s.getDataRange().getValues();
            let rowIndexToDelete = -1;
            for(let i = 1; i < rows.length; i++) {
                if(String(rows[i][colIndex]) === String(id)) {
                    rowIndexToDelete = i + 1;
                    break;
                }
            }
            if(rowIndexToDelete > -1) {
                s.deleteRow(rowIndexToDelete);
                result.deletedId = id;
            } else { return jsonResponse({error: "ID not found", success: false}); }
        }
        
        // --- 6. BITÁCORA Y ETAPAS ---
        else if(action === "addProjectLog") {
            const s = ss.getSheetByName("Proyectos_Bitacora");
            const newId = generateId(s, "LOG", 1);
            const row = [newId, data.log.id_proyecto, data.log.tipo_evento, data.log.detalle, data.log.usuario || "SISTEMA", new Date()];
            s.appendRow(row);
            result.newId = newId;
        }

        else if(action === "updateProjectStage") {
            const s = ss.getSheetByName("Proyectos_Etapas");
            const projectId = data.stage.id_proyecto;
            const stageName = data.stage.nombre_etapa;
            const rows = s.getDataRange().getValues();
            let found = false;
            for(let i = 1; i < rows.length; i++) {
                if(rows[i][1] === projectId && rows[i][2] === stageName) {
                    s.getRange(i+1, 4).setValue(data.stage.estado);
                    found = true;
                    break;
                }
            }
            if(!found) {
                const newId = generateId(s, "STG", 1);
                const row = [newId, projectId, stageName, data.stage.estado, data.stage.fecha_compromiso, data.stage.completada, new Date()];
                s.appendRow(row);
                result.newId = newId;
            }
        }

        // --- 7. CRÉDITOS Y SEGURIDAD ---
        else if(action === "deductGlobalCredit") {
            const s = ss.getSheetByName("Config_Empresas");
            const companyId = data.id_empresa;
            const rows = s.getDataRange().getValues();
            const headers = rows[0];
            const modIndex = headers.indexOf("creditos_totales");
            const idIndex = headers.indexOf("id_empresa");
            
            for(let i = 1; i < rows.length; i++) {
                if(rows[i][idIndex] === companyId) {
                    const current = parseInt(rows[i][modIndex]) || 0;
                    if(current > 0) s.getRange(i+1, modIndex+1).setValue(current - 1);
                    break;
                }
            }
        }

        else if(action === "deductUserCredit") {
            const s = ss.getSheetByName("Usuarios");
            const userId = data.id_usuario;
            const rows = s.getDataRange().getValues();
            const headers = rows[0];
            const credIndex = headers.indexOf("creditos");
            const idIndex = headers.indexOf("id_usuario");

            for(let i = 1; i < rows.length; i++) {
                if(rows[i][idIndex] === userId) {
                    const current = parseInt(rows[i][credIndex]) || 0;
                    if(current > 0) s.getRange(i+1, credIndex+1).setValue(current - 1);
                    break;
                }
            }
        }

        return jsonResponse(result);
    } catch(err) {
        return jsonResponse({error: err.toString(), success: false});
    } finally { lock.releaseLock(); }
}

/* =========================================
   FUNCIONES DE SOPORTE E IA
   ========================================= */

function sendAdminAlert(lead, config) {
  const adminEmail = config.correoempresarial;
  const adminPhone = config.telefonowhatsapp;
  const companyName = config.nomempresa || "EVASOL";
  const message = `🚨 NUEVO LEAD (${companyName}): ${lead.nombre}\n\nTel: ${lead.telefono}\nEmail: ${lead.email}`;

  if (adminEmail && adminEmail.includes("@")) { MailApp.sendEmail({ to: adminEmail, subject: `🚨 NUEVO LEAD: ${lead.nombre}`, body: message }); }

  if (CONFIG.WA_TOKEN && CONFIG.WA_PHONE_ID && adminPhone) {
    const url = `https://graph.facebook.com/v18.0/${CONFIG.WA_PHONE_ID}/messages`;
    const payload = { messaging_product: "whatsapp", to: adminPhone, type: "text", text: { body: message } };
    try { UrlFetchApp.fetch(url, { method: "POST", contentType: "application/json", headers: { "Authorization": `Bearer ${CONFIG.WA_TOKEN}` }, payload: JSON.stringify(payload), muteHttpExceptions: true }); } 
    catch (e) {}
  }
}

function getCompanyConfig(companyId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Config_Empresas");
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const companyRow = data.find(row => row[headers.indexOf("id_empresa")] === companyId);
  if (!companyRow) return null;
  const config = {};
  headers.forEach((h, i) => config[h] = companyRow[i]);
  return config;
}

function generateId(sheet, prefix, colIndex) {
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return prefix + "-1"; 
    const lastId = sheet.getRange(lastRow, colIndex).getValue();
    if (typeof lastId === 'string' && lastId.includes("-")) {
        const parts = lastId.split("-");
        const num = parseInt(parts[parts.length - 1]);
        if (!isNaN(num)) return prefix + "-" + (num + 1);
    }
    return prefix + "-" + lastRow; 
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function syncDriveFiles(idEmpresa, folderId) {
  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Empresa_Documentos");
    if(!sheet) return { success: false };
    while (files.hasNext()) {
      const file = files.next();
      sheet.appendRow(["DOC-" + Utilities.getUuid().substring(0,8), idEmpresa, file.getId(), file.getName(), file.getMimeType(), new Date().toISOString()]);
    }
    return { success: true };
  } catch(e) { return { error: e.toString(), success: false }; }
}

function crearTabla(ss, nombre, headers) {
  let s = ss.getSheetByName(nombre);
  if(!s) { 
      s = ss.insertSheet(nombre); 
      s.appendRow(headers); 
      s.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#E0E0E0");
      s.setFrozenRows(1); 
  }
}
