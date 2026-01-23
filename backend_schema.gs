/**
 * SISTEMA SUITORG - BACKEND v3.5.1
 * VERSION: v3.5.1 (Security Enforcement)
 * DATE: 2026-01-22 21:55
 * UPDATE: Reinforced API security, ping token requirement, and multi-tenant data leak protection.
 * AUDIT_LINES: 345
 * */

const CONFIG = {
  VERSION: "3.5.1 (Security Enforcement)",
  // NO HARCODEAR LLAVES AQUÍ. Usar Propiedades del Script en el editor de Apps Script.
  GEMINI_API_KEY: PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY') || "",
  API_AUTH_TOKEN: PropertiesService.getScriptProperties().getProperty('API_AUTH_TOKEN') || "SUITORG_DEFAULT_TOKEN",
  BACKUP_RETENTION_DAYS: 60
};

/* =========================================
   API DIAGNOSTICS
   ========================================= */

function verificarConfiguracion() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const faltantes = [];
  if (!props.GEMINI_API_KEY) faltantes.push("GEMINI_API_KEY");
  if (!props.API_AUTH_TOKEN) faltantes.push("API_AUTH_TOKEN");
  
  if (faltantes.length > 0) {
    console.error("⚠️ SEGURIDAD CRÍTICA: Faltan variables en Propiedades del Script: " + faltantes.join(", "));
    return false;
  }
  console.log("✅ Configuración de seguridad validada.");
  return true;
}

/* =========================================
   API ENDPOINTS (doGet / doPost)
   ========================================= */

function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || "ping";
  const token = params.token || "";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Security Check for all private and administrative data
  if (token !== CONFIG.API_AUTH_TOKEN) {
    return jsonResponse({status: "ERROR", message: "No autorizado. Token inválido.", success: false});
  }

  // Public/Semi-public action (Ping only works with token now for anti-reconnaissance)
  if (action === "ping") return jsonResponse({status: "online", version: CONFIG.VERSION});
  
  if (action === "getAll") {
    const data = {};
    const businessId = (params.id_empresa || "").toString().trim().toUpperCase();
    
    if (!businessId) return jsonResponse({error: "ID de Empresa requerido para sincronizar."});

    const sheets = [
        "Prompts", "Config_Empresas", "Config_Roles", "Config_Flujo_Proyecto", "Config_Galeria",
        "Catalogo", "Usuarios", "Leads", "Proyectos", "Proyectos_Etapas",
        "Proyectos_Materiales", "Proyectos_Pagos", "Pagos", "Proyectos_Bitacora",
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
        
        // TABLAS COMPARTIDAS (Visibles para el HUB o portales públicos)
        const sharedTables = ["Config_Empresas", "Config_Roles", "Prompts_IA"];

        // SEGURIDAD: Filtrado multi-inquilino inteligente
        mapped = mapped.filter(item => {
           const itemCo = (item.id_empresa || "").toString().trim().toUpperCase();
           
           // 1. Si la tabla es compartida, permitimos ver todo (El Hub necesita esto)
           if (sharedTables.includes(name)) return true; 

           // 2. Si es privada, solo permitimos ver lo que pertenece a la empresa actual o GLOBAL
           return itemCo === businessId || itemCo === "GLOBAL";
        });
        
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
        const token = data.token; // Nuevo campo obligatorio
        
        // Security Check
        if (token !== CONFIG.API_AUTH_TOKEN) {
          return jsonResponse({error: "No autorizado. Token inválido.", success: false});
        }
        
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let result = { success: true };

        // --- 0. INITIALIZATION & REPAIR ---
        if(action === "initializeRbac") {
            const tables = {
                "Usuarios": ["id_usuario", "id_empresa", "nombre", "email", "password", "rol", "nivel_acceso", "creditos", "fecha_limite_acceso", "activo", "fecha_creacion"],
                "Config_Roles": ["id_empresa", "id_rol", "nombre_rol", "nivel_acceso", "creditos_base", "vigencia_dias", "modulos_visibles"],
                "Prompts_IA": ["id_agente", "id_empresa", "nombre", "prompt_base", "habilitado", "nivel_acceso", "recibe_files"],
                "Atencion_Cliente": ["id_reporte", "id_empresa", "nombre", "telefono", "email", "queja", "estado", "fecha_creacion"],
                "Config_SEO": ["id_empresa", "division", "id_cluster", "titulo", "icono", "keywords_coma"],
                "Config_Empresas": ["id_empresa", "nomempresa", "logo_url", "color_tema", "eslogan", "descripcion", "tipo_negocio", "usa_features_estandar", "costo_envio"],
                "Catalogo": ["id_empresa", "id_producto", "nombre", "descripcion", "precio", "stock", "activo", "categoria", "Etiqueta_Promo"],
                "Leads": ["id_empresa", "id_lead", "nombre", "email", "telefono", "estado", "activo", "direccion"],
                "Proyectos": ["id_empresa", "id_proyecto", "id_cliente", "nombre_proyecto", "status", "line_items", "activo", "descripcion", "fecha_inicio", "codigo_otp"],
                "Proyectos_Pagos": ["id_empresa", "id_proyecto", "monto", "metodo_pago", "folio", "fecha_pago", "concepto", "referencia"],
                "Pagos": ["id_empresa", "id_proyecto", "monto", "metodo_pago", "folio", "fecha_pago"]
            };

            for (let name in tables) {
                crearTabla(ss, name, tables[name]);
                const s = ss.getSheetByName(name);
                const currentHeaders = s.getRange(1,1,1,s.getLastColumn()).getValues()[0];
                tables[name].forEach(h => {
                    if (currentHeaders.indexOf(h) === -1) s.getRange(1, s.getLastColumn() + 1).setValue(h);
                });
            }

            // Seeds
            ensureSeed(ss, "Prompts_IA", "id_agente", [
                ["AGT-001", "GLOBAL", "Soporte Técnico", "Eres un experto en soporte técnico para los sistemas de Grupo EVASOL y SuitOrg. Tu objetivo es ayudar a los clientes con sus dudas y si detectas una queja o reporte formal, genera un JSON con el formato: { \"nombre\": \"...\", \"telefono\": \"...\", \"queja\": \"...\" }. Si el cliente ya no tiene más dudas, despídete amablemente y termina con la frase: *(Cerrando pantalla del chat...)* para que el sistema cierre el modal automáticamente.", "TRUE", "0", "FALSE"]
            ]);

            return jsonResponse({ success: true, msg: "v3.4.6 (Support Seed) Integrity Verified." });
        }

        // --- 1. DATA ACTIONS (Food & Projects) ---
        else if(action === "createLead") {
            const sh = ss.getSheetByName("Leads");
            const newId = "LEAD-" + (sh.getLastRow() + 1);
            const leadData = { ...data.lead, id_lead: newId, activo: "TRUE", estado: data.lead.estado || "NUEVO" };
            appendToSheetByHeader(sh, leadData);
            return jsonResponse({success: true, newId: newId});
        }

        else if(action === "createProject") {
            const sh = ss.getSheetByName("Proyectos");
            const newId = "ORD-" + (sh.getLastRow() + 1);
            const projData = { ...data.project, id_proyecto: newId, activo: "TRUE", status: data.project.status || data.project.estado || "PEDIDO-RECIBIDO" };
            appendToSheetByHeader(sh, projData);
            return jsonResponse({success: true, newId: newId});
        }

        else if(action === "addProjectPayment") {
            const paymentData = { ...data.payment, fecha_pago: new Date() };
            // Save to Proyectos_Pagos (VTS Standard)
            const shPP = ss.getSheetByName("Proyectos_Pagos");
            if(shPP) appendToSheetByHeader(shPP, paymentData);
            // Also Save to Pagos (Legacy/Repeat Support as requested)
            const shP = ss.getSheetByName("Pagos");
            if(shP) appendToSheetByHeader(shP, paymentData);
            
            return jsonResponse({success: true});
        }

        else if(action === "updateProduct") {
          const sh = ss.getSheetByName("Catalogo");
          const rows = sh.getDataRange().getValues();
          const headers = rows[0];
          const colIdProd = headers.indexOf("id_producto");
          const colIdEmp = headers.indexOf("id_empresa");
          const colStock = headers.indexOf("stock");

          if (colIdProd === -1 || colStock === -1) return jsonResponse({error: "Columnas no encontradas"});

          // Support for Batch Updates (Array) or Single Update
          const updates = Array.isArray(data.products) ? data.products : [data.product];
          let updatedCount = 0;

          updates.forEach(update => {
            const pId = String(update.id_producto || "").trim();
            const eId = String(update.id_empresa || app.state?.companyId || "").trim();
            const newStock = update.stock;

            for(let i=1; i<rows.length; i++) {
              const rowIdProd = String(rows[i][colIdProd] || "").trim();
              const rowIdEmp = colIdEmp !== -1 ? String(rows[i][colIdEmp] || "").trim() : "";
              
              if(rowIdProd === pId && (eId === "" || rowIdEmp === eId)) {
                sh.getRange(i+1, colStock + 1).setValue(newStock); 
                updatedCount++;
                break;
              }
            }
          });
          
          return jsonResponse({success: true, updated: updatedCount});
        }

        // --- 2. EXISTING ACTIONS ---
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
                    const res = UrlFetchApp.fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
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

/**
 * Robust Appender: Maps object keys to sheet headers.
 * Ensures data lands in correct columns regardless of spreadsheet order.
 */
function appendToSheetByHeader(sh, dataObj) {
    const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    const rowContent = new Array(headers.length).fill("");
    
    headers.forEach((header, i) => {
        const key = header.toLowerCase().trim();
        // Check for direct match or variations
        if (dataObj[header] !== undefined) rowContent[i] = dataObj[header];
        else if (dataObj[key] !== undefined) rowContent[i] = dataObj[key];
        else if (key === "status" && dataObj.estado) rowContent[i] = dataObj.estado;
        else if (key === "estado" && dataObj.status) rowContent[i] = dataObj.status;
        else if (key === "fecha_pago" || key === "fecha_creacion") rowContent[i] = new Date();
    });
    
    sh.appendRow(rowContent);
}
