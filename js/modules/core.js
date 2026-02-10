/**
 * 
 * Responsabilidad: Estado global, carga de datos y utilidades base.
 */
const app = {
    // --- APP CONFIG ---
    version: '4.9.0', // v4.9.0: Visual Refinement (Colorful social icons and footer links).

    // Se cargan desde js/modules/config.js (ignorado en git)
    apiUrl: (typeof SUIT_CONFIG !== 'undefined') ? SUIT_CONFIG.apiUrl : '',
    apiToken: (typeof SUIT_CONFIG !== 'undefined') ? SUIT_CONFIG.apiToken : '',
    data: {
        Config_Empresas: [],
        Usuarios: [],
        Leads: [],
        Catalogo: [],
        Proyectos: [],
        Config_Roles: [],
        Config_Flujo_Proyecto: [],
        Config_Galeria: [],
        Empresa_Documentos: [],
        Logs: [],
        Prompts_IA: [],
        Config_SEO: [],
        Cuotas_Pagos: []
    },
    state: {
        currentUser: null,
        companyId: null,
        lastActivity: Date.now(),
        currentAgent: null,
        chatHistory: [],
        cart: [],
        deliveryMethod: 'PICKUP',
        posFilter: 'PEDIDO-RECIBIDO', // v4.4.9: Ahora inicia en 'Nuevos' por defecto
        reportPaymentFilter: 'TODOS',
        activeReportSubtype: 'general',
        _isUpdatingStatus: false,
        _recentStatusCache: {},
        _chartSales: null,
        _chartPay: null,
        _consoleStarted: false
    },
    utils: {
        fixDriveUrl: (url) => {
            if (!url) return "";
            const sUrl = url.toString().trim();

            // Extracción universal de ID de Google Drive
            // Soporta: /file/d/{ID}, ?id={ID}, /d/{ID}
            const idMatch = sUrl.match(/\/d\/([^\/?#]+)/) || sUrl.match(/[?&]id=([^&?#]+)/) || sUrl.match(/\/file\/d\/([^\/?#]+)/);

            // Si es un enlace de Google Drive válido y tenemos ID, usamos el servicio lh3
            // Este servicio es el más robusto para imágenes públicas (Agent y Productos)
            if (idMatch && idMatch[1] && (sUrl.includes('google.com') || sUrl.includes('drive.google.com'))) {
                return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
            }

            // Si no detectamos ID de Drive, devolvemos la URL original (ej: unsplash, cloudinary, etc)
            return sUrl;
        },



        getEffectivePrice: (p) => {
            if (!p) return 0;
            const reg = parseFloat(p.precio) || 0;
            const off = parseFloat(p.precio_oferta || p.Precio_Oferta) || 0;
            return (reg > 0 && off > 0) ? Math.min(reg, off) : (off || reg || 0);
        },
        playNotification: () => {
            // v4.7.5: Se reemplaza campanilla por pop suave (mismos parámetros que click pero otro tono)
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.1);
            } catch (e) { }
        },
        playClick: () => {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.05);
            } catch (e) { }
        },
        getCoId: (p) => {
            return (p.id_empresa || p.empresa || p.company || "SuitOrg").toString().trim().toUpperCase();
        },
        sanitizeString: (str) => {
            if (typeof str !== 'string') return str;
            // Comprehensive mojibake replacement filter
            return str
                .replace(/ñƒ³/g, "ó").replace(/ñƒâ€œ/g, "Ó").replace(/ñƒ¡/g, "á")
                .replace(/ñƒ©/g, "é").replace(/ñƒ­/g, "í").replace(/ñƒº/g, "ú")
                .replace(/ñƒâ€°/g, "É").replace(/ñ‚©/g, "©").replace(/ñ‚¡/g, "¡")
                .replace(/ñƒ/g, "ñ").replace(/ñš/g, "Ú")
                .replace(/Ã¡/g, "á").replace(/Ã©/g, "é").replace(/Ã\xad/g, "í")
                .replace(/Ã³/g, "ó").replace(/Ãº/g, "ú").replace(/Ã±/g, "ñ")
                .trim();
        }
    },
    init: async () => {
        try {
            console.log("🚀 Iniciando Orquestador EVASOL...");
            // Revelar Hub inmediatamente si el hash es #orbit
            if (window.location.hash === '#orbit' || !window.location.hash) {
                const orbit = document.getElementById('view-orbit');
                if (orbit) orbit.classList.remove('hidden');
            }
            // 1. Manejar parámetros de URL
            const urlParams = new URLSearchParams(window.location.search);
            const coParam = urlParams.get('co');
            if (coParam) app.state.companyId = coParam;
            // 2. Vincular eventos y monitor
            if (app.ui && app.ui.bindEvents) app.ui.bindEvents();
            if (app.monitor && app.monitor.start) app.monitor.start();
            // 3. Sincronizar con la nube
            const loaded = await app.loadData();
            const loader = document.getElementById('loading-overlay');
            if (loader) loader.remove();
            if (loaded) {
                // ORCHESTRATION LOGIC (v3.8 - Hub First)
                let company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
                const isHubMode = window.location.hash === '#orbit' || (!window.location.hash && !coParam);

                if (isHubMode) {
                    console.log("🌌 Hub Mode Active - Rendering Orbit");
                    app.state.companyId = null;
                    window.location.hash = '#orbit';
                    if (app.ui.renderOrbit) app.ui.renderOrbit();
                    company = null;
                } else if (!company) {

                    // Only Auto-Select if we are NOT in hub mode but failed to find the target company (e.g. deep link error)
                    console.warn("Target Company Not Found - Falling back to default");
                    company = app.data.Config_Empresas[0];
                    if (company) app.state.companyId = company.id_empresa;
                }

                if (company && app.ui.applyTheme) app.ui.applyTheme(company);
                if (app.router && app.router.init) app.router.init();
                if (app.ui.updateEstandarBarraST) app.ui.updateEstandarBarraST();
                app.checkBackendVersion();
            } else {
                console.error("[INIT_FAILED] DATA_LOAD_FAILED");
                alert(`Error de conexión con la base de datos.\nDetalle: ${app.state.lastError || 'Servidor inaccesible'}`);
            }
        } catch (err) {
            console.error("CRITICAL_INIT_ERROR:", err);
            alert("Error crítico en el arranque: " + err.message);
        }
    },
    checkBackendVersion: async () => {
        const text = document.getElementById('gs-version-text');
        if (!text) return;
        try {
            const res = await fetch(`${app.apiUrl}?action=ping&token=${app.apiToken}`);
            const data = await res.json();
            if (data.version) {
                // Split by spaces and take the first part (e.g. "4.4.0 260127" -> "4.4.0")
                const backendVer = data.version.split(/\s+/)[0].replace('v', '').trim();
                const frontendVer = app.version.replace('v', '').trim();

                console.log(`[VERSION-SYNC] Backend: ${backendVer} | Frontend: ${frontendVer}`);

                text.innerText = "V: " + data.version; // Show full version string

                if (backendVer === frontendVer) {
                    text.style.color = "#00e676"; // Green: Optimized Sync
                } else {
                    text.style.color = "#ffb300"; // Yellow: Mismatch
                    console.warn(`[VERSION_MISMATCH] B:${backendVer} vs F:${frontendVer}`);
                }
            }
        } catch (e) {
            console.error("[PING_FAILURE]", e);
            text.innerText = "V: OFFLINE";
            text.style.color = "red";
        }
    },
    loadData: async () => {
        try {
            const fetchId = app.state.companyId || "SuitOrg";
            const url = `${app.apiUrl}?action=getAll&id_empresa=${fetchId}&token=${app.apiToken}`;
            console.log(`[DATA_LOAD] Fetching: ${url}`);

            // Simplificamos omitiendo 'mode: cors' para evitar preflight issues en GAS
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP Error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("[DATA_LOAD] Success:", data);

            if (data.status === 'ERROR' || data.error) throw new Error(data.message || data.error);
            if (!data.Config_Empresas) throw new Error("Formato de datos no válido (Config_Empresas missing).");

            const sanitizedData = JSON.parse(JSON.stringify(data), (key, value) =>
                typeof value === 'string' ? app.utils.sanitizeString(value) : value
            );

            // --- RECONCILIACIÓN POR TABLAS (v4.6.5) ---
            let localCache = {};
            try {
                localCache = JSON.parse(localStorage.getItem('suit_status_cache') || '{}');
                if (typeof localCache !== 'object' || localCache === null) localCache = {};
            } catch (e) { localCache = {}; }

            if (sanitizedData.Proyectos) {
                const now = Date.now();
                sanitizedData.Proyectos.forEach(p => {
                    const id = (p.id_proyecto || "").toString().trim().toUpperCase();
                    const cached = localCache[id];

                    if (cached) {
                        const localTs = cached.ts;
                        const age = now - localTs;

                        // PROTOCOLO DE ESCUDO PERSISTENTE (v4.6.6)
                        // Bloqueo de Reversión Autoritatio: Si el cambio local fue hace menos de 2 minutos, 
                        // ignoramos lo que diga el servidor sobre el estatus para este ID.
                        // O si el servidor tiene un timestamp (si existe) que es menor al local.
                        const serverTs = p.fecha_estatus ? new Date(p.fecha_estatus).getTime() : 0;
                        const isServerOlder = isNaN(serverTs) || serverTs < localTs;

                        if (age < 120000 || isServerOlder) { // 2 minutos de gracia o servidor más viejo
                            if (p.status !== cached.status) {
                                console.log(`[SHIELD] Blocking regression for ${id}: Server ${p.status} -> Local ${cached.status} (Age: ${Math.round(age / 1000)}s)`);
                                app.ui.updateConsole(`SHIELD_ACTIVE: ${id.slice(-4)}`);
                                p.status = cached.status;
                                p.estado = cached.status;
                                p.estatus = cached.status;
                            }
                        } else {
                            // Si pasaron 2 minutos y el servidor ya tiene un estado (pueda ser el mismo o uno nuevo),
                            // limpiamos el cache para permitir cambios legítimos externos futuros.
                            delete localCache[id];
                        }
                    }
                });
                localStorage.setItem('suit_status_cache', JSON.stringify(localCache));
                app.state._recentStatusCache = localCache;
            }

            app.data = sanitizedData;
            return true;
        } catch (e) {
            console.error("[DATA_LOAD_CRITICAL]", e);
            app.state.lastError = e.message;
            return false;
        }
    },
    switchCompany: async (newId) => {
        console.log(`🔄 Cambiando a inquilino: ${newId}`);
        app.state.companyId = newId;
        const success = await app.loadData();
        if (success) {
            const company = app.data.Config_Empresas.find(c => c.id_empresa === newId);
            if (app.ui.applyTheme) app.ui.applyTheme(company);
            window.location.hash = "#home";
            if (app.ui.updateConsole) app.ui.updateConsole(`TENANT_SWITCH: ${newId}`);
        }
    }
};
