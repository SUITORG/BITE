/**
 * SISTEMA SUITORG - BACKEND v3.3.7
 * VERSION: v3.3.7
 * DATE: 2026-01-20
 * UPDATE: Robust Seed Protocol (ensureSeed).
 * AUDIT_LINES:
 * - app.js: 3,210
 * - style.css: 1,694
 * - index.html: 1,142
 * - backend_schema.gs: 221
 * - TOTAL: 6,267
 */

const CONFIG = {
  VERSION: "3.3.7",
  ID_SHEET: "", 
  BACKUP_RETENTION_DAYS: 60,
  GEMINI_API_KEY: "AIzaSyARtQDMaNnqUthixeFRH9-PB3ych4E7btI",
};

/* =========================================
   API ENDPOINTS (doGet / doPost)
   ========================================= */

function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || "ping";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === "ping") return jsonResponse({status: "online", version: CONFIG.VERSION});
  
  if (action === "getAll") {
    const data = {};
    const businessId = params.id_empresa;
    
    const sheets = [
        "Prompts", "Config_Empresas", "Config_Roles", "Config_Flujo_Proyecto", "Config_Galeria",
        "Catalogo", "Usuarios", "Leads", "Proyectos", "Proyectos_Etapas",
        "Proyectos_Materiales", "Proyectos_Pagos", "Proyectos_Bitacora",
        "Empresa_Documentos", "Logs", "Prompts_IA", "Config_SEO"
    ];
    
    sheets.forEach(name => {
      const s = ss.getSheetByName(name);
      if(s) {
        const rows = s.getDataRange().getValues();
        if (rows.length === 0) { data[name] = []; return; }
        const headers = rows.shift();
        let mapped = rows.map(row => {
          let obj = {};
          headers.forEach((h, i) => obj[h] = row[i]);
          return obj;
        });
        
        const exempt = ["Config_Empresas", "Prompts_IA", "Usuarios"];
        if (businessId && mapped.length > 0 && mapped[0].hasOwnProperty('id_empresa') && !exempt.includes(name)) {
          mapped = mapped.filter(item => (item.id_empresa || "").toString().trim().toUpperCase() === businessId.toUpperCase() || (item.id_empresa || "").toString().trim().toUpperCase() === "GLOBAL");
        }
        
        data[name] = mapped;
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

        // --- 0. INITIALIZATION & REPAIR ---
        if(action === "initializeRbac") {
            // Ensure Tables Exist
            const tables = {
                "Usuarios": ["id_usuario", "id_empresa", "nombre", "email", "password", "rol", "nivel_acceso", "creditos", "fecha_limite_acceso", "activo", "fecha_creacion"],
                "Config_Roles": ["id_empresa", "id_rol", "nombre_rol", "nivel_acceso", "creditos_base", "vigencia_dias", "modulos_visibles"],
                "Prompts_IA": ["id_agente", "id_empresa", "nombre", "prompt_base", "habilitado", "nivel_acceso", "recibe_files"],
                "Atencion_Cliente": ["id_reporte", "id_empresa", "nombre", "telefono", "email", "queja", "estado", "fecha_creacion"],
                "Config_SEO": ["id_empresa", "division", "id_cluster", "titulo", "icono", "keywords_coma"],
                "Catalogo": ["id_empresa", "id_producto", "nombre", "descripcion", "precio", "stock", "activo"],
                "Leads": ["id_empresa", "id_lead", "nombre", "email", "telefono", "estado", "activo"],
                "Proyectos": ["id_empresa", "id_proyecto", "id_lead", "nombre", "status", "line_items", "activo"]
            };

            for (let name in tables) {
                crearTabla(ss, name, tables[name]);
                // Ensure columns like 'activo' or 'id_empresa' for existing tables
                const s = ss.getSheetByName(name);
                const currentHeaders = s.getRange(1,1,1,s.getLastColumn()).getValues()[0];
                tables[name].forEach(h => {
                    if (currentHeaders.indexOf(h) === -1) s.getRange(1, s.getLastColumn() + 1).setValue(h);
                });
            }

            // --- SYNC SEEDS ---
            ensureSeed(ss, "Config_Roles", "id_rol", [
                ["GLOBAL", "ADMIN", "Administrador Principal", 10, 999, 365, "dashboard,leads,projects,catalog,knowledge,agents,reports,pos,staff-pos"],
                ["GLOBAL", "CAJERO", "Cajero POS", 3, 100, 365, "dashboard,staff-pos,pos"]
            ]);

            ensureSeed(ss, "Prompts_IA", "id_agente", [
                ["AGT-001", "GLOBAL", "Soporte Técnico", "Recopila nombre, teléfono y queja del cliente. Una vez tengas los datos, confirma el reporte.", true, 0, false]
            ]);

            return jsonResponse({ success: true, msg: "v3.3.7 Integrity Verified." });
        }

        // --- 1. AGENTES IA ---
        else if(action === "askGemini") {
            const apiKey = (CONFIG.GEMINI_API_KEY || "").trim();
            const history = data.history || [];
            const contents = history.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }]
            }));
            
            const models = [data.model, "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"];
            let lastErr = "";
            for (let m of models.filter(v => v)) {
                try {
                    const res = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1/models/${m}:generateContent?key=${apiKey}`, {
                        method: "POST", contentType: "application/json",
                        payload: JSON.stringify({ contents: contents, system_instruction: data.promptBase ? { parts: [{ text: data.promptBase }] } : undefined }),
                        muteHttpExceptions: true
                    });
                    const resJson = JSON.parse(res.getContentText());
                    if (resJson.candidates) return jsonResponse({ success: true, modelUsed: m, answer: resJson.candidates[0].content.parts[0].text });
                    lastErr = resJson.error ? resJson.error.message : "No candidates";
                } catch (e) { lastErr = e.toString(); }
            }
            return jsonResponse({ success: false, error: "AI Error", detail: lastErr });
        }

        else if(action === "createSupportTicket") {
            const s = ss.getSheetByName("Atencion_Cliente");
            const newId = generateId(s, "REP", 1);
            const t = data.ticket;
            s.appendRow([newId, t.id_empresa, t.nombre, t.telefono, t.email, t.queja, "PENDIENTE", new Date()]);

            try {
                const coSheet = ss.getSheetByName("Config_Empresas");
                const coRows = coSheet.getDataRange().getValues();
                const headers = coRows[0];
                const busIdx = headers.indexOf("id_empresa");
                const emailIdx = headers.indexOf("email");
                const company = coRows.find(r => r[busIdx] === t.id_empresa);
                const mail = company ? company[emailIdx] : "soporte@evasol.mx";
                if (mail) MailApp.sendEmail(mail, `🟢 Nuevo Reporte - ${t.nombre}`, `Cliente: ${t.nombre}\nQueja: ${t.queja}\n\nSistema SuitOrg`);
            } catch (e) {}
            result.newId = newId;
        }
        
        else if(action === "logicalDelete") {
            const s = ss.getSheetByName(data.type);
            const rows = s.getDataRange().getValues();
            const h = rows[0];
            const idIdx = h.indexOf(data.type === 'Leads' ? 'id_lead' : (data.type === 'Proyectos' ? 'id_proyecto' : 'id_producto'));
            const actIdx = h.indexOf("activo");
            for(let i=1; i<rows.length; i++) {
                if(rows[i][idIdx] === data.id) { s.getRange(i+1, actIdx+1).setValue("FALSE"); break; }
            }
        }

        return jsonResponse(result);
    } catch (e) { return jsonResponse({ success: false, error: e.toString() }); }
    finally { lock.releaseLock(); }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function generateId(sheet, prefix, colIndex) {
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return prefix + "-1001";
  const lastId = rows[rows.length - 1][colIndex-1].toString();
  const num = parseInt(lastId.split('-')[1]) + 1;
  return prefix + "-" + num;
}

function crearTabla(ss, nombre, headers) {
  let s = ss.getSheetByName(nombre);
  if(!s) { 
      s = ss.insertSheet(nombre); s.appendRow(headers); 
      s.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#F3F3F3");
  }
}

/**
 * Robust Seed Upsert
 * Checks if a row exists by matching its ID in a specific column.
 */
function ensureSeed(ss, sheetName, idColName, seeds) {
    const s = ss.getSheetByName(sheetName);
    if (!s) return;
    const data = s.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf(idColName);
    if (idIdx === -1) return;

    seeds.forEach(row => {
        const idValue = row[idIdx] || row[0]; // Assume first element is ID if not aligned
        const exists = data.some(r => r[idIdx] === idValue);
        if (!exists) {
            // Align row to headers if sizes differ
            const rowToTable = new Array(headers.length).fill("");
            row.forEach((val, i) => { if (i < headers.length) rowToTable[i] = val; });
            s.appendRow(rowToTable);
        }
    });
}
