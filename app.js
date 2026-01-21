
/**
 * EVASOL - Core Application Logic
 * Supports: Multi-tenant config, Credits, God Mode, dynamic UI.
 */

const app = {
    // CONFIGURATION
    apiUrl: "https://script.google.com/macros/s/AKfycbyK4ptE0cf8-lcgCIGjB6U5yBkq0O-B34IyoG0g-7RdmBIqXfeIXMj_06A1WmChVJsENg/exec",

    data: {
        Config_Empresas: [],
        Usuarios: [],
        Leads: [],
        Catalogo: [],
        Proyectos: [],
        Proyectos_Etapas: [],
        Proyectos_Materiales: [],
        Proyectos_Pagos: [],
        Proyectos_Bitacora: [],
        Config_Flujo_Proyecto: [],
        Config_Galeria: [],
        Empresa_Documentos: [],
        Logs: [],
        Prompts_IA: []
    },
    state: {
        currentUser: null,
        companyId: "SuitOrg",
        lastActivity: Date.now(),
        currentAgent: null,
        chatHistory: [],
        cart: [],
        posFilter: 'TODOS',
        reportPaymentFilter: 'TODOS',
        _consoleStarted: false
    },

    utils: {
        fixDriveUrl: (url) => {
            if (!url) return "";
            const sUrl = url.toString().trim();
            // Handle various Google Drive URL formats (drive.google.com or docs.google.com)
            if (sUrl.includes('google.com') && (sUrl.includes('/d/') || sUrl.includes('id='))) {
                const idMatch = sUrl.match(/\/d\/([^\/?#]+)/) ||
                    sUrl.match(/[?&]id=([^&?#]+)/) ||
                    sUrl.match(/\/file\/d\/([^\/?#]+)/);
                if (idMatch && idMatch[1]) {
                    const id = idMatch[1];
                    // Using the thumbnail endpoint is often more reliable for direct display
                    const finalUrl = `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
                    console.log(`[DriveFix] ID: ${id} -> ${finalUrl}`);
                    return finalUrl;
                }
            }
            return sUrl;
        },
        getEffectivePrice: (p) => {
            if (!p) return 0;
            const reg = parseFloat(p.precio) || 0;
            const off = parseFloat(p.precio_oferta || p.Precio_Oferta) || 0;
            if (reg > 0 && off > 0) return Math.min(reg, off);
            return off || reg || 0;
        }
    },


    deleteItem: async (type, id) => {
        if (!confirm("¿Estás seguro de BORRAR este registro? No se puede deshacer.")) return;

        // Optimistic Logical Delete
        const originalData = [...app.data[type]];
        const item = app.data[type].find(i => {
            if (type === 'Leads') return i.id_lead === id;
            if (type === 'Proyectos') return i.id_proyecto === id;
            if (type === 'Catalogo') return i.id_producto === id;
            return false;
        });

        if (item) {
            item.activo = false;
            item.estado = "ELIMINADO";
        }

        // Re-render
        if (type === 'Leads') app.ui.renderLeads();
        if (type === 'Proyectos') app.ui.renderProjects();
        if (type === 'Catalogo') app.ui.renderCatalog();

        try {
            await fetch(app.apiUrl, {
                method: 'POST',
                redirect: "follow",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: 'logicalDelete', type: type, id: id })
            });
        } catch (e) {
            console.error(e);
            alert("Error al borrar en la nube. Recargando...");
            app.data[type] = originalData; // Revert
            // Re-render
            if (type === 'Leads') app.ui.renderLeads();
            if (type === 'Proyectos') app.ui.renderProjects();
            if (type === 'Catalogo') app.ui.renderCatalog();
        }
    },

    // Core Modules
    init: async () => {
        console.log("🚀 Iniciando EVASOL Core...");

        // Load AI Config
        app.state._aiModel = localStorage.getItem('evasol_ai_model');
        if (!app.state._aiModel) console.warn("No persistent AI model found. Please run Diagnosis.");

        // deep link company selection
        const urlParams = new URLSearchParams(window.location.search);
        const coParam = urlParams.get('co');
        if (coParam) app.state.companyId = coParam;

        // Bind Events early so buttons work while loading
        app.ui.bindEvents();
        app.monitor.start();

        // Show Loading overlay if it exists in DOM
        if (!document.getElementById('loading-overlay')) {
            document.body.insertAdjacentHTML('beforeend', '<div id="loading-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.9);z-index:99999;display:flex;justify-content:center;align-items:center;flex-direction:column"><i class="fas fa-spinner fa-spin fa-3x"></i><p style="margin-top:20px">Conectando con Google Sheets...</p></div>');
        }

        const loaded = await app.loadData();

        // Final Router Init after data is ready
        app.router.init();

        // Version Check
        app.checkBackendVersion();

        const loader = document.getElementById('loading-overlay');
        if (loader) loader.remove();

        if (loaded && (app.data.Config_Empresas || []).length > 0) {
            let company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            if (!company) {
                company = app.data.Config_Empresas[0];
                app.state.companyId = company.id_empresa;
            }

            app.ui.applyTheme(company);

            // RESTORE ORBIT HUB & STANDARD FEATURES GRID
            app.ui.renderOrbit();
            const grid = document.getElementById('standard-features-grid');
            const usaFeatures = (company.usa_features_estandar || "").toString().toUpperCase() === "TRUE" || company.id_empresa === "SuitOrg";
            if (grid && usaFeatures) {
                grid.classList.remove('hidden');
            }
        } else {
            // FALLBACK: BLOQUEO POR REMODELACIÓN (Estándar Multi-inquilino)
            const hero = document.getElementById('view-home');
            if (hero) {
                hero.innerHTML = `
                    <div class="remodel-block" style="text-align:center; padding:100px 20px; background:#f4f4f4; min-height:80vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                        <i class="fas fa-hammer fa-4x" style="color:#999; margin-bottom:20px;"></i>
                        <h2 style="color:#333; margin-bottom:10px;">🚧 Bloqueo por Remodelación</h2>
                        <p style="color:#666; max-width:500px;">Estamos configurando este espacio para brindarte la mejor experiencia. Vuelve muy pronto.</p>
                        <button class="btn-primary" style="margin-top:30px;" onclick="app.ui.showLogin()"><i class="fas fa-user-lock"></i> Acceso Staff</button>
                    </div>
                `;
            }
        }

        const sb = document.getElementById('status-bar');
        if (sb) {
            sb.classList.remove('hidden');
            app.ui.updateStatusBar();
        }
    },

    checkBackendVersion: async () => {
        const text = document.getElementById('gs-version-text');
        if (!text) return;

        try {
            const res = await fetch(app.apiUrl + "?action=ping");
            const data = await res.json();
            if (data.version) {
                text.innerText = "V: " + data.version;
                const isV3 = data.version.startsWith("3.");
                const isV2 = data.version.startsWith("2.");

                if (isV3 || isV2) {
                    text.style.color = "#00e676";
                    text.innerText += " (OK)";
                } else {
                    text.style.color = "orange";
                    text.innerText += " (ACT)";
                }
            }
        } catch (e) {
            text.innerText = "V: ERR";
            text.style.color = "red";
        }
    },

    loadData: async () => {
        try {
            const url = `${app.apiUrl}?action=getAll&id_empresa=${app.state.companyId || ''}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) throw new Error(data.error);

            // Merge / Assign Data
            app.data = data;

            // Validate minimal data presence
            if (!app.data.Usuarios || app.data.Usuarios.length === 0) {
                console.warn("Database empty? Using basic fallback.");
            }
            return true;
        } catch (error) {
            console.error("Backend Error:", error);
            app.ui.updateConsole("DB_INIT_ERROR", true);
            return false;
        }
    },

    // -------------------------------------------------------------------------
    // AUTH & CREDITS SYSTEM
    // -------------------------------------------------------------------------
    auth: {
        login: (userOrEmail, password) => {
            console.log("Attempting login:", userOrEmail, password);

            const userOrEmailClean = (userOrEmail || "").toString().trim().toLowerCase();

            // Multi-header matching helper
            const getVal = (obj, keys) => {
                const foundKey = Object.keys(obj).find(k => keys.includes(k.toLowerCase().trim()));
                return foundKey ? (obj[foundKey] || "").toString().trim() : "";
            };

            const user = (app.data.Usuarios || []).find(u => {
                const email = getVal(u, ['email', 'correo', 'mail']);
                const username = getVal(u, ['username', 'usuario', 'user', 'login']);
                const nombre = getVal(u, ['nombre', 'name', 'full_name']);
                const coId = getVal(u, ['id_empresa', 'empresa', 'company']);
                const sCo = (app.state.companyId || "").toString().trim().toUpperCase();

                const matchId = (email.toLowerCase() === userOrEmailClean || username.toLowerCase() === userOrEmailClean || nombre.toLowerCase() === userOrEmailClean);
                const matchCo = (coId.toUpperCase() === sCo || coId.toUpperCase() === "GLOBAL");

                if (matchId && !matchCo) {
                    console.warn(`USER_FOUND_BUT_WRONG_COMPANY: User '${userOrEmailClean}' is registered in company '${coId}', but you are in '${sCo}'.`);
                }

                return matchId && matchCo;
            });

            if (!user) {
                console.error(`LOGIN_FAILED: User '${userOrEmailClean}' not found. Company context: '${app.state.companyId}'`);
                return { success: false, msg: "Usuario no encontrado en esta empresa" };
            }

            const sheetPass = getVal(user, ['password', 'contraseña', 'pass', 'clave']);
            const inputPass = (password || "").toString().trim();

            if (sheetPass !== inputPass) {
                return { success: false, msg: "Contraseña incorrecta" };
            }

            // 3. Resolve permissions based on Policy Origin (ROL vs USUARIO)
            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            const origenPoliticas = (company && company.origen_politicas) || "ROL"; // Default to ROL if not set
            const modoCreditos = (company && company.modo_creditos) || "USUARIO";

            let effectiveLevel = parseInt(getVal(user, ['nivel_acceso', 'nivel', 'access_level'])) || 0;
            let effectiveModules = "";
            let effectiveCredits = parseInt(getVal(user, ['creditos', 'credits'])) || 0;
            let limitDateStr = getVal(user, ['fecha_limite_acceso', 'vencimiento', 'fecha_fin']);

            // Robust Role Matching (Multi-Tenant Aware)
            if (origenPoliticas === "ROL" && app.data.Config_Roles) {
                const uRoleId = getVal(user, ['id_rol', 'rol', 'role']).toUpperCase();
                const sCoId = (app.state.companyId || "").toString().trim().toUpperCase();

                const roleData = app.data.Config_Roles.find(r => {
                    const rRoleId = getVal(r, ['id_rol', 'rol', 'role']).toUpperCase();
                    const rCoId = getVal(r, ['id_empresa', 'empresa', 'company']).toUpperCase();
                    // Match role name AND (current company OR global)
                    return rRoleId === uRoleId && (rCoId === sCoId || rCoId === "GLOBAL");
                });

                if (roleData) {
                    effectiveLevel = parseInt(getVal(roleData, ['nivel_acceso', 'nivel'])) || effectiveLevel;
                    effectiveModules = getVal(roleData, ['modulos_visibles', 'permisos', 'modulos']);
                    if (modoCreditos !== "GLOBAL") effectiveCredits = parseInt(getVal(roleData, ['creditos_base', 'creditos'])) || 0;

                    console.log(`PERMISSIONS_LOADED: Role=${uRoleId}, Level=${effectiveLevel}, Modules=${effectiveModules} (Tenant: ${sCoId})`);

                    // Calculate expiration if days provided
                    if (getVal(roleData, ['vigencia_dias'])) {
                        const date = new Date(getVal(user, ['fecha_creacion']) || Date.now());
                        date.setDate(date.getDate() + parseInt(getVal(roleData, ['vigencia_dias'])));
                        limitDateStr = date.toISOString();
                    }
                } else {
                    console.warn(`ROLE_NOT_FOUND: The role '${uRoleId}' was not found in Config_Roles for company '${sCoId}' or GLOBAL.`);
                }
            }

            // Update user object with effective values for the session
            user.nivel_acceso = effectiveLevel;
            user.modulos_visibles = effectiveModules;

            // 4. Handle Expiration Date (Absolute Priority)
            const now = new Date();
            if (user.rol !== 'DIOS') {
                const finalLimitStr = modoCreditos === "GLOBAL" ? company.fecha_vencimiento : limitDateStr;
                if (finalLimitStr) {
                    const limitDate = new Date(finalLimitStr);
                    if (now > limitDate) return { success: false, msg: "Acceso bloqueado: Fecha de corte superada (" + limitDate.toLocaleDateString() + "). Contacte a soporte." };
                }

                // 5. Handle Credits
                let currentCredits = 0;
                if (modoCreditos === "GLOBAL") {
                    if ((company.creditos_totales || 0) <= 0) return { success: false, msg: "Sin créditos globales" };
                    company.creditos_totales--;
                    currentCredits = company.creditos_totales;
                    app.auth.persistCreditDeduction('GLOBAL', null, app.state.companyId);
                } else if (modoCreditos === "DIARIO") {
                    // DIARIO logic: 1 credit per calendar day
                    const today = new Date().toISOString().split('T')[0];
                    const lastAccess = user.ultimo_acceso || "";

                    if (lastAccess !== today) {
                        if (effectiveCredits <= 0) return { success: false, msg: "Sin créditos diarios disponibles. Renovación requerida." };
                        effectiveCredits--;
                        user.creditos = effectiveCredits;
                        user.ultimo_acceso = today;
                        currentCredits = effectiveCredits;

                        // Persist immediately
                        fetch(app.apiUrl, {
                            method: 'POST',
                            headers: { "Content-Type": "text/plain" },
                            body: JSON.stringify({ action: 'updateUser', user: { id_usuario: user.id_usuario, creditos: user.creditos, ultimo_acceso: today } })
                        }).catch(e => console.error("DIARIO sync fail:", e));
                    } else {
                        currentCredits = effectiveCredits; // No deduction today, just load current
                    }
                } else {
                    if (effectiveCredits <= 0) return { success: false, msg: "Sin créditos suficientes" };
                    effectiveCredits--;
                    user.creditos = effectiveCredits; // Update local
                    currentCredits = effectiveCredits;
                    app.auth.persistCreditDeduction('USUARIO', user.id_usuario);
                }

                if (currentCredits <= 5) {
                    alert("⚠️ ADVERTENCIA: Te quedan solo " + currentCredits + " de consumo disponible. Por favor, comunícate con el equipo de soporte técnico para una recarga.");
                }
            }

            // Successful Login
            app.state.currentUser = user;
            app.ui.setLoggedInState(user);
            window.location.hash = "#dashboard";
            return { success: true };
        },

        persistCreditDeduction: async (mode, userId, companyId) => {
            try {
                const action = mode === 'GLOBAL' ? 'deductGlobalCredit' : 'deductUserCredit';
                const body = mode === 'GLOBAL' ? { action, id_empresa: companyId } : { action, id_usuario: userId };
                await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify(body)
                });
            } catch (e) {
                console.error("Error persistiendo crédito:", e);
            }
        },

        logout: () => {
            app.state.currentUser = null;
            app.ui.setLoggedOutState();
            window.location.hash = "#home";
        }
    },

    // -------------------------------------------------------------------------
    // MAINTENANCE (GOD MODE)
    // -------------------------------------------------------------------------
    maintenance: {
        resetCompany: () => {
            if (!confirm("⚠️ ¿ESTÁS SEGURO? Esto borrará leads y proyectos.")) return;
            // Mock action
            app.data.Leads = [];
            app.ui.renderLeads();
            alert("Sistema reiniciado (Simulación).");
        },
        viewLogs: () => {
            console.table(app.data.Logs || []);
            alert("Logs impresos en consola");
        }
    },

    // -------------------------------------------------------------------------
    // UI HANDLER
    // -------------------------------------------------------------------------
    ui: {
        refreshData: async (view) => {
            app.ui.updateConsole(`REFRESHING_${(view || 'ALL').toUpperCase()}...`);
            try {
                await app.loadData();
                if (view === 'leads') app.ui.renderLeads();
                else if (view === 'projects') app.ui.renderProjects();
                else if (view === 'catalog') app.ui.renderCatalog();
                else {
                    app.ui.renderLeads();
                    app.ui.renderProjects();
                    app.ui.renderCatalog();
                }
                app.ui.updateConsole("DATA_SYNC_OK");
            } catch (e) {
                app.ui.updateConsole("REFRESH_FAIL", true);
                console.error("Refresh Error:", e);
            }
        },

        applyTheme: (company) => {
            document.title = `${company.nomempresa} - Gestión`;
            document.getElementById('header-title').innerText = company.nomempresa;

            // Handle Dynamic Logo & Fallback (Case Insensitive Support)
            const logoContainer = document.getElementById('logo-container');
            const headerLogo = document.getElementById('header-logo');
            const logo = company.logo_url || company.Logo_Url || company.LOGO_URL || company.url_logo;

            if (logo && logo.toString().trim() !== "") {
                const fixedUrl = app.utils.fixDriveUrl(logo);
                headerLogo.src = fixedUrl;
                headerLogo.onerror = () => logoContainer.classList.add('hidden');
                logoContainer.classList.remove('hidden');

                // Update Ticket Logo too
                const ticketLogo = document.getElementById('ticket-logo');
                if (ticketLogo) {
                    ticketLogo.src = fixedUrl;
                    ticketLogo.classList.remove('hidden');
                }
            } else {
                logoContainer.classList.add('hidden');
            }

            if (company.color_tema) {
                document.documentElement.style.setProperty('--primary-color', company.color_tema);
            }

            // PMP/PFM/HMP SPECIFIC OVERRIDES (FOOD & POS ENGINE)
            const isFood = company.id_empresa === 'PMP' || company.id_empresa === 'PFM' || company.id_empresa === 'HMP' || company.tipo_negocio === 'Alimentos';
            const sloganEl = document.getElementById('hero-slogan');
            const subEl = document.getElementById('hero-sub');
            const heroBanner = document.getElementById('hero-banner-main');
            const actions = document.getElementById('hero-actions-container');
            const standardFeatures = document.getElementById('standard-features-grid');
            const industrialSeo = document.getElementById('industrial-solutions-seo');
            const foodAreaSpec = document.getElementById('food-app-area');
            const foodTitle = document.getElementById('food-menu-title');
            const foodSubtitle = document.getElementById('food-menu-subtitle');

            if (isFood) {
                // Crunchy Northern chicken imagery
                heroBanner.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80')`;
                heroBanner.style.backgroundAttachment = 'scroll';
                heroBanner.style.display = 'block';

                // Get strictly from sheets
                const sloganText = company.eslogan || company.Eslogan || company.slogan || company.Slogan || "Pollo Frito Metroplex";
                const subText = company.descripcion || company.Descripcion || company.description || "Calidad y Sabor Tradicional.";

                sloganEl.innerText = sloganText;
                subEl.innerText = subText;

                if (foodTitle) foodTitle.innerText = sloganText;
                if (foodSubtitle) foodSubtitle.innerText = subText;

                actions.innerHTML = `
                    <button class="btn-primary" onclick="window.location.hash='#home'"><i class="fas fa-motorcycle"></i> PEDIDO EXPRESS</button>
                    <button class="btn-secondary" onclick="app.ui.showLogin()"><i class="fas fa-user-lock"></i> STAFF</button>
                `;

                if (standardFeatures) standardFeatures.classList.add('hidden');
                if (industrialSeo) industrialSeo.classList.add('hidden');
                if (foodAreaSpec) foodAreaSpec.style.display = 'block';

                app.ui.renderFoodMenu();

                const footerCopy = document.getElementById('footer-copy');
                if (footerCopy) footerCopy.innerText = `© 2026 ${company.nomempresa} | ${company.id_empresa} - Monterrey, NL.`;
            } else {
                // Industrial Defaults
                heroBanner.style.backgroundImage = "";
                heroBanner.style.backgroundAttachment = 'fixed';
                sloganEl.innerText = company.eslogan || "Energía limpia para un futuro sostenible";
                subEl.innerText = company.descripcion || "Soluciones integrales para tu hogar y negocio.";
                actions.innerHTML = `
                    <button class="btn-primary" onclick="window.location.hash='#contact'">Cotizar Ahora</button>
                    <button class="btn-secondary" onclick="app.ui.showLogin()"><i class="fas fa-user-lock"></i> Staff</button>
                `;

                if (standardFeatures) standardFeatures.classList.remove('hidden');
                if (industrialSeo) industrialSeo.classList.remove('hidden');
                if (foodAreaSpec) foodAreaSpec.style.display = 'none';

                const footerCopy = document.getElementById('footer-copy');
                if (footerCopy) footerCopy.innerText = "© 2026 Grupo EVASOL. Todos los derechos reservados.";
            }

            // --- TASK: REMOVE MONITOR FROM NON-FOOD (EVASOL) ---
            const monLinks = document.querySelectorAll('a[href="#pos"]');
            monLinks.forEach(link => {
                if (isFood) {
                    link.parentElement.style.display = 'block';
                } else {
                    link.parentElement.style.display = 'none';
                }
            });

            app.ui.renderGallery();
            app.ui.renderSEO();
            app.ui.renderPillars(company);
            app.ui.renderFooter(company);
        },

        renderFoodMenu: () => {
            const container = document.getElementById('food-menu-grid');
            if (!container) return;
            container.innerHTML = '';

            // Enhanced Filter: Case-insensitive ID and Flexible "Active" flag
            const items = (app.data.Catalogo || []).filter(p => {
                const pCo = (p.id_empresa || "").toString().trim().toUpperCase();
                const sCo = (app.state.companyId || "").toString().trim().toUpperCase();

                // Lenient check: If 'activo' is empty, null or undefined, default to true.
                const val = (p.activo || "").toString().trim().toUpperCase();
                const isActive = (val === "" || val === "TRUE" || val === "1" || p.activo === true || p.activo === 1);

                return pCo === sCo && isActive;
            });

            if (items.length === 0) {
                app.ui.updateConsole(`MENU_EMPTY: 0 PROD_ACTIVOS PARA ${app.state.companyId}`, true);
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align:center; padding:60px 20px; color:#555; background:rgba(255,255,255,0.05); border:2px dashed var(--primary-color); border-radius:15px; backdrop-filter: blur(5px);">
                        <i class="fas fa-tools fa-3x" style="margin-bottom:20px; color:var(--primary-color); opacity: 0.8;"></i>
                        <h3 style="font-size: 1.5rem; margin-bottom: 10px;">🚧 Sección en Remodelación</h3>
                        <p style="font-size: 1.1rem; opacity: 0.8;">Estamos preparando un menú increíble para ti.</p>
                        <p style="font-size: 0.9rem; margin-top: 15px; opacity: 0.6;">Vuelve pronto para descubrir nuestras delicias.</p>
                    </div>
                `;
                return;
            }

            app.ui.updateConsole(`MENU_SYNC: ${items.length} ITEMS_OK_`);

            items.forEach(p => {
                const card = document.createElement('div');
                card.className = 'food-card';

                // Ribbon logic
                let ribbon = '';
                const tag = (p.Etiqueta_Promo || "").toString().trim().toUpperCase();
                if (tag) {
                    const tagClass = tag.includes('OFERTA') ? 'oferta' : (tag.includes('NUEVO') ? 'nuevo' : '');
                    ribbon = `<div class="ribbon ${tagClass}">${tag}</div>`;
                }

                // Case-Insensitive imagen_url
                const imgRaw = p.imagen_url || p.Imagen_Url || p.IMAGEN_URL || p.url_imagen;
                const imgFallback = 'https://docs.google.com/uc?export=view&id=1t6BmvpGTCR6-OZ3Nnx-yOmpohe5eCKvv';
                const img = imgRaw ? app.utils.fixDriveUrl(imgRaw) : imgFallback;

                const effectivePrice = app.utils.getEffectivePrice(p);
                const hasOffer = parseFloat(p.precio_oferta || p.Precio_Oferta) > 0 && parseFloat(p.precio) > 0;

                const userRole = (app.state.currentUser?.id_rol || "").toString().toUpperCase();
                const isDelivery = userRole === 'DELIVERY' || (app.state.currentUser?.nombre || "").toUpperCase().includes('REPARTIDOR');

                card.innerHTML = `
                    ${ribbon}
                    <div class="food-img-container">
                        <img src="${img}" class="food-img">
                    </div>
                    <div class="food-info">
                        <div class="food-title-row">
                            <h3>${p.nombre}</h3>
                            <div style="display:flex; flex-direction:column; align-items:flex-end;">
                                <span class="price">$${effectivePrice.toFixed(2)}</span>
                                ${hasOffer ? `<span style="font-size:0.75rem; text-decoration:line-through; color:#aaa; margin-top:-2px;">$${p.precio}</span>` : ''}
                            </div>
                        </div>
                        <p class="food-desc">${p.descripcion || ''}</p>
                        <div class="food-actions-container ${isDelivery ? 'hidden' : ''}">
                            <div class="food-actions">
                                <button onclick="app.pos.removeFromCart('${p.id_producto}')" class="btn-rem-food"><i class="fas fa-minus"></i></button>
                                <span id="qty-${p.id_producto}" class="food-qty">0</span>
                                <button onclick="app.pos.addToCart('${p.id_producto}')" class="btn-add-food"><i class="fas fa-plus"></i></button>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
            app.pos.updateCartVisuals();
        },

        renderOrbit: () => {
            const container = document.getElementById('orbit-bubbles');
            if (!container) return;
            container.innerHTML = '';

            const companies = app.data.Config_Empresas || [];
            if (companies.length === 0) {
                container.innerHTML = '<div style="color:white; font-family: monospace;">[!] NO BUBBLES FOUND_</div>';
                return;
            }

            // Satellite distribution logic
            const priorityId = app.state.companyId;
            const nonPriority = companies.filter(c => c.id_empresa !== priorityId);
            const totalNonPriority = nonPriority.length;

            companies.forEach((co, idx) => {
                const bubble = document.createElement('div');
                const isPriority = co.id_empresa === priorityId;

                bubble.className = `enterprise-bubble ${isPriority ? 'priority' : 'shaded'}`;
                bubble.dataset.id = co.id_empresa;

                let size, top, left;

                if (isPriority) {
                    size = 350; // Main Focus
                    top = 50;   // Viewport Center Vertical
                    left = 50;  // Viewport Center Horizontal
                    bubble.style.zIndex = "200";
                    bubble.style.transform = "translate(-50%, -50%)"; // Keep it centered
                    bubble.style.animationDuration = '10s'; // Slowed 20% (from 8s)
                } else {
                    // SATELLITE BEHAVIOR: Place in a ring to avoid overlap
                    const satelliteIdx = nonPriority.indexOf(co);
                    const angle = (satelliteIdx / totalNonPriority) * Math.PI * 2;
                    const distance = 35; // % of viewport

                    size = 150 + (satelliteIdx % 3) * 20; // Varied sizes but controlled

                    // Orbit Calculation
                    top = 50 + Math.sin(angle) * distance;
                    left = 50 + Math.cos(angle) * distance;

                    bubble.style.opacity = "0.7";
                    bubble.style.filter = "none";
                    bubble.style.zIndex = "150";
                    bubble.style.transform = "translate(-50%, -50%)";

                    // Speed reduction (20% slower than previous random 5-10s -> now 6-12s)
                    const duration = (6 + (satelliteIdx % 5) * 1.5).toFixed(1) + 's';
                    const delay = (satelliteIdx * -2.5).toFixed(1) + 's';
                    bubble.style.animationDuration = duration;
                    bubble.style.animationDelay = delay;
                }

                bubble.style.width = `${size}px`;
                bubble.style.height = `${size}px`;
                bubble.style.top = `${top}%`;
                bubble.style.left = `${left}%`;

                const accent = co.color_tema || co.color_hex || '#00d2ff';
                bubble.style.setProperty('--accent-color', accent);
                bubble.style.background = isPriority
                    ? `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), rgba(0,0,0,0.5)), ${accent}4d`
                    : `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), rgba(0,0,0,0.6)), ${accent}1a`;

                let content = '';
                const logo = co.logo_url || co.url_logo;
                if (logo) {
                    content += `<img src="${app.utils.fixDriveUrl(logo)}" class="bubble-logo" alt="${co.nomempresa}">`;
                }
                content += `<span class="bubble-name" style="${isPriority ? 'font-size:1.5rem;' : 'font-size:0.9rem;'}">${co.nomempresa}</span>`;

                bubble.innerHTML = content;

                bubble.onclick = (e) => {
                    e.stopPropagation();
                    app.state.companyId = co.id_empresa;
                    app.init();
                    app.ui.applyTheme(co);

                    bubble.classList.remove('shaded');
                    bubble.classList.add('active');
                    app.ui.updateConsole(`ORBIT_SELECT: ${co.id_empresa}`);

                    setTimeout(() => {
                        window.location.hash = '#home';
                    }, 800);
                };

                container.appendChild(bubble);
            });
        },

        renderFooter: (company) => {
            const btn = document.getElementById('whatsapp-float');
            if (btn && company.telefonowhatsapp) {
                btn.href = `https://wa.me/${company.telefonowhatsapp}`;
            }

            // Update Footer Social Links
            const footerLinks = document.getElementById('footer-links-container');
            if (footerLinks) {
                // Social links logic
                const fb = company.rsface || company.rsFace || company.RSFACE;
                const ig = company.rsinsta || company.rsInsta || company.RSINSTA;
                const tk = company.rstik || company.rsTik || company.RSTIK;

                let socialHtml = '<div class="social-mini">';

                // Facebook
                if (fb && fb.trim() !== "") {
                    socialHtml += `<a href="${fb}" target="_blank" title="Facebook"><i class="fab fa-facebook"></i></a>`;
                } else {
                    socialHtml += `<a href="#" onclick="event.preventDefault(); alert('Facebook en construcción');" title="Facebook en construcción" class="under-construction"><i class="fab fa-facebook"></i></a>`;
                }

                // Instagram
                if (ig && ig.trim() !== "") {
                    socialHtml += `<a href="${ig}" target="_blank" title="Instagram"><i class="fab fa-instagram"></i></a>`;
                } else {
                    socialHtml += `<a href="#" onclick="event.preventDefault(); alert('Instagram en construcción');" title="Instagram en construcción" class="under-construction"><i class="fab fa-instagram"></i></a>`;
                }

                // TikTok
                if (tk && tk.trim() !== "") {
                    socialHtml += `<a href="${tk}" target="_blank" title="TikTok"><i class="fab fa-tiktok"></i></a>`;
                } else {
                    socialHtml += `<a href="#" onclick="event.preventDefault(); alert('TikTok en construcción');" title="TikTok en construcción" class="under-construction"><i class="fab fa-tiktok"></i></a>`;
                }

                socialHtml += '</div>';

                footerLinks.innerHTML = `
                    <a href="#contact" class="btn-link">Contáctanos</a>
                    <a href="#pillars" class="btn-link">Pilares</a>
                    <a href="#" onclick="event.preventDefault(); app.ui.showAboutUs()" class="btn-link">Empresa</a>
                    <a href="#" onclick="event.preventDefault(); app.ui.showPolicies()" class="btn-link">Políticas</a>
                    ${socialHtml}
                `;
            }
        },

        togglePosFolio: () => {
            const method = document.getElementById('pos-pay-method').value;
            const container = document.getElementById('pos-folio-container');
            const bankDisplay = document.getElementById('pos-bank-info-display');
            const bankText = document.getElementById('pos-bank-details-text');
            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);

            if (method === 'Transferencia') {
                container.classList.remove('hidden');
                document.getElementById('pos-pay-folio').focus();

                if (bankDisplay && bankText && company) {
                    const bName = company.infobanco || company.Info_Banco || company.info_banco;
                    const bAcc = company.infocuenta || company.Info_Cuenta || company.info_cuenta || "Pendiente";
                    const bNom = company.infonom || company.InfoNom || company.info_nom || company.Info_Nom || "";

                    if (bName) {
                        bankText.innerHTML = `
                            <div style="font-weight:bold;">${bName}</div>
                            <div>${bAcc}</div>
                            ${bNom ? `<div style="font-size:0.7rem; opacity:0.8;">Titular: ${bNom}</div>` : ''}
                        `;
                        bankDisplay.classList.remove('hidden');
                    } else {
                        bankText.innerText = "No configurado.";
                        bankDisplay.classList.remove('hidden');
                    }
                }
            } else {
                container.classList.add('hidden');
                if (bankDisplay) bankDisplay.classList.add('hidden');
                document.getElementById('pos-pay-folio').value = '';
            }
        },

        handleReportTypeChange: () => {
            const type = document.getElementById('report-type').value;
            const input = document.getElementById('report-date');
            const label = document.getElementById('report-date-label');

            if (type === 'DIARIO') {
                input.type = 'date';
                label.innerHTML = '<i class="fas fa-calendar-day"></i> Fecha';
                input.value = new Date().toISOString().split('T')[0];
            } else {
                input.type = 'month';
                label.innerHTML = '<i class="fas fa-calendar-alt"></i> Mes';
                const now = new Date();
                input.value = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
            }
            app.ui.renderReport();
        },

        setReportPaymentFilter: (filter, btn) => {
            app.state.reportPaymentFilter = filter;
            // Update UI buttons
            document.querySelectorAll('.filter-btn-sub').forEach(b => b.classList.remove('active'));
            if (btn) btn.classList.add('active');
            app.ui.renderReport();
        },

        renderReport: () => {
            const type = document.getElementById('report-type').value;
            const pDate = document.getElementById('report-date').value;
            const container = document.getElementById('report-content');
            if (!container) return;

            // 1. Data Source
            const myProjectIds = app.data.Proyectos
                .filter(p => p.id_empresa === app.state.companyId)
                .map(p => p.id_proyecto);

            let results = (app.data.Proyectos_Pagos || []).filter(p => myProjectIds.includes(p.id_proyecto));

            // 2. Date Filtering
            if (pDate) {
                if (type === 'DIARIO') {
                    // Match exact day
                    results = results.filter(p => p.fecha_pago.startsWith(pDate));
                } else {
                    // Match month (YYYY-MM)
                    results = results.filter(p => p.fecha_pago.startsWith(pDate));
                }
            }

            // 3. Payment Method Filtering
            const payFilter = app.state.reportPaymentFilter || 'TODOS';
            if (payFilter !== 'TODOS') {
                results = results.filter(p => {
                    const m = (p.metodo_pago || "").toLowerCase();
                    if (payFilter === 'Terminal') return m.includes('terminal') || m.includes('tarjeta');
                    return m.includes(payFilter.toLowerCase());
                });
            }

            // 4. Empty State
            if (results.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center; padding:50px; color:#999;">
                        <i class="fas fa-search fa-3x" style="margin-bottom:15px; opacity:0.2;"></i>
                        <p>No se encontraron transacciones en este periodo.</p>
                        ${payFilter !== 'TODOS' ? `<button class="btn-link" onclick="app.ui.setReportPaymentFilter('TODOS')">Ver todos los métodos</button>` : ""}
                    </div>
                `;
                return;
            }

            // 5. Statistics
            const total = results.reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0);
            const count = results.length;
            const average = count > 0 ? (total / count) : 0;

            // 6. Final Render
            container.innerHTML = `
                <div class="report-summary-cards">
                    <div class="summary-card">
                        <h4><i class="fas fa-dollar-sign"></i> Venta Total</h4>
                        <div class="value">$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div class="summary-card" style="border-left-color: #f1c40f;">
                        <h4><i class="fas fa-receipt"></i> Transacciones</h4>
                        <div class="value">${count}</div>
                    </div>
                    <div class="summary-card" style="border-left-color: #3498db;">
                        <h4><i class="fas fa-calculator"></i> Ticket Promedio</h4>
                        <div class="value">$${average.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Fecha / Hora</th>
                                <th>Concepto</th>
                                <th>Método</th>
                                <th>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${results.sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago)).map(r => {
                const m = (r.metodo_pago || "").toLowerCase();
                let badgeClass = "method-badge ";
                if (m.includes('efectivo')) badgeClass += "method-tag-efectivo";
                else if (m.includes('transferencia')) badgeClass += "method-tag-transferencia";
                else badgeClass += "method-tag-terminal";

                return `
                                    <tr>
                                        <td>
                                            <div style="font-weight:600;">${new Date(r.fecha_pago).toLocaleDateString()}</div>
                                            <div style="font-size:0.7rem; opacity:0.6;">${new Date(r.fecha_pago).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td>
                                            <div style="font-weight:500;">${r.concepto}</div>
                                            <div style="font-size:0.75rem; color:#888;">ID: ${r.id_pago} | Folio: ${r.folio || 'N/A'}</div>
                                        </td>
                                        <td><span class="${badgeClass}">${r.metodo_pago}</span></td>
                                        <td style="font-weight:800; color:#333;">$${parseFloat(r.monto).toFixed(2)}</td>
                                    </tr>
                                `;
            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        },

        exportReport: (format) => {
            if (format === 'VTS') {
                alert("Generando VTS (Tab-Separated Values)... descargando archivo.");
                // Implementation for CSV/VTS export
            } else {
                alert("Generando PDF... por favor espere.");
                window.print();
            }
        },

        showLogin: () => {
            // Clear fields
            document.getElementById('login-user').value = '';
            document.getElementById('login-pass').value = '';
            document.getElementById('login-error').classList.add('hidden');
            document.getElementById('login-modal-overlay').classList.remove('hidden');
            setTimeout(() => document.getElementById('login-user').focus(), 100);
        },

        showPolicies: () => {
            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            const content = document.getElementById('policies-content');
            if (company && company.politicas) {
                content.innerText = company.politicas;
            } else {
                content.innerText = "Las políticas de la empresa no están configuradas actualmente.";
            }
            document.getElementById('policies-modal-overlay').classList.remove('hidden');
        },

        showAboutUs: () => {
            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            const content = document.getElementById('about-content');
            if (company) {
                // Social Links HTML
                let socialHtml = '';
                if (company.rsface) socialHtml += `<a href="${company.rsface}" target="_blank" style="color:#1877F2; font-size:1.5rem;"><i class="fab fa-facebook"></i></a>`;
                if (company.rsinsta) socialHtml += `<a href="${company.rsinsta}" target="_blank" style="color:#E4405F; font-size:1.5rem;"><i class="fab fa-instagram"></i></a>`;
                if (company.rstik) socialHtml += `<a href="${company.rstik}" target="_blank" style="color:#000000; font-size:1.5rem;"><i class="fab fa-tiktok"></i></a>`;

                content.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="about-item">
                            <h4 style="color: var(--primary-color); margin-bottom: 5px;"><i class="fas fa-building"></i> Empresa</h4>
                            <p>${company.nomempresa || 'Grupo EVASOL'}</p>
                        </div>
                        <div class="about-item">
                            <h4 style="color: var(--primary-color); margin-bottom: 5px;"><i class="fab fa-whatsapp"></i> WhatsApp</h4>
                            <p><a href="https://wa.me/${company.telefonowhatsapp}" target="_blank" style="color: inherit; text-decoration: none;">+${company.telefonowhatsapp || '-'}</a></p>
                        </div>
                        <div class="about-item">
                            <h4 style="color: var(--primary-color); margin-bottom: 5px;"><i class="fas fa-map-marker-alt"></i> Dirección</h4>
                            <p>${company.direccion || '-'}</p>
                        </div>
                        <div class="about-item">
                            <h4 style="color: var(--primary-color); margin-bottom: 5px;"><i class="fas fa-envelope"></i> Contacto Empresarial</h4>
                            <p>${company.correoempresarial || '-'}</p>
                        </div>
                        ${socialHtml ? `
                        <div class="about-item">
                            <h4 style="color: var(--primary-color); margin-bottom: 10px;"><i class="fas fa-share-alt"></i> Redes Sociales</h4>
                            <div style="display: flex; gap: 20px;">${socialHtml}</div>
                        </div>` : ''}
                    </div>
                `;
            } else {
                content.innerHTML = "<p>Estamos configurando la información de la empresa.</p>";
            }
            document.getElementById('about-modal-overlay').classList.remove('hidden');
        },

        renderPillars: (company) => {
            const container = document.getElementById('pillars-container');
            if (!container) return;

            const pillars = [
                { title: 'MISIÓN', text: company.mision, icon: 'fa-bullseye' },
                { title: 'VISIÓN', text: company.vision, icon: 'fa-eye' },
                { title: 'VALORES', text: company.valores, icon: 'fa-handshake' },
                { title: 'IMPACTO', text: company.impacto, icon: 'fa-chart-line' }
            ];

            container.innerHTML = pillars.map(p => `
                <div class="pillar-card">
                    <div class="pillar-icon"><i class="fas ${p.icon}"></i></div>
                    <h3>${p.title}</h3>
                    <p class="pillar-text">${p.text || 'Contenido pendiente de configurar.'}</p>
                </div>
            `).join('');
        },

        renderGallery: () => {
            const section = document.getElementById('company-gallery-section');
            const grid = document.getElementById('company-gallery-grid');
            if (!section || !grid) return;

            const companyImages = (app.data.Config_Galeria || []).filter(img => img.id_empresa === app.state.companyId);

            if (companyImages.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align:center; padding:60px 20px; color:#555; background:rgba(0,0,0,0.02); border:2px dashed #ccc; border-radius:15px;">
                        <i class="fas fa-paint-roller fa-3x" style="margin-bottom:20px; color:#aaa;"></i>
                        <h3 style="font-size: 1.5rem; margin-bottom: 10px;">🚧 Galería en Remodelación</h3>
                        <p style="font-size: 1.1rem; opacity: 0.8;">Estamos actualizando nuestras fotos para mostrarte lo mejor de nosotros.</p>
                    </div>
                `;
                section.classList.remove('hidden'); // Show the section but with the remodel message
                return;
            }

            section.classList.remove('hidden');
            grid.innerHTML = companyImages.map(img => `
                <div class="gallery-item">
                    <img src="${img.url_imagen}" alt="${img.titulo}" class="gallery-img">
                    <div class="gallery-info">
                        <h4>${img.titulo || 'Proyecto'}</h4>
                        <span>${img.categoria || '-'}</span>
                    </div>
                </div>
            `).join('');
        },

        renderSEO: () => {
            const container = document.querySelector('.solutions-grid');
            const section = document.getElementById('industrial-solutions-seo');
            if (!container || !section) return;

            const currentCoId = (app.state.companyId || "").toString().trim().toUpperCase();
            const seoData = (app.data.Config_SEO || []).filter(s =>
                (s.id_empresa || "").toString().trim().toUpperCase() === currentCoId || (s.id_empresa || "").toString().trim().toUpperCase() === "GLOBAL"
            );

            if (seoData.length === 0) {
                section.classList.add('hidden');
                return;
            }

            section.classList.remove('hidden');
            container.innerHTML = seoData.map(s => `
                <div class="solution-cluster">
                    <h4><i class="${s.icono || 'fas fa-check-circle'}"></i> ${s.titulo}</h4>
                    <ul style="list-style: none; font-size: 0.9rem; color: #555; line-height: 1.6;">
                        ${(s.keywords_coma || "").split(',').map(kw => `<li>• ${kw.trim()}</li>`).join('')}
                    </ul>
                </div>
            `).join('');
        },

        filterPOS: (status) => {
            app.state.posFilter = status;
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.innerText.toUpperCase() === status.replace('-', ' ').toUpperCase() || (status === 'TODOS' && btn.innerText === 'Todos'));
            });
            app.ui.renderPOS();
        },

        renderPOS: () => {
            const grid = document.getElementById('pos-orders-grid');
            if (!grid) return;
            grid.innerHTML = '';

            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            const posTitle = document.querySelector('#view-pos h2');
            if (posTitle && company) posTitle.innerHTML = `<i class="fas fa-desktop"></i> Monitor de Pedidos ${company.nomempresa}`;

            const orders = (app.data.Proyectos || []).filter(p => {
                const isMyCompany = p.id_empresa === app.state.companyId;
                const matchesFilter = app.state.posFilter === 'TODOS' || p.estado === app.state.posFilter;
                return isMyCompany && matchesFilter;
            });

            if (orders.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#999;">No hay pedidos en esta categoría.</div>';
                return;
            }

            orders.forEach(o => {
                const card = document.createElement('div');
                const rawStatus = (o.estado || "").toString().trim().toUpperCase();

                // Color coding based on fuzzy status
                let statusClass = 'status-default';
                if (rawStatus.includes('RECIBIDO')) statusClass = 'status-recibido';
                if (rawStatus.includes('COCINA')) statusClass = 'status-cocina';
                if (rawStatus.includes('LISTO') || rawStatus.includes('ENTREGA')) statusClass = 'status-entrega';
                if (rawStatus.includes('ENTREGADO')) statusClass = 'status-entregado';

                card.className = `order-card ${statusClass}`;

                // Role Detection (Broad & Case Insensitive)
                const userName = (app.state.currentUser?.nombre || "").toUpperCase();
                const userRole = (app.state.currentUser?.id_rol || app.state.currentUser?.rol || "").toString().trim().toUpperCase();
                const isDelivery = userRole.includes('DELIVERY') || userRole.includes('REPARTIDOR') || userName.includes('REPARTIDOR') || userName.includes('DELIVERY');
                const isAdmin = parseInt(app.state.currentUser?.nivel_acceso) >= 10;

                let nextAction = '';

                // Button Visibility Logic:
                // Delivery: Only sees 'ENTREGAR' for anything that is LISTO/ENTREGA
                // Cocina/Staff: Sees 'COCINAR' for RECIBIDO, 'LISTO' for COCINA
                // Admin: Sees everything
                if (!isDelivery || isAdmin) {
                    if (rawStatus.includes('RECIBIDO')) {
                        nextAction = `<button class="btn-status-next" onclick="app.pos.updateOrderStatus('${o.id_proyecto}', 'EN-COCINA')"><i class="fas fa-fire"></i> COCINAR</button>`;
                    } else if (rawStatus.includes('COCINA')) {
                        nextAction = `<button class="btn-status-next" onclick="app.pos.updateOrderStatus('${o.id_proyecto}', 'LISTO-ENTREGA')"><i class="fas fa-check"></i> LISTO</button>`;
                    }
                }

                // Both Delivery AND Admin can see 'ENTREGAR' button
                // FALLBACK: If status is NOT 'ENTREGADO' and we are delivery, show the button to avoid blockers
                const isFinalized = rawStatus.includes('ENTREGADO') || rawStatus.includes('CANCELADO');
                if (!isFinalized && (isDelivery || isAdmin)) {
                    nextAction += `<button class="btn-status-next" style="background:#2e7d32; border-color:#1b5e20; margin-top:5px;" onclick="app.pos.updateOrderStatus('${o.id_proyecto}', 'ENTREGADO')"><i class="fas fa-truck"></i> ENTREGAR</button>`;
                }

                const debugInfo = `<div style="font-size:0.6rem; color:red; margin-top:5px;">[DEBUG] Status: "${rawStatus}" | Role: ${userRole}</div>`;

                const date = new Date(o.fecha_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                card.innerHTML = `
                    <div class="order-card-header">
                        <span class="order-id">#${o.id_proyecto.slice(-4)}</span>
                        <span class="order-time">${date}</span>
                    </div>
                    <div class="customer-info">
                        <h4>${o.nombre_proyecto.replace('Pedido ', '').replace('Orden PFM - ', '')}</h4>
                    </div>

                    <div class="order-items">
                        ${(() => {
                        try {
                            const items = JSON.parse(o.line_items || '[]');
                            return items.map(item => `
                                    <div class="order-item-row">
                                        <span>${item.qty}x ${item.name}</span>
                                    </div>
                                `).join('');
                        } catch (e) {
                            return '<p style="font-size:0.7rem; color: #999;">(Sin detalle de productos)</p>';
                        }
                    })()}
                    </div>

                    <div class="order-footer">
                        <div class="order-actions">${nextAction}</div>
                        ${debugInfo}
                    </div>
                `;
                grid.appendChild(card);
            });
        },

        updateConsole: (msg, isError = false) => {
            const el = document.getElementById('sb-console');
            const txt = document.getElementById('console-text');
            if (!el || !txt) return;

            if (isError) {
                el.classList.add('error');
                txt.innerText = `> ALERT: ${msg.toUpperCase()} `;
                console.error("[SuitOrg_Error]", msg);
            } else {
                // SUCCESS messages or Sync should clear previous errors
                if (msg.includes("SYNC") || msg.includes("OK") || msg.includes("SUCCESS")) {
                    el.classList.remove('error');
                }

                if (!el.classList.contains('error')) {
                    txt.innerText = `> ${msg.toUpperCase()} `;
                }
            }
        },

        runConsoleSim: () => {
            const msgs = ["SYSTEM_OK", "DB_CONNECTED", "SYNC_IDLE", "AI_READY", "SEC_ACTIVE", "PONG_READY", "NODE_01_LIVE"];
            let i = 0;
            setInterval(() => {
                app.ui.updateConsole(msgs[i % msgs.length]);
                i++;
            }, 5000);
        },

        updateStatusBar: () => {
            const updateTime = () => {
                const now = new Date();
                const timeEl = document.getElementById('sb-time');
                const dateEl = document.getElementById('sb-date');
                if (timeEl) timeEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                if (dateEl) dateEl.innerText = now.toLocaleDateString();
            };
            updateTime();
            if (!app.state._statusBarInterval) {
                app.state._statusBarInterval = setInterval(updateTime, 1000);
            }

            if (!app.state._consoleStarted) {
                app.ui.runConsoleSim();
                app.state._consoleStarted = true;
            }

            const indicator = document.getElementById('sb-indicator');
            if (indicator) indicator.innerHTML = `<i class="fas fa-microchip"></i> BS-T:`;

            const userSpan = document.getElementById('sb-user');
            const levelSpan = document.getElementById('sb-level');

            if (userSpan) {
                if (app.state.currentUser) {
                    userSpan.innerHTML = `<i class="fas fa-user text-accent"></i> ${app.state.currentUser.nombre}`;
                    if (levelSpan) levelSpan.innerText = app.state.currentUser.nivel_acceso || 0;
                } else {
                    userSpan.innerHTML = `<i class="fas fa-user-secret"></i> Visitante`;
                    if (levelSpan) levelSpan.innerText = "0";
                }
            }

            const coinEl = document.getElementById('sb-credits');
            if (coinEl) {
                const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
                const modo = (company && company.modo_creditos) || "USUARIO";

                let display = "";
                if (modo === "GLOBAL") {
                    display = `<i class="fas fa-coins" style="color: #ffd700;"></i> $ ${company.creditos_totales || 0}`;
                } else if (modo === "DIARIO") {
                    // Show Limit Date if mode is temporary/daily access
                    const limit = (app.state.currentUser && app.state.currentUser.fecha_limite_acceso) || (company && company.fecha_vencimiento);
                    if (limit) {
                        const d = new Date(limit);
                        display = `<i class="fas fa-calendar-alt" style="color: #64b5f6;"></i> ${d.toLocaleDateString()}`;
                    } else {
                        display = `<i class="fas fa-coins" style="color: #ffd700;"></i> $ ${app.state.currentUser ? app.state.currentUser.creditos : 0}`;
                    }
                } else {
                    // DEFAULT: Credits
                    const val = app.state.currentUser ? app.state.currentUser.creditos : 0;
                    display = `<i class="fas fa-coins" style="color: #ffd700;"></i> $ ${val}`;
                }

                coinEl.innerHTML = `<div class="credits-pill" title="Modo: ${modo}">${display}</div>`;
            }
        },

        setLoggedInState: (user) => {
            const getVal = (obj, keys) => {
                const foundKey = Object.keys(obj).find(k => keys.includes(k.toLowerCase().trim()));
                return foundKey ? (obj[foundKey] || "").toString().trim() : "";
            };

            document.getElementById('status-bar').classList.remove('hidden');
            app.ui.updateStatusBar(); // Use the centralized function
            document.getElementById('menu-public').classList.add('hidden');
            document.getElementById('menu-staff').classList.remove('hidden');
            document.getElementById('login-modal-overlay').classList.add('hidden');

            // Dynamic Menu Filtering (RBAC) 🧭
            const userRole = getVal(user, ['id_rol', 'rol', 'role']).toUpperCase();
            const sCoId = (app.state.companyId || "").toString().trim().toUpperCase();

            // Tenant-Aware Role Config Lookup (Robust)
            const roleConfig = (app.data.Config_Roles || []).find(r => {
                const rRoleId = getVal(r, ['id_rol', 'rol', 'role']).toUpperCase();
                const rCoId = getVal(r, ['id_empresa', 'empresa', 'company']).toUpperCase();
                return rRoleId === userRole && (rCoId === sCoId || rCoId === "GLOBAL");
            });

            const visibleModulesRaw = (roleConfig?.modulos_visibles || user.modulos_visibles || "").toLowerCase();
            const modulesArray = visibleModulesRaw.split(/[\s,;]+/).map(m => m.replace('#', '').trim()).filter(m => m !== "");

            let isAdmin = parseInt(user.nivel_acceso) >= 10 || userRole === 'DIOS';
            let isStaff = parseInt(user.nivel_acceso) >= 5 || userRole === 'DIOS';
            const isDelivery = userRole === 'DELIVERY' || userRole === 'REPARTIDOR';

            const menuItems = document.querySelectorAll('#menu-staff li');
            menuItems.forEach(li => {
                const link = li.querySelector('a');
                if (!link || link.id === 'btn-logout' || link.getAttribute('href') === '#logout') return;

                const targetHash = (link.getAttribute('href') || "").toLowerCase();
                const targetBase = targetHash.replace('#', '');

                // VISIBILITY LOGIC: Admin sees all, or if explicitly in modulesArray, or if it's a core dashboard page.
                // Fallback: If modulesArray is empty, allow access based on level for common pages.
                const isExplicitlyAllowed = modulesArray.includes(targetBase);
                const isCorePage = targetBase === "dashboard" || targetBase === "home";
                const isBasicStaffPage = isStaff && (targetBase === "pos" || targetBase === "leads" || targetBase === "projects");

                if (isAdmin || isExplicitlyAllowed || isCorePage || (modulesArray.length === 0 && isBasicStaffPage)) {
                    li.classList.remove('hidden');
                } else {
                    li.classList.add('hidden');
                }
            });

            // Update Shortcut in Status Bar
            const sbIndicator = document.getElementById('sb-indicator');
            if (sbIndicator && isStaff) {
                sbIndicator.innerHTML = `<a href="#pos" style="color:inherit; text-decoration:none;"><i class="fas fa-desktop"></i> MONITOR</a>`;
            }

            // Dashboard Values
            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            const isGlobal = (company && company.modo_creditos) === "GLOBAL";

            // Dashboard Card Visibility
            const dashView = document.getElementById('view-dashboard');
            if (dashView) {
                const dashModules = dashView.querySelectorAll('.feature-card');
                dashModules.forEach(card => {
                    const btn = card.querySelector('button');
                    const onclickStr = btn?.getAttribute('onclick') || "";
                    const match = onclickStr.match(/#([a-z-]+)/);
                    const targetHash = match ? `#${match[1]}` : "";
                    const targetBase = targetHash.replace('#', '').toLowerCase();

                    if (isAdmin || modulesArray.includes(targetBase) || targetBase === "dashboard" || targetBase === "home") {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });
            }

            document.getElementById('dash-credits').innerText = isGlobal ? (company.creditos_totales || 0) : user.creditos;
            document.getElementById('dash-credit-mode').innerText = isGlobal ? "Pool Global de Empresa" : "Créditos Personales";
            document.getElementById('dash-leads').innerText = app.data.Leads.length;

            // Dynamic Agents Button - Visible for Level 5+ (Staff/Admin) or DIOS
            const hasAIAccess = user.rol === 'DIOS' || (user.nivel_acceso && user.nivel_acceso >= 5) || modulesArray.includes('knowledge');
            const godTools = document.getElementById('god-tools');
            if (godTools) {
                if (hasAIAccess) {
                    godTools.classList.remove('hidden');
                    godTools.querySelector('h3').innerText = user.rol === 'DIOS' ? 'GOD MODE' : 'HERRAMIENTAS IA';
                } else {
                    godTools.classList.add('hidden');
                }
            }

            // GATED ACTION BUTTONS (Granular RBAC)
            const level = parseInt(user.nivel_acceso) || 0;
            const isGod = user.rol === 'DIOS' || level >= 10;
            const canMaintain = isGod || level >= 9 || modulesArray.includes('mantenimiento');
            const isSenior = isGod || level >= 8 || modulesArray.includes('projects');
            const isJunior = isGod || level >= 7 || modulesArray.includes('leads');
            const isStaffButtons = isGod || level >= 5 || modulesArray.includes('pos');

            const btnLead = document.getElementById('btn-show-lead-modal');
            if (btnLead) isJunior ? btnLead.classList.remove('hidden') : btnLead.classList.add('hidden');

            const btnProject = document.getElementById('btn-show-project-modal');
            if (btnProject) isSenior ? btnProject.classList.remove('hidden') : btnProject.classList.add('hidden');

            const btnProduct = document.getElementById('btn-show-product-modal');
            if (btnProduct) isSenior ? btnProduct.classList.remove('hidden') : btnProduct.classList.add('hidden');

            const btnSync = document.getElementById('btn-sync-drive');
            if (btnSync) isSenior ? btnSync.classList.remove('hidden') : btnSync.classList.add('hidden');

            const mntTools = document.getElementById('admin-maintenance-tools');
            if (mntTools) canMaintain ? mntTools.classList.remove('hidden') : mntTools.classList.add('hidden');

            // DELIVERY RESTRICTION: Hide ordering UI if user is delivery
            const isDeliveryRole = userRole === 'DELIVERY' || (user.nombre || "").toUpperCase().includes('REPARTIDOR');
            const cartBar = document.getElementById('cart-float-bar');
            if (cartBar && isDeliveryRole) cartBar.classList.add('hidden');
        },

        setLoggedOutState: () => {
            // document.getElementById('status-bar').classList.add('hidden'); // Keep visible for Version info
            document.getElementById('sb-user').innerHTML = '<i class="fas fa-user-secret"></i> Visitante';
            const levelSpan = document.getElementById('sb-level');
            if (levelSpan) levelSpan.innerText = "0";

            const indicator = document.getElementById('sb-indicator');
            if (indicator) indicator.innerHTML = `<i class="fas fa-microchip"></i> BS-T:`;

            document.getElementById('menu-public').classList.remove('hidden');
            document.getElementById('menu-staff').classList.add('hidden');
            document.getElementById('god-tools').classList.add('hidden');
        },

        repairDatabase: async () => {
            const btn = document.querySelector('.btn-warning');
            const originalText = btn ? btn.innerHTML : "Reparar";
            if (btn) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reparando...';
                btn.disabled = true;
            }

            try {
                const res = await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: 'initializeRbac' })
                });
                const data = await res.json();
                if (data.success) {
                    alert("✅ Base de datos reparada y columnas OTP verificadas.");
                    await app.loadData();
                } else {
                    alert("❌ Error: " + (data.error || "Desconocido"));
                }
            } catch (e) {
                console.error(e);
                alert("Error de conexión al reparar.");
            } finally {
                if (btn) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            }
        },

        renderLeads: () => {
            const tbody = document.getElementById('leads-table-body');
            if (!tbody) return;
            tbody.innerHTML = '';

            const searchInput = document.getElementById('lead-search');
            const query = (searchInput?.value || '').toLowerCase().trim();
            const isAdmin = app.state.currentUser && (app.state.currentUser.rol === 'DIOS' || (app.state.currentUser.nivel_acceso >= 10));

            // MULTI-TENANT & LOGICAL DELETE FILTER (Robust)
            const currentCoId = (app.state.companyId || "").toString().trim().toUpperCase();
            let list = (app.data.Leads || []).filter(l => {
                const matchCo = (l.id_empresa || "").toString().trim().toUpperCase() === currentCoId;
                const isActive = l.activo !== false && l.activo !== "FALSE" && l.activo !== "0" && l.estado !== "ELIMINADO";
                return matchCo && isActive;
            });

            // SEARCH FILTER (Prioritizing Name as requested)
            if (query) {
                list = list.filter(l =>
                    (l.nombre || "").toLowerCase().includes(query) ||
                    (l.id_lead || "").toLowerCase().includes(query)
                );
            }

            // SORT BY NAME (Nombre)
            list.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

            list.forEach(lead => {
                const tr = document.createElement('tr');

                // RBAC Checks for Buttons (Estándar CRUD)
                const isAdmin = app.state.currentUser && (app.state.currentUser.nivel_acceso >= 10 || app.state.currentUser.rol === 'DIOS');
                const isStaff = app.state.currentUser && (app.state.currentUser.nivel_acceso >= 5 || app.state.currentUser.rol === 'DIOS');

                tr.innerHTML = `
                    <td>${lead.id_lead || 'N/A'} - <b>${lead.nombre}</b></td>
                    <td>${lead.direccion || '-'}</td>
                    <td>${lead.telefono}</td>
                    <td><span style="padding:4px 8px; border-radius:4px; background:#e0f2f1; color: #00695c; font-size:0.8rem">${lead.estado}</span></td>
                    <td>
                        <div class="actions-cell">
                            ${isAdmin ? `<button class="btn-small btn-danger" onclick="app.deleteItem('Leads', '${lead.id_lead}')" title="Borrar Lead"><i class="fas fa-trash"></i></button>` : ''}
                            ${isStaff ? `<button class="btn-small" onclick="app.ui.editLead('${lead.id_lead}')" title="Editar Lead"><i class="fas fa-edit"></i></button>` : ''}
                            <button class="btn-small btn-secondary" onclick="alert('Detalles de ${lead.nombre}')" title="Ver Detalles"><i class="fas fa-eye"></i></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        },


        renderProjects: () => {
            const tbody = document.getElementById('projects-table-body');
            if (!tbody) return;
            tbody.innerHTML = '';

            const searchInput = document.getElementById('project-search');
            const query = (searchInput?.value || '').toLowerCase().trim();
            const isAdmin = app.state.currentUser && (app.state.currentUser.rol === 'DIOS' || (app.state.currentUser.nivel_acceso >= 10));

            // MULTI-TENANT & LOGICAL DELETE FILTER (Robust)
            const currentCoId = (app.state.companyId || "").toString().trim().toUpperCase();
            let list = (app.data.Proyectos || []).filter(p => {
                const matchCo = (p.id_empresa || "").toString().trim().toUpperCase() === currentCoId;
                const isActive = p.activo !== false && p.activo !== "FALSE" && p.activo !== "0" && p.estado !== "ELIMINADO";
                return matchCo && isActive;
            });

            // SEARCH FILTER
            if (query) {
                list = list.filter(p => {
                    const client = (app.data.Leads || []).find(l => l.id_lead === p.id_cliente);
                    const clientName = (client ? client.nombre : (p.cliente_nombre || '')).toLowerCase();

                    return (p.nombre_proyecto || "").toLowerCase().includes(query) ||
                        (p.id_proyecto || "").toLowerCase().includes(query) ||
                        (p.id_cliente || "").toLowerCase().includes(query) ||
                        clientName.includes(query);
                });
            }

            // SORT BY NAME (Proyecto)
            list.sort((a, b) => (a.nombre_proyecto || "").localeCompare(b.nombre_proyecto || ""));

            list.forEach(p => {
                const flow = (app.data.Config_Flujo_Proyecto || []).filter(f =>
                    f.id_empresa === app.state.companyId || f.id_empresa === 'GLOBAL'
                );
                const phase = flow.find(f => f.id_fase === p.estado) || { nombre_fase: p.estado, peso_porcentaje: 0, color_hex: "#999" };
                const color = phase.color_hex || "#999";
                const pct = parseInt(phase.peso_porcentaje) || 0;

                const client = app.data.Leads.find(l => l.id_lead === p.id_cliente);
                const clientName = client ? client.nombre : (p.cliente_nombre || 'N/A');

                // RBAC Checks for Buttons (Estándar CRUD)
                const isAdmin = app.state.currentUser && (app.state.currentUser.nivel_acceso >= 10 || app.state.currentUser.rol === 'DIOS');
                const isStaff = app.state.currentUser && (app.state.currentUser.nivel_acceso >= 5 || app.state.currentUser.rol === 'DIOS');

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <b>${p.id_proyecto || 'Pending'}</b> - ${p.nombre_proyecto}
                        <div class="progress-container"><div class="progress-bar" style="width:${pct}%; background:${color}"></div></div>
                        <span class="text-small">${pct}% - ${phase.nombre_fase}</span>
                    </td>
                    <td>${clientName}</td>
                    <td><span style="padding:4px 8px; border-radius:4px; background:${color}; color: white; font-size:0.7rem; font-weight:bold;">${phase.nombre_fase.toUpperCase()}</span></td>
                    <td>
                        <div class="actions-cell">
                            ${isAdmin ? `<button class="btn-small btn-danger" onclick="app.deleteItem('Proyectos', '${p.id_proyecto}')" title="Borrar Proyecto"><i class="fas fa-trash"></i></button>` : ''}
                            ${isStaff ? `<button class="btn-small" onclick="app.ui.openProjectDetails('${p.id_proyecto}')" title="Ver/Gestionar Etapas"><i class="fas fa-tasks"></i></button>` : ''}
                            <button class="btn-small btn-secondary" onclick="app.ui.openProjectDetails('${p.id_proyecto}')" title="Ver Detalles"><i class="fas fa-eye"></i></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        },

        openProjectDetails: (pId) => {
            const p = app.data.Proyectos.find(x => x.id_proyecto === pId);
            if (!p) return;

            const client = app.data.Leads.find(l => l.id_lead === p.id_cliente);
            const clientName = client ? client.nombre : (p.cliente_nombre || 'N/A');

            // Get sub-data
            const stages = app.data.Proyectos_Etapas.filter(s => s.id_proyecto === pId);
            const logs = app.data.Proyectos_Bitacora.filter(log => log.id_proyecto === pId);

            const content = document.getElementById('project-details-content');
            content.innerHTML = `
                <div class="project-details-tabs" style="display:flex; gap:10px; border-bottom:1px solid #ddd; margin-bottom:15px; padding-bottom:10px;">
                    <button class="btn-small tab-btn active" onclick="app.ui.switchProjectTab('info', this)">Info</button>
                    <button class="btn-small tab-btn" onclick="app.ui.switchProjectTab('stages', this)">Etapas (${stages.length})</button>
                    <button class="btn-small tab-btn" onclick="app.ui.switchProjectTab('logs', this)">Bitácora (${logs.length})</button>
                </div>

                <div id="p-tab-info" class="p-tab-content">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div><strong>ID:</strong><br>${p.id_proyecto}</div>
                        <div><strong>Estado Actual (Fase):</strong><br>
                            <select onchange="app.ui.updateProjectStatus('${p.id_proyecto}', this.value)" style="padding:4px; font-size:0.8rem; width:100%">
                                ${(app.data.Config_Flujo_Proyecto || []).filter(f => f.id_empresa === app.state.companyId || f.id_empresa === 'GLOBAL').map(f => `
                                    <option value="${f.id_fase}" ${p.estado === f.id_fase ? 'selected' : ''}>${f.nombre_fase} (${f.peso_porcentaje}%)</option>
                                `).join('') || `<option value="${p.estado}">${p.estado}</option>`}
                            </select>
                        </div>
                        <div style="grid-column: span 2;"><strong>Nombre:</strong><br>${p.nombre_proyecto}</div>
                        <div style="grid-column: span 2;"><strong>Cliente:</strong><br>${clientName}</div>
                        <div><strong>Inicio:</strong><br>${p.fecha_inicio ? p.fecha_inicio.split('T')[0] : '-'}</div>
                        <div><strong>Fin Est.:</strong><br>${p.fecha_fin ? p.fecha_fin.split('T')[0] : '-'}</div>
                    </div>
                </div>

                <div id="p-tab-stages" class="p-tab-content hidden">
                    <div style="margin-bottom:15px; background:rgba(0,0,0,0.05); padding:10px; border-radius:8px;">
                        <div style="font-size:0.8rem; font-weight:bold; margin-bottom:5px;">Nueva Etapa:</div>
                        <div style="display:flex; gap:5px;">
                            <input type="text" id="new-stage-name" placeholder="Nombre de etapa..." style="flex:2; padding:5px; font-size:0.8rem;">
                            <input type="date" id="new-stage-date" style="flex:1; padding:5px; font-size:0.8rem;">
                            <button class="btn-small" onclick="app.ui.addProjectStage('${pId}')" title="Añadir Etapa"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>
                    <table class="data-table" style="font-size:0.8rem">
                        <thead><tr><th>Etapa / Fecha</th><th>OK</th></tr></thead>
                        <tbody>
                            ${stages.length ? stages.map(s => `
                                <tr>
                                    <td>
                                        <strong>${s.nombre_etapa}</strong><br>
                                        <span class="text-small" style="color:#666">${s.fecha_compromiso ? s.fecha_compromiso.split('T')[0] : '-'}</span>
                                    </td>
                                    <td>
                                        <input type="checkbox" ${s.completada === true || s.completada === "TRUE" ? 'checked' : ''} 
                                               onchange="app.ui.toggleStage('${pId}', '${s.nombre_etapa}', this.checked)">
                                    </td>
                                </tr>`).join('') : '<tr><td colspan="2">No hay etapas</td></tr>'}
                        </tbody>
                    </table>
                </div>

                <div id="p-tab-logs" class="p-tab-content hidden">
                    <div style="margin-bottom:15px; background:rgba(0,0,0,0.05); padding:10px; border-radius:8px;">
                        <textarea id="new-log-txt" placeholder="Escribe un comentario manual..." style="width:100%; padding:8px; font-size:0.8rem; height:60px; border-radius:4px; border:1px solid #ddd;"></textarea>
                        <button class="btn-small w-100" style="margin-top:5px; background:var(--primary-color); color:white;" onclick="app.ui.addProjectManualLog('${pId}')" title="Añadir Comentario">
                            <i class="fas fa-comment-dots"></i> Añadir Registro
                        </button>
                    </div>
                    <div style="max-height: 250px; overflow-y: auto;">
                        ${logs.length ? logs.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora)).map(l => `
                            <div style="padding:8px; border-bottom:1px solid #eee; border-left: 3px solid ${l.tipo_evento === 'AUTO' ? '#2196F3' : '#4CAF50'}; margin-bottom:5px; background: rgba(0,0,0,0.02)">
                                <div class="flex-between">
                                    <span class="text-small"><strong>${l.tipo_evento === 'AUTO' ? '🤖 SISTEMA' : '👤 ' + l.usuario}</strong></span>
                                    <span class="text-small" style="color:#999">${new Date(l.fecha_hora).toLocaleString()}</span>
                                </div>
                                <div style="margin-top:4px; font-size:0.8rem">${l.detalle}</div>
                            </div>`).join('') : '<div class="text-small" style="text-align:center; padding:20px; color:#999">No hay registros en la bitácora</div>'}
                    </div>
                </div>
    `;
            document.getElementById('project-details-modal').classList.remove('hidden');
        },

        switchProjectTab: (tabId, clickedButton) => {
            document.querySelectorAll('.p-tab-content').forEach(el => el.classList.add('hidden'));
            const target = document.getElementById('p-tab-' + tabId);
            if (target) target.classList.remove('hidden');

            // Highlight button
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            if (clickedButton) {
                clickedButton.classList.add('active');
            }
        },

        // --- EXECUTORS ---

        addProjectStage: async (pId) => {
            const name = document.getElementById('new-stage-name').value;
            const date = document.getElementById('new-stage-date').value;
            if (!name) return;

            const stage = {
                id_proyecto: pId,
                nombre_etapa: name,
                estado: "PENDIENTE",
                fecha_compromiso: date || new Date().toISOString(),
                completada: false
            };
            app.data.Proyectos_Etapas.push(stage);

            // Auto Log
            app.ui.internalAddLog(pId, "AUTO", `Nueva etapa añadida: ${name} `);

            app.ui.openProjectDetails(pId); // Refresh UI
            app.ui.switchProjectTab('stages');

            try {
                await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: 'updateProjectStage', stage: stage })
                });
            } catch (e) { console.error(e); }
        },

        toggleStage: async (pId, stageName, isChecked) => {
            const s = app.data.Proyectos_Etapas.find(x => x.id_proyecto === pId && x.nombre_etapa === stageName);
            if (s) {
                s.completada = isChecked;
                s.estado = isChecked ? "COMPLETADO" : "PENDIENTE";
            }

            // Auto Log
            const statusText = isChecked ? "marcada como COMPLETADA" : "desmarcada a PENDIENTE";
            app.ui.internalAddLog(pId, "AUTO", `Etapa "${stageName}" ${statusText} `);

            app.ui.renderProjects(); // Update progress bar in main table

            try {
                await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: 'updateProjectStage', stage: s })
                });
            } catch (e) { console.error(e); }
        },

        addProjectPayment: async (pId) => {
            const amt = document.getElementById('new-pay-amt').value;
            const concept = document.getElementById('new-pay-concept').value;
            if (!amt || !concept) return;

            const pay = { id_proyecto: pId, monto: amt, concepto: concept, metodo_pago: "Efectivo", fecha_pago: new Date().toISOString() };
            app.data.Proyectos_Pagos.push(pay);
            app.ui.openProjectDetails(pId);
            app.ui.switchProjectTab('payments');

            try {
                await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: 'addProjectPayment', payment: pay })
                });
            } catch (e) { console.error(e); }
        },

        addProjectManualLog: async (pId) => {
            const text = document.getElementById('new-log-txt').value;
            if (!text) return;
            app.ui.internalAddLog(pId, "MANUAL", text);
            document.getElementById('new-log-txt').value = '';
        },

        internalAddLog: async (pId, type, text) => {
            const log = {
                id_proyecto: pId,
                tipo_evento: type,
                detalle: text,
                usuario: app.state.currentUser ? app.state.currentUser.nombre : "SIN_SESION",
                fecha_hora: new Date().toISOString()
            };
            app.data.Proyectos_Bitacora.push(log);

            // Only refresh if modal is open and on logs tab
            const modal = document.getElementById('project-details-modal');
            if (!modal.classList.contains('hidden')) {
                // app.ui.openProjectDetails(pId); // This might move current scroll, be careful
            }

            try {
                await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: 'addProjectLog', log: log })
                });
            } catch (e) { console.error(e); }
        },

        updateProjectStatus: async (pId, newStatus) => {
            const p = app.data.Proyectos.find(x => x.id_proyecto === pId);
            if (p) {
                const oldStatus = p.estado;
                p.estado = newStatus;
                // Auto Log
                app.ui.internalAddLog(pId, "AUTO", `Estado central cambiado de "${oldStatus}" a "${newStatus}"`);
            }
            app.ui.renderProjects();

            try {
                await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({
                        action: 'updateProjectStatus',
                        id: pId,
                        status: newStatus
                    })
                });
                app.ui.updateConsole(`PROJECT_STATUS_SYNC: ${pId} -> ${newStatus}`);
            } catch (e) {
                console.error("Sync Error:", e);
                app.ui.updateConsole("SYNC_FAIL", true);
            }
        },

        renderKnowledge: () => {
            const grid = document.getElementById('knowledge-list');
            if (!grid) return;
            grid.innerHTML = '';

            const docs = app.data.Empresa_Documentos.filter(d => d.id_empresa === app.state.companyId);

            if (docs.length === 0) {
                grid.innerHTML = '<div style="text-align:center; padding:40px; color:#999; grid-column:1/-1"><i class="fas fa-cloud-download-alt fa-3x"></i><p>No hay documentos sincronizados.<br>Presiona el botón "Sincronizar" para comenzar.</p></div>';
                return;
            }

            docs.forEach(doc => {
                const card = document.createElement('div');
                card.className = 'card';
                card.style.padding = '15px';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.gap = '10px';

                const icon = doc.mimetype.includes('pdf') ? 'fa-file-pdf' : 'fa-file-alt';
                const color = doc.mimetype.includes('pdf') ? '#e74c3d' : '#3498db';

                card.innerHTML = `
                    <div style="font-size:2rem; color:${color}"><i class="fas ${icon}"></i></div>
                    <div style="font-weight:bold; font-size:0.9rem">${doc.nombre_archivo}</div>
                    <div class="text-small" style="color:#666">${new Date(doc.fecha_sincronizacion).toLocaleDateString()}</div>
                    <div class="flex-between">
                        <button class="btn-small" onclick="window.open('https://drive.google.com/open?id=${doc.id_drive_file}', '_blank')">Abrir</button>
                        <button class="btn-small" onclick="app.ui.viewDocText('${doc.id_drive_file}', this)">Leer IA</button>
                    </div>
                `;
                grid.appendChild(card);
            });
        },

        syncKnowledge: async () => {
            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            let folderId = company ? company.drive_folder_id : null;

            if (!folderId) {
                folderId = prompt("No hay una carpeta configurada. Ingresa el ID de la carpeta de Google Drive:", "");
                if (!folderId) return;
                // Note: To save it permanently, the user should add it to the 'Config_Empresas' sheet Column R
            }

            // Show loading
            const btn = document.querySelector('button[onclick="app.ui.syncKnowledge()"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
            btn.disabled = true;

            try {
                const res = await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: 'syncDriveFiles', id_empresa: app.state.companyId, folderId: folderId })
                });
                const data = await res.json();
                if (data.success) {
                    alert("✅ Sincronización exitosa");
                    await app.loadData();
                    app.ui.renderKnowledge();
                } else {
                    alert("❌ Error: " + data.error);
                }
            } catch (e) {
                console.error(e);
                alert("Error de conexión");
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        },

        viewDocText: async (fileId, btn) => {
            const originalText = btn ? btn.innerText : null;
            if (btn) {
                btn.innerText = "⏳...";
                btn.disabled = true;
            }

            try {
                const res = await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: 'getFileText', fileId: fileId })
                });
                const data = await res.json();
                if (data.success) {
                    document.getElementById('doc-text-content').value = data.text;
                    document.getElementById('doc-text-modal').classList.remove('hidden');
                } else {
                    alert("Error: " + (data.error || "No se pudo leer el archivo"));
                }
            } catch (e) {
                console.error(e);
                alert("Error de conexión");
            } finally {
                if (btn) {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            }
        },

        openKnowledgeModal: () => {
            document.getElementById('knowledge-modal').classList.remove('hidden');
            document.getElementById('k-title').focus();
            document.getElementById('k-msg').classList.add('hidden');
            document.getElementById('form-knowledge-manual').reset();
        },

        saveKnowledgeManual: async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.innerText;
            const title = document.getElementById('k-title').value;
            const text = document.getElementById('k-text').value;
            const img = document.getElementById('k-img').value;
            const msg = document.getElementById('k-msg');

            btn.innerText = "⏳ Guardando...";
            btn.disabled = true;

            try {
                const res = await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({
                        action: 'saveKnowledgeManual',
                        id_empresa: app.state.companyId,
                        title: title,
                        text: text,
                        img: img
                    })
                });
                const data = await res.json();
                if (data.success) {
                    msg.innerText = "✅ Conocimiento guardado";
                    msg.classList.remove('hidden');
                    msg.style.color = "green";
                    await app.loadData();
                    app.ui.renderKnowledge();
                    setTimeout(() => document.getElementById('knowledge-modal').classList.add('hidden'), 1500);
                } else {
                    msg.innerText = "❌ Error: " + data.error;
                    msg.classList.remove('hidden');
                    msg.style.color = "red";
                }
            } catch (e) {
                console.error(e);
                msg.innerText = "❌ Error de conexión";
                msg.classList.remove('hidden');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        },


        // --- DELIVERY OTP MODAL LOGIC ---
        showOtpEntry: (projectId, targetStatus, correctOtp) => {
            app.state._otpContext = { id: projectId, status: targetStatus, correct: correctOtp };
            document.getElementById('otp-entry-input').value = '';
            document.getElementById('otp-modal').classList.remove('hidden');
            setTimeout(() => document.getElementById('otp-entry-input').focus(), 300);
        },

        verifyOtp: async () => {
            const btn = document.querySelector('#otp-modal .btn-primary');
            const originalText = btn.innerText;
            const input = document.getElementById('otp-entry-input').value.trim();
            const { id, status, correct } = app.state._otpContext || {};

            if (!input) return alert("Por favor ingresa el código.");

            if (input === String(correct).trim()) {
                btn.innerText = "⏳ PROCESANDO...";
                btn.disabled = true;
                document.getElementById('otp-modal').classList.add('hidden');
                // Resume the actual status update calling with true to skip OTP check
                await app.pos.updateOrderStatus(id, status, true);
                btn.innerText = originalText;
                btn.disabled = false;
            } else {
                alert("❌ Código incorrecto. Verifica con el cliente.");
                document.getElementById('otp-entry-input').value = '';
                document.getElementById('otp-entry-input').focus();
            }
        },

        closeOtpModal: () => {
            document.getElementById('otp-modal').classList.add('hidden');
            app.state._otpContext = null;
        },

        copyDocText: () => {
            const textArea = document.getElementById('doc-text-content');
            textArea.select();
            document.execCommand('copy');
            const btn = event.target;
            const original = btn.innerText;
            btn.innerText = "¡Copiado!";
            setTimeout(() => btn.innerText = original, 2000);
        },

        renderCatalog: () => {
            const grid = document.getElementById('catalog-grid');
            if (!grid) return;
            grid.innerHTML = '';

            const query = document.getElementById('catalog-search')?.value.toLowerCase() || '';

            // MULTI-TENANT & LOGICAL DELETE FILTER
            let list = (app.data.Catalogo || []).filter(p => {
                const matchCo = p.id_empresa === app.state.companyId;
                const isActive = p.activo !== false && p.activo !== "FALSE" && p.activo !== "0" && p.estado !== "ELIMINADO";
                return matchCo && isActive;
            });

            // SEARCH FILTER
            if (query) {
                list = list.filter(p =>
                    (p.nombre || "").toLowerCase().includes(query) ||
                    (p.id_producto || "").toLowerCase().includes(query) ||
                    (p.categoria || "").toLowerCase().includes(query)
                );
            }

            // SORT BY NAME
            list.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

            list.forEach(prod => {
                const card = document.createElement('div');
                card.className = 'product-card';
                // Premium catalog UI (cleaned up tags and removed solar icon for PFM if relevant)
                const img = prod.imagen_url ? app.utils.fixDriveUrl(prod.imagen_url) : 'https://docs.google.com/uc?export=view&id=1t6BmvpGTCR6-OZ3Nnx-yOmpohe5eCKvv';

                const effectivePrice = app.utils.getEffectivePrice(prod);

                // RBAC Checks (Estándar CRUD)
                const isAdmin = app.state.currentUser && (app.state.currentUser.nivel_acceso >= 10 || app.state.currentUser.rol === 'DIOS');
                const isStaff = app.state.currentUser && (app.state.currentUser.nivel_acceso >= 5 || app.state.currentUser.rol === 'DIOS');

                card.innerHTML = `
                    <div class="product-img">
                        <img src="${img}" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <div class="product-info">
                        <div class="product-title"><b>[${prod.id_producto || 'New'}]</b> ${prod.nombre}</div>
                        <div class="product-stock" style="color: ${parseInt(prod.stock) < 10 ? '#d32f2f' : '#2e7d32'};">
                            Stock: <b>${prod.stock || 0}</b> ${prod.unidad || 'pza'}
                        </div>
                        <div class="product-price">$${effectivePrice.toFixed(2)}</div>
                        <div class="actions-cell" style="margin-top:auto; padding-top:10px; display:flex; gap:5px;">
                            ${isStaff ? `
                                <button class="btn-small" onclick="app.ui.editProductStock('${prod.id_producto}')" style="flex:1;" title="Ajustar Stock">
                                    <i class="fas fa-cubes"></i> Stock
                                </button>` : ''}
                            ${isAdmin ? `
                                <button class="btn-small btn-danger" onclick="app.deleteItem('Catalogo', '${prod.id_producto}')" title="Eliminar Producto">
                                    <i class="fas fa-trash"></i>
                                </button>` : ''}
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        },

        renderStaffPOS: () => {
            const container = document.getElementById('staff-pos-grid');
            if (!container) return;
            container.innerHTML = '';

            const items = app.data.Catalogo.filter(p => {
                const pCo = (p.id_empresa || "").toString().trim().toUpperCase();
                const sCo = app.state.companyId.toUpperCase();
                const isActive = (p.activo == true || p.activo == 1 || p.activo === "TRUE" || p.activo === "1");
                return pCo === sCo && isActive;
            });

            if (items.length === 0) {
                container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px;">No hay productos para vender.</div>';
                return;
            }

            items.forEach(p => {
                const card = document.createElement('div');
                card.className = 'food-card';
                const stock = parseInt(p.stock) || 0;
                const stockColor = stock <= 5 ? '#e74c3c' : (stock <= 15 ? '#f39c12' : '#27ae60');

                const imgRaw = p.imagen_url || p.Imagen_Url || p.IMAGEN_URL || p.url_imagen;
                const img = imgRaw ? app.utils.fixDriveUrl(imgRaw) : 'https://docs.google.com/uc?export=view&id=1t6BmvpGTCR6-OZ3Nnx-yOmpohe5eCKvv';

                const effectivePrice = app.utils.getEffectivePrice(p);

                // Ribbon logic
                let ribbon = '';
                const tag = (p.Etiqueta_Promo || "").toString().trim().toUpperCase();
                if (tag) {
                    const tagClass = tag.includes('OFERTA') ? 'oferta' : (tag.includes('NUEVO') ? 'nuevo' : '');
                    ribbon = `<div class="ribbon ${tagClass}">${tag}</div>`;
                }

                card.innerHTML = `
                    ${ribbon}
                    <div class="food-img-container" style="position:relative;">
                        <img src="${img}" class="food-img">
                        <div style="position:absolute; top:8px; right:8px; background:${stockColor}; color:white; padding:3px 8px; border-radius:4px; font-size:0.65rem; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.2);">
                            ${stock} DISP.
                        </div>
                    </div>
                    <div class="food-info">
                        <div class="food-title-row">
                            <h3>${p.nombre}</h3>
                            <span class="price">$${effectivePrice.toFixed(2)}</span>
                        </div>
                        <div class="food-actions-container">
                            <div class="food-actions">
                                <button onclick="app.pos.removeFromCart('${p.id_producto}')" class="btn-rem-food"><i class="fas fa-minus"></i></button>
                                <span id="qty-${p.id_producto}" class="food-qty">0</span>
                                <button onclick="app.pos.addToCart('${p.id_producto}')" class="btn-add-food"><i class="fas fa-plus"></i></button>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
            app.pos.updateCartVisuals();
            app.pos.updateLastSaleDisplay();
        },

        editProductStock: (id) => {
            const prod = app.data.Catalogo.find(p => p.id_producto === id);
            if (!prod) return;

            document.getElementById('stock-prod-info').innerText = `Producto: [${id}] ${prod.nombre}`;
            document.getElementById('input-new-stock').value = prod.stock;
            document.getElementById('stock-msg').classList.add('hidden');
            document.getElementById('stock-modal-overlay').classList.remove('hidden');

            const btnSave = document.getElementById('btn-save-stock');
            btnSave.onclick = () => app.ui.saveProductStock(id);
        },

        saveProductStock: async (id) => {
            const newStock = document.getElementById('input-new-stock').value;
            app.ui.updateConsole("UPDATING_STOCK...");

            try {
                const res = await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: 'updateProduct', product: { id_producto: id, stock: newStock } })
                });
                const data = await res.json();
                if (data.success) {
                    const p = app.data.Catalogo.find(x => x.id_producto === id);
                    if (p) p.stock = newStock;

                    document.getElementById('stock-msg').classList.remove('hidden');
                    setTimeout(() => {
                        document.getElementById('stock-modal-overlay').classList.add('hidden');
                        app.ui.renderCatalog();
                        if (window.location.hash === '#staff-pos') app.ui.renderStaffPOS();
                    }, 1000);
                }
            } catch (e) { console.error(e); }
        },

        openLeadModal: () => {
            const modal = document.getElementById('lead-modal-overlay');
            const form = document.getElementById('form-new-lead');
            const title = modal.querySelector('h3');
            const submitBtn = form.querySelector('button[type="submit"]');

            title.innerHTML = `<i class="fas fa-user-plus"></i> Nuevo Lead`;
            submitBtn.innerText = "Guardar Lead";
            form.dataset.mode = "create";
            delete form.dataset.leadId;

            modal.classList.remove('hidden');
            document.getElementById('new-lead-name').focus();
            document.getElementById('lead-msg').classList.add('hidden');
            form.reset();
        },

        editLead: (id) => {
            const lead = app.data.Leads.find(l => l.id_lead === id);
            if (!lead) return;

            const modal = document.getElementById('lead-modal-overlay');
            const form = document.getElementById('form-new-lead');
            const title = modal.querySelector('h3');
            const submitBtn = form.querySelector('button[type="submit"]');

            title.innerHTML = `<i class="fas fa-edit"></i> Editar Lead`;
            submitBtn.innerText = "Guardar Cambios";
            form.dataset.mode = "edit";
            form.dataset.leadId = id;

            document.getElementById('new-lead-name').value = lead.nombre || "";
            document.getElementById('new-lead-phone').value = lead.telefono || "";
            document.getElementById('new-lead-email').value = lead.email || "";
            document.getElementById('new-lead-address').value = lead.direccion || "";
            document.getElementById('new-lead-source').value = lead.origen || "Local";

            modal.classList.remove('hidden');
            app.ui.updateConsole(`EDIT_MODE: ${id}`);
        },

        openProductModal: () => {
            document.getElementById('product-modal-overlay').classList.remove('hidden');
            document.getElementById('prod-name').focus();
            document.getElementById('prod-msg').classList.add('hidden');
            document.getElementById('form-new-product').reset();
        },

        openProjectModal: () => {
            document.getElementById('project-modal-overlay').classList.remove('hidden');
            document.getElementById('proj-name').focus();
            document.getElementById('proj-msg').classList.add('hidden');
            document.getElementById('form-new-project').reset();

            // Populate clients - FILTERED BY COMPANY
            const select = document.getElementById('proj-client');
            if (select) {
                select.innerHTML = '<option value="">-- Seleccionar --</option>';
                const filteredLeads = app.data.Leads.filter(l => l.id_empresa === app.state.companyId);
                filteredLeads.forEach(l => {
                    const opt = document.createElement('option');
                    opt.value = l.id_lead;
                    opt.innerText = l.nombre;
                    select.appendChild(opt);
                });
            }
        },

        openAgentsModal: () => {
            console.log("Abriendo Agentes AI...");
            const user = app.state.currentUser;
            const agentsGrid = document.getElementById('agents-grid');
            if (!agentsGrid) {
                console.error("No se encontró el grid de agentes (#agents-grid)");
                return;
            }

            // Defensive check for data
            if (!app.data.Prompts_IA || !Array.isArray(app.data.Prompts_IA)) {
                console.warn("La tabla Prompts_IA no está cargada o es inválida.");
                agentsGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">No se encontraron agentes configurados en la base de datos.</p>';
            } else {
                // Filter Agents by Access Level & Multi-Tenant ID
                const availableAgents = app.data.Prompts_IA.filter(a => {
                    const matchAccess = (parseInt(a.nivel_acceso) || 0) <= user.nivel_acceso;
                    const isEnabled = (a.habilitado === true || a.habilitado === "TRUE");
                    const matchCo = (a.id_empresa || "").toString().trim().toUpperCase() === app.state.companyId.toUpperCase() || (a.id_empresa || "").toString().trim().toUpperCase() === "GLOBAL";
                    return matchAccess && isEnabled && matchCo;
                });

                if (availableAgents.length === 0) {
                    agentsGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">No hay agentes disponibles para tu nivel de acceso.</p>';
                } else {
                    agentsGrid.innerHTML = availableAgents.map(agt => `
                        <div class="feature-card" onclick="app.agents.select('${agt.id_agente}')" style="cursor:pointer; border:1px solid var(--primary-color);">
                            <i class="fas ${app.ui.getAgentIcon(agt.nombre)}"></i>
                            <h3>${agt.nombre}</h3>
                            <p>${(agt.prompt_base || "").substring(0, 60)}...</p>
                            ${(agt.recibe_files === true || agt.recibe_files === "TRUE") ? '<small style="background:#4caf50; color:white; padding:2px 5px; border-radius:4px; font-size:0.6rem;">Soporta Archivos</small>' : ''}
                        </div>
                    `).join('');
                }
            }

            window.location.hash = "#agents";
        },

        getAgentIcon: (name) => {
            const icons = {
                "Diseñador": "fa-palette",
                "Ventas": "fa-comments-dollar",
                "Cotizador": "fa-calculator",
                "Marketing": "fa-bullhorn",
                "Pilares": "fa-landmark",
                "Corporativo": "fa-file-contract",
                "Analista": "fa-chart-line",
                "Clasificador": "fa-sitemap",
                "Servicio": "fa-headset",
                "Asistente": "fa-robot",
                "Director": "fa-crown"
            };
            for (let key in icons) if (name.toLowerCase().includes(key.toLowerCase())) return icons[key];
            return "fa-brain";
        },

        bindEvents: () => {
            // Login Modal
            const loginTrigger = document.getElementById('btn-login-trigger');
            if (loginTrigger) {
                loginTrigger.onclick = (e) => {
                    e.preventDefault();
                    app.ui.showLogin();
                };
            }

            // Enter Key Navigation
            const loginUser = document.getElementById('login-user');
            if (loginUser) {
                loginUser.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const pass = document.getElementById('login-pass');
                        if (pass) pass.focus();
                    }
                });
            }

            const loginPass = document.getElementById('login-pass');
            if (loginPass) {
                loginPass.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const submit = document.getElementById('btn-login-submit');
                        if (submit) submit.click();
                    }
                });
            }

            const closeLogin = document.getElementById('btn-close-login');
            if (closeLogin) {
                closeLogin.onclick = () => {
                    document.getElementById('login-modal-overlay').classList.add('hidden');
                };
            }

            // Login Submit
            const loginSubmit = document.getElementById('btn-login-submit');
            if (loginSubmit) {
                loginSubmit.onclick = () => {
                    const uInput = document.getElementById('login-user');
                    const pInput = document.getElementById('login-pass');
                    const u = uInput.value;
                    const p = pInput.value;

                    const res = app.auth.login(u, p);
                    pInput.value = '';

                    if (!res.success) {
                        const err = document.getElementById('login-error');
                        if (err) {
                            err.innerText = res.msg;
                            err.classList.remove('hidden');
                        }
                    } else {
                        uInput.value = '';
                    }
                };
            }

            // Knowledge Manual Submit
            const kForm = document.getElementById('form-knowledge-manual');
            if (kForm) {
                kForm.onsubmit = app.ui.saveKnowledgeManual;
            }

            // Logout
            const logoutBtn = document.getElementById('btn-logout');
            if (logoutBtn) {
                logoutBtn.onclick = (e) => {
                    e.preventDefault();
                    app.auth.logout();
                };
            }

            // Activity Monitor Reset
            document.body.onclick = () => app.state.lastActivity = Date.now();
            document.body.onmousemove = () => app.state.lastActivity = Date.now();
            document.body.onkeypress = () => app.state.lastActivity = Date.now();

            // New Lead Logic
            const closeLead = document.getElementById('btn-close-lead');
            if (closeLead) {
                closeLead.onclick = () => {
                    document.getElementById('lead-modal-overlay').classList.add('hidden');
                };
            }

            document.getElementById('form-new-lead').onsubmit = async (e) => {
                e.preventDefault();
                const form = e.target;
                if (form.dataset.submitting === "true") return; // Prevent double submit
                form.dataset.submitting = "true";

                const mode = form.dataset.mode || "create";
                const leadId = form.dataset.leadId;

                const btn = form.querySelector('button');
                const originalText = btn.innerText;
                btn.innerText = "Enviando...";
                btn.disabled = true;

                const toTitleCase = (str) => str.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());

                const name = toTitleCase(document.getElementById('new-lead-name').value);
                const phone = document.getElementById('new-lead-phone').value;
                const email = document.getElementById('new-lead-email').value;
                const address = document.getElementById('new-lead-address').value;
                const source = toTitleCase(document.getElementById('new-lead-source').value);

                const leadData = {
                    id_lead: leadId || ("lead-" + Date.now()),
                    id_empresa: app.state.companyId,
                    nombre: name,
                    telefono: phone,
                    email: email,
                    direccion: address,
                    origen: source,
                    estado: "NUEVO",
                    activo: true,
                    fecha_creacion: new Date().toISOString()
                };

                try {
                    const action = (mode === "edit") ? "updateLead" : "createLead";
                    const response = await fetch(app.apiUrl, {
                        method: 'POST',
                        redirect: "follow",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify({ action: action, lead: leadData })
                    });

                    const result = await response.json();

                    if (!result.success && !result.status) {
                        throw new Error("Backend devolvió error: " + JSON.stringify(result));
                    }

                    if (mode === "create") {
                        if (result.newId) leadData.id_lead = result.newId;
                        app.data.Leads.unshift(leadData);
                    } else {
                        const idx = app.data.Leads.findIndex(l => l.id_lead === leadId);
                        if (idx !== -1) app.data.Leads[idx] = { ...app.data.Leads[idx], ...leadData };
                    }

                    app.ui.renderLeads();

                    const msg = document.getElementById('lead-msg');
                    msg.innerText = (mode === "edit") ? "¡Cambios guardados!" : "¡Guardado en Google Sheets!";
                    msg.classList.remove('hidden');

                    setTimeout(() => {
                        document.getElementById('lead-modal-overlay').classList.add('hidden');
                        msg.classList.add('hidden');
                        btn.innerText = originalText;
                        btn.disabled = false;
                        e.target.reset();
                    }, 1500);

                } catch (err) {
                    console.error("Fetch Error:", err);
                    alert("❌ ERROR AL PROCESAR:\n" + err.message);
                    btn.innerText = originalText;
                    btn.disabled = false;
                } finally {
                    form.dataset.submitting = "false";
                }
            };

            // New Product Logic
            document.getElementById('btn-close-product').onclick = () => {
                document.getElementById('product-modal-overlay').classList.add('hidden');
            };
            document.getElementById('form-new-product').onsubmit = async (e) => {
                e.preventDefault();
                const form = e.target;
                if (form.dataset.submitting === "true") return;
                form.dataset.submitting = "true";

                const btn = form.querySelector('button');
                btn.disabled = true;

                const toTitleCase = (str) => str.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());

                const name = toTitleCase(document.getElementById('prod-name').value);
                const desc = document.getElementById('prod-desc').value;
                const cat = toTitleCase(document.getElementById('prod-cat').value);
                const price = parseFloat(document.getElementById('prod-price').value) || 0;
                const offer = parseFloat(document.getElementById('prod-offer').value) || 0;
                const stock = parseInt(document.getElementById('prod-stock').value) || 0;
                const unit = document.getElementById('prod-unit').value || "pza";
                const img = document.getElementById('prod-img').value;

                const newProd = {
                    id_producto: "PROD-" + Date.now().toString().slice(-6),
                    id_empresa: app.state.companyId,
                    nombre: name,
                    descripcion: desc,
                    categoria: cat,
                    precio: price,
                    precio_oferta: offer,
                    stock: stock,
                    unidad: unit,
                    imagen_url: img,
                    activo: true
                };

                app.data.Catalogo.push(newProd);
                app.ui.renderCatalog();

                // Send to Backend
                try {
                    const response = await fetch(app.apiUrl, {
                        method: 'POST',
                        redirect: "follow",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify({ action: 'createProduct', product: newProd })
                    });
                    const res = await response.json();
                    if (res.newId) {
                        // Update local ID
                        const idx = app.data.Catalogo.indexOf(newProd);
                        if (idx !== -1) app.data.Catalogo[idx].id_producto = res.newId;
                        app.ui.renderCatalog();
                    }
                } catch (err) { console.error(err); } finally {
                    form.dataset.submitting = "false";
                }

                const msg = document.getElementById('prod-msg');
                msg.classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('product-modal-overlay').classList.add('hidden');
                    msg.classList.add('hidden');
                    btn.disabled = false;
                }, 1000);
            };

            // New Project Logic
            document.getElementById('btn-close-project').onclick = () => {
                document.getElementById('project-modal-overlay').classList.add('hidden');
            };
            document.getElementById('form-new-project').onsubmit = async (e) => {
                e.preventDefault();
                const form = e.target;
                if (form.dataset.submitting === "true") return;
                form.dataset.submitting = "true";

                const btn = form.querySelector('button');
                btn.disabled = true;

                const toTitleCase = (str) => str.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());

                const name = toTitleCase(document.getElementById('proj-name').value);
                const client = document.getElementById('proj-client').value;
                const clientName = document.getElementById('proj-client').options[document.getElementById('proj-client').selectedIndex].text;
                const status = document.getElementById('proj-status').value;
                const start = document.getElementById('proj-start').value;
                const end = document.getElementById('proj-end').value;

                const newProj = {
                    id_proyecto: "proj-" + Date.now(),
                    id_empresa: app.state.companyId,
                    id_cliente: client,
                    cliente_nombre: clientName,
                    nombre_proyecto: name,
                    estado: status,
                    fecha_inicio: start,
                    fecha_fin: end
                };

                app.data.Proyectos.unshift(newProj);
                app.ui.renderProjects();

                // Send to Backend
                try {
                    const response = await fetch(app.apiUrl, {
                        method: 'POST',
                        redirect: "follow",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify({ action: 'createProject', project: newProj })
                    });
                    const res = await response.json();
                    if (res.newId) {
                        const idx = app.data.Proyectos.indexOf(newProj);
                        if (idx !== -1) app.data.Proyectos[idx].id_proyecto = res.newId;
                        app.ui.renderProjects();
                    }
                } catch (err) { console.error(err); } finally {
                    form.dataset.submitting = "false";
                }

                const msg = document.getElementById('proj-msg');
                msg.classList.remove('hidden');
                setTimeout(() => {
                    document.getElementById('project-modal-overlay').classList.add('hidden');
                    msg.classList.add('hidden');
                    btn.disabled = false;
                }, 1000);
            };

            // Public Lead Form Logic
            document.getElementById('public-lead-form').onsubmit = async (e) => {
                e.preventDefault();
                const form = e.target;
                if (form.dataset.submitting === "true") return;
                form.dataset.submitting = "true";

                const btn = form.querySelector('button');
                const originalText = btn.innerText;
                btn.innerText = "Enviando...";
                btn.disabled = true;

                const toTitleCase = (str) => str.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());

                const name = toTitleCase(document.getElementById('lead-name').value);
                const phone = document.getElementById('lead-phone').value;
                const email = document.getElementById('lead-email').value;
                const address = document.getElementById('lead-address').value;

                const newLead = {
                    id_lead: "lead-" + Date.now(),
                    id_empresa: app.state.companyId,
                    nombre: name,
                    telefono: phone,
                    email: email,
                    direccion: address,
                    origen: "Web",
                    estado: "NUEVO",
                    fecha_creacion: new Date().toISOString()
                };

                try {
                    const response = await fetch(app.apiUrl, {
                        method: 'POST',
                        redirect: "follow",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify({ action: 'createLead', lead: newLead })
                    });

                    const result = await response.json();

                    if (result.success || result.status === "online") {
                        // Optimistic Update for Staff testing public form
                        if (result.newId) newLead.id_lead = result.newId;
                        if (!app.data.Leads) app.data.Leads = [];
                        app.data.Leads.unshift(newLead);
                        app.ui.renderLeads();

                        alert("¡Gracias! Tus datos han sido enviados correctamente. Un asesor se contactará contigo pronto.");
                        form.reset();
                    } else {
                        throw new Error("Error en el servidor");
                    }
                } catch (err) {
                    console.error("Fetch Error:", err);
                    alert("❌ Error al enviar datos. Inténtalo más tarde.");
                } finally {
                    btn.innerText = originalText;
                    btn.disabled = false;
                    form.dataset.submitting = "false";
                }
            };

            // AI Chat Enter Key
            const chatInput = document.getElementById('chat-user-input');
            if (chatInput) {
                chatInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        app.agents.sendMessage();
                    }
                });
            }
        } // End bindEvents
    }, // End UI

    // -------------------------------------------------------------------------
    // AI AGENTS LOGIC
    // -------------------------------------------------------------------------
    agents: {
        run: (agentName) => {
            const box = document.getElementById('agent-output-box');
            const output = document.getElementById('agent-response');
            const title = document.getElementById('agent-title');

            box.classList.remove('hidden');
            title.innerText = `🤖 ${agentName} pensando...`;
            output.value = "Conectando con la red neuronal de EVASOL...";

            setTimeout(() => {
                title.innerText = `✅ Respuesta del ${agentName}`;
                let response = "";

                const leads = app.data.Leads.length;
                const projs = app.data.Proyectos.length;
                const docs = app.data.Empresa_Documentos.length;

                if (agentName === 'Escritor') {
                    response = `[BORRADOR GENERADO]\n\nBasado en la estructura de EVASOL y los ${docs} documentos sincronizados, estoy listo para redactar.`;
                } else if (agentName === 'Analista') {
                    response = `[ANÁLISIS DE DATOS REAL]\n\n📊 Resumen de Operaciones:\n- Leads: ${leads}\n- Proyectos: ${projs}\n- Base de Conocimiento: ${docs} archivos.`;
                } else if (agentName === 'Marketing') {
                    response = `[ESTRATEGIA]\n\nUsando el nombre "${app.state.companyId}", podemos lanzar una campaña resaltando nuestros ${projs} proyectos exitosos.`;
                } else if (agentName === 'Negocio') {
                    response = `[INTELIGENCIA DE NEGOCIO]\n\nDetecto ${docs} documentos. Si sincronizas el 'Acta Constitutiva', podré detallar la estructura legal.`;
                }

                output.value = response;
            }, 1000);
        },

        select: (agtId) => {
            const agt = app.data.Prompts_IA.find(a => a.id_agente === agtId);
            if (!agt) return;

            app.state.currentAgent = agt;
            app.state.chatHistory = []; // Reset history for new session

            document.getElementById('agent-display-name').innerText = agt.nombre;
            document.getElementById('ai-chat-container').classList.remove('hidden');

            const historyDiv = document.getElementById('chat-history');
            historyDiv.innerHTML = `
    <div class="ai-msg" style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid var(--primary-color); max-width: 80%; align-self: flex-start; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
        Hola, soy tu <b>${agt.nombre}</b>. ¿En qué puedo apoyarte hoy?
    </div>
    `;

            // Scroll to agent list or chat
            document.getElementById('ai-chat-container').scrollIntoView({ behavior: 'smooth' });
        },

        closeChat: () => {
            document.getElementById('ai-chat-container').classList.add('hidden');
            app.state.currentAgent = null;
        },

        diagnoseAi: async () => {
            app.ui.updateConsole("AI_DIAGNOSING...");
            try {
                const res = await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: 'listAiModels' })
                });
                const data = await res.json();
                if (data.success) {
                    const models = data.models || [];
                    // Pick the best available: 2.5 > 2.0 > 1.5 > first
                    const best = models.find(m => m.includes('2.5-flash')) ||
                        models.find(m => m.includes('2.0-flash')) ||
                        models.find(m => m.includes('1.5-flash')) ||
                        models[0];
                    app.state._aiModel = best;
                    localStorage.setItem('evasol_ai_model', best);
                    alert(`✅ Diagnóstico Exitoso.\n\nModelos detectados:\n${models.join('\n')}\n\nSeleccionado para uso: ${best}\n\nConfiguración guardada permanentemente.`);
                    app.ui.updateConsole("AI_READY");
                } else {
                    alert("❌ Error de Diagnóstico: " + data.error);
                    app.ui.updateConsole("AI_FAIL", true);
                }
            } catch (e) {
                console.error(e);
                alert("Error de conexión al diagnosticar IA.");
            }
        },

        sendMessage: async () => {
            const input = document.getElementById('chat-user-input');
            const text = input.value.trim();
            if (!text || !app.state.currentAgent) return;

            // 1. Add User Message to UI
            app.agents.addMessageToUI('user', text);
            input.value = '';

            // 2. Prepare History for AI
            app.state.chatHistory.push({ role: 'user', content: text });

            // 3. Show Loading
            document.getElementById('ai-loading').classList.remove('hidden');
            document.getElementById('btn-send-chat').disabled = true;
            app.ui.updateConsole("AI_PROCESSING...");

            try {
                // 4. Call Backend Proxy
                const response = await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({
                        action: 'askGemini',
                        agentId: app.state.currentAgent.id_agente,
                        promptBase: app.state.currentAgent.prompt_base,
                        history: app.state.chatHistory,
                        message: text,
                        model: app.state._aiModel || localStorage.getItem('evasol_ai_model') || "gemini-1.5-flash"
                    })
                });

                const data = await response.json();

                if (data.success) {
                    app.agents.addMessageToUI('ai', data.answer);
                    app.state.chatHistory.push({ role: 'model', content: data.answer });
                } else {
                    let fullError = data.error || "No se pudo conectar con la IA.";
                    if (data.detail) fullError += "\n\nDetalle técnico: " + data.detail;
                    app.agents.addMessageToUI('ai', "❌ Error: " + fullError);
                }
            } catch (e) {
                console.error(e);
                app.ui.updateConsole("AI_CONN_FAIL", true);
                app.agents.addMessageToUI('ai', "❌ Error de conexión con el servidor.");
            } finally {
                document.getElementById('ai-loading').classList.add('hidden');
                document.getElementById('btn-send-chat').disabled = false;
            }
        },

        addMessageToUI: (role, text) => {
            const historyDiv = document.getElementById('chat-history');
            const msgDiv = document.createElement('div');

            const isAi = role === 'ai';
            msgDiv.className = isAi ? 'ai-msg' : 'user-msg';

            // Inline Styles for simplicity
            msgDiv.style.padding = '12px';
            msgDiv.style.borderRadius = '8px';
            msgDiv.style.maxWidth = '80%';
            msgDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
            msgDiv.style.marginBottom = '10px';

            if (isAi) {
                msgDiv.style.background = 'white';
                msgDiv.style.borderLeft = '4px solid var(--primary-color)';
                msgDiv.style.alignSelf = 'flex-start';

                // Detect JSON for automatic ticket triggering
                if (text.includes('{') && text.includes('}')) {
                    try {
                        const potentialJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
                        const ticket = JSON.parse(potentialJson);
                        if (ticket.nombre && (ticket.queja || ticket.reporte)) {
                            app.agents.sendSupportTicket(ticket);
                            msgDiv.innerHTML = "✅ Reporte generado y enviado con éxito. Cerrando chat...";
                            historyDiv.appendChild(msgDiv);
                            return;
                        }
                    } catch (e) { }
                }

                msgDiv.innerHTML = text.replace(/\n/g, '<br>'); // Simple break formatting
            } else {
                msgDiv.style.background = 'var(--primary-color)';
                msgDiv.style.color = 'white';
                msgDiv.style.alignSelf = 'flex-end';
                msgDiv.innerText = text;
            }

            historyDiv.appendChild(msgDiv);
            historyDiv.scrollTop = historyDiv.scrollHeight;
        },

        sendSupportTicket: async (ticketData) => {
            app.ui.updateConsole("SENDING_TICKET...");
            try {
                const currentCo = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
                const response = await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({
                        action: 'createSupportTicket',
                        ticket: {
                            id_empresa: app.state.companyId,
                            nombre: ticketData.nombre,
                            telefono: ticketData.telefono,
                            email: ticketData.email || currentCo?.email || "n/a",
                            queja: ticketData.queja || ticketData.reporte
                        }
                    })
                });
                const res = await response.json();
                if (res.success) {
                    app.ui.updateConsole("TICKET_SENT");
                    setTimeout(() => {
                        app.agents.closeChat();
                        alert("¡Gracias! Tu reporte ha sido enviado al equipo de soporte.");
                    }, 1500);
                }
            } catch (e) { console.error(e); }
        }
    },

    // -------------------------------------------------------------------------
    // ROUTER
    // -------------------------------------------------------------------------
    router: {
        init: () => {
            window.addEventListener('hashchange', app.router.handleRoute);
            app.router.handleRoute(); // Load current hash
        },
        handleRoute: () => {
            const hash = window.location.hash || '#orbit';

            // Protected Routes Check
            const protectedRoutes = ['#dashboard', '#leads', '#projects', '#catalog', '#agents', '#knowledge', '#pos', '#staff-pos', '#reports'];
            if (protectedRoutes.includes(hash) && !app.state.currentUser) {
                window.location.hash = '#home';
                return;
            }

            // Hide all sections
            document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));

            // Show target section
            if (hash === '#home') document.getElementById('view-home').classList.remove('hidden');
            if (hash === '#pillars') {
                document.getElementById('view-pillars').classList.remove('hidden');
                const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
                if (company) app.ui.renderPillars(company);
            }
            if (hash === '#contact') document.getElementById('view-contact').classList.remove('hidden');
            // RBAC Route Protection 🛡️
            const userCurrent = app.state.currentUser;
            if (userCurrent && hash.startsWith('#') && !['#home', '#logout', '#dashboard'].includes(hash)) {
                const getVal = (obj, keys) => {
                    const foundKey = Object.keys(obj).find(k => keys.includes(k.toLowerCase().trim()));
                    return foundKey ? (obj[foundKey] || "").toString().trim() : "";
                };
                const userRole = getVal(userCurrent, ['id_rol', 'rol', 'role']).toUpperCase();
                const sCoId = (app.state.companyId || "").toString().trim().toUpperCase();

                const roleConfig = app.data.Config_Roles.find(r => {
                    const rRoleId = getVal(r, ['id_rol', 'rol', 'role']).toUpperCase();
                    const rCoId = getVal(r, ['id_empresa', 'empresa', 'company']).toUpperCase();
                    return rRoleId === userRole && (rCoId === sCoId || rCoId === "GLOBAL");
                });

                const visibleModules = (roleConfig?.modulos_visibles || userCurrent.modulos_visibles || "").toLowerCase();
                const level = parseInt(userCurrent.nivel_acceso) || 0;
                const isAdmin = level >= 10;
                const isStaff = level >= 3;

                if (!roleConfig && !userCurrent.modulos_visibles) {
                    console.warn(`⚠️ ROLE_NOT_FOUND: Implementing Level ${level} failsafe permissions.`);
                    if (isAdmin) visibleModules = "dashboard,leads,projects,catalog,knowledge,agents,reports,pos,staff-pos";
                    else if (level >= 5) visibleModules = "dashboard,leads,projects,catalog,knowledge,agents,reports,pos";
                    else if (isStaff) visibleModules = "dashboard,staff-pos,pos";
                }

                // Smarter check: ignore # for comparison
                const targetBase = hash.replace('#', '').toLowerCase();
                const modulesArray = visibleModules.split(/[\s,;]+/).map(m => m.replace('#', '').trim().toLowerCase());

                if (!isAdmin && hash !== '#dashboard' && !modulesArray.includes(targetBase)) {
                    console.log(`🔒 ACCESS_DENIED TO ${hash} FOR ${userCurrent.id_rol}. ALLOWED: ${modulesArray}`);
                    window.location.hash = '#dashboard';
                    return;
                }
            }

            if (hash === '#dashboard') document.getElementById('view-dashboard').classList.remove('hidden');

            if (hash === '#agents') {
                if (app.state.currentUser && app.state.currentUser.nivel_acceso >= 5) {
                    document.getElementById('view-agents').classList.remove('hidden');
                } else {
                    window.location.hash = '#dashboard'; // Access Denied
                }
            }

            if (hash === '#leads') {
                document.getElementById('view-leads').classList.remove('hidden');
                app.ui.renderLeads();
            }
            if (hash === '#projects') {
                document.getElementById('view-projects').classList.remove('hidden');
                app.ui.renderProjects();
            }
            if (hash === '#catalog') {
                document.getElementById('view-catalog').classList.remove('hidden');
                app.ui.renderCatalog();
            }
            if (hash === '#orbit') {
                document.getElementById('view-orbit').classList.remove('hidden');
                app.ui.renderOrbit();
            }
            if (hash === '#knowledge') {
                document.getElementById('view-knowledge').classList.remove('hidden');
                app.ui.renderKnowledge();
            }
            if (hash === '#staff-pos') {
                document.getElementById('view-staff-pos').classList.remove('hidden');
                app.ui.renderStaffPOS();
            }
            if (hash === '#pos') {
                document.getElementById('view-pos').classList.remove('hidden');
                app.ui.renderPOS();
            }
            if (hash === '#reports') {
                document.getElementById('view-reports').classList.remove('hidden');
                app.ui.handleReportTypeChange();
            }

            // WhatsApp Float Visibility
            const waFloat = document.getElementById('whatsapp-float');
            if (waFloat) {
                if (hash === '#orbit' || !app.state.companyId) {
                    waFloat.classList.add('hidden');
                } else {
                    waFloat.classList.remove('hidden');
                }
            }

            // Scroll to top
            window.scrollTo(0, 0);
        }
    },

    // -------------------------------------------------------------------------
    // MONITOR (TIMEOUT)
    // -------------------------------------------------------------------------
    // POS & ORDERING SYSTEM (PFM)
    // -------------------------------------------------------------------------
    pos: {
        addToCart: (id) => {
            const userRole = (app.state.currentUser?.id_rol || "").toString().toUpperCase();
            if (userRole === 'DELIVERY' || (app.state.currentUser?.nombre || "").toUpperCase().includes('REPARTIDOR')) {
                return; // Silently ignore or show message
            }

            const prod = app.data.Catalogo.find(p => p.id_producto === id);
            if (!prod) return;

            // Stock Check
            if (parseInt(prod.stock) <= 0) {
                alert("Sin inventario para este producto.");
                return;
            }

            const inCart = app.state.cart.find(i => i.id === id);
            if (inCart) {
                if (inCart.qty >= parseInt(prod.stock)) {
                    alert("No hay más stock disponible.");
                    return;
                }
                inCart.qty++;
            } else {
                const price = app.utils.getEffectivePrice(prod);
                app.state.cart.push({ id: prod.id_producto, name: prod.nombre, price: price, qty: 1 });
            }
            app.pos.updateCartVisuals();
        },

        removeFromCart: (id) => {
            const idx = app.state.cart.findIndex(i => i.id === id);
            if (idx > -1) {
                app.state.cart[idx].qty--;
                if (app.state.cart[idx].qty <= 0) app.state.cart.splice(idx, 1);
            }
            app.pos.updateCartVisuals();
        },

        clearCart: () => {
            app.state.cart = [];
            app.pos.updateCartVisuals();
        },

        updateCartVisuals: () => {
            let total = 0;
            let count = 0;

            document.querySelectorAll('.food-qty').forEach(el => el.innerText = '0');

            app.state.cart.forEach(item => {
                total += item.price * item.qty;
                count += item.qty;
                const qtyDisplay = document.getElementById(`qty-${item.id}`);
                if (qtyDisplay) qtyDisplay.innerText = item.qty;
            });

            // Standard POS Visuals (Mobile/Client)
            const totalEl = document.getElementById('cart-total');
            if (totalEl) totalEl.innerText = `$${total.toFixed(2)}`;

            const countEl = document.getElementById('cart-count-badge');
            if (countEl) {
                countEl.innerText = count;
                countEl.classList.toggle('hidden', count === 0);
            }

            // Ticket Sidebar Visuals (Staff)
            const ticketTotalEl = document.getElementById('ticket-total');
            if (ticketTotalEl) ticketTotalEl.innerText = `$${total.toFixed(2)}`;

            const ticketCountEl = document.getElementById('ticket-count');
            if (ticketCountEl) ticketCountEl.innerText = count;

            app.pos.renderTicketContent();
            app.pos.updateLastSaleDisplay();
        },

        renderTicketContent: () => {
            const container = document.getElementById('ticket-items');
            if (!container) return;

            // Update Ticket Logo to match current company
            const logoEl = document.getElementById('ticket-logo');
            const currentCo = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            if (logoEl && currentCo) {
                const logoUrl = currentCo.logo_url || currentCo.url_logo;
                if (logoUrl) {
                    logoEl.src = app.utils.fixDriveUrl(logoUrl);
                    logoEl.classList.remove('hidden');
                } else {
                    logoEl.classList.add('hidden');
                }
            }

            if (app.state.cart.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Carrito vacío</p>';
                return;
            }

            container.innerHTML = app.state.cart.map(item => `
                <div class="ticket-item">
                    <div class="ticket-item-name">${item.name} x${item.qty}</div>
                    <div class="ticket-item-price">$${(item.price * item.qty).toFixed(2)}</div>
                </div>
            `).join('');

            const dateEl = document.getElementById('ticket-date');
            if (dateEl) dateEl.innerText = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },

        checkoutStaff: async () => {
            if (app.state.cart.length === 0) return alert("Elegir productos primero.");

            // Get Express/Customer data from staff sidebar
            const sName = document.getElementById('pos-cust-name').value || "Venta en Mostrador";
            const sPhone = document.getElementById('pos-cust-phone').value || "5218120731000";
            const sAddress = document.getElementById('pos-cust-address').value || "MOSTRADOR";
            const sNotes = document.getElementById('pos-cust-notes')?.value || "";

            // Map to main checkout inputs (modal inputs are used as bridge)
            const mainName = document.getElementById('cust-name');
            const mainPhone = document.getElementById('cust-phone');
            const mainAddress = document.getElementById('cust-address');
            const mainNotes = document.getElementById('cust-notes');

            if (mainName) mainName.value = sName;
            if (mainPhone) mainPhone.value = sPhone;
            if (mainAddress) mainAddress.value = sAddress;
            if (mainNotes) mainNotes.value = sNotes;

            const method = document.getElementById('pos-pay-method').value;
            const folio = document.getElementById('pos-pay-folio').value || '';

            document.getElementById('pay-method').value = method;
            document.getElementById('pay-confirm').value = folio;

            await app.pos.checkout();

            // Clear sidebar fields after success
            document.getElementById('pos-cust-name').value = '';
            document.getElementById('pos-cust-phone').value = '';
            document.getElementById('pos-cust-address').value = '';
            const nEl = document.getElementById('pos-cust-notes');
            if (nEl) nEl.value = '';
        },

        updateLastSaleDisplay: () => {
            const el = document.getElementById('ticket-last-val');
            if (!el) return;

            const myProjectIds = app.data.Proyectos
                .filter(p => p.id_empresa === app.state.companyId)
                .map(p => p.id_proyecto);

            const payments = (app.data.Proyectos_Pagos || [])
                .filter(pay => myProjectIds.includes(pay.id_proyecto))
                .sort((a, b) => new Date(b.fecha_pago || 0) - new Date(a.fecha_pago || 0));

            const lastOne = payments[0];
            el.innerText = lastOne ? `$${parseFloat(lastOne.monto).toFixed(2)}` : "$0.00";
        },

        checkout: async () => {
            if (app.state.cart.length === 0) return alert("El carrito está vacío.");

            const name = document.getElementById('cust-name').value;
            const phone = document.getElementById('cust-phone').value;
            const address = document.getElementById('cust-address')?.value || '';
            const notes = document.getElementById('cust-notes')?.value || '';
            const method = document.getElementById('pay-method').value;
            const confirmNum = document.getElementById('pay-confirm')?.value || '';
            const isStaffSale = (name === "Venta en Mostrador");

            if (!name || (!isStaffSale && !phone) || (!isStaffSale && !address)) {
                return alert("Por favor ingresa nombre, teléfono y dirección.");
            }

            // UI Feedback: Detect which button to animate (Public vs Staff)
            const btnStaff = document.getElementById('btn-pos-checkout');
            const btnPublic = document.getElementById('btn-confirm-order');
            const btn = isStaffSale ? btnStaff : btnPublic;

            const originalText = btn ? btn.innerText : "...";
            if (btn) {
                btn.innerText = "⏳ Procesando...";
                btn.disabled = true;
            }

            // 1. Create Lead (o buscar existente)
            const leadData = {
                id_empresa: app.state.companyId,
                nombre: name,
                telefono: phone,
                direccion: address,
                origen: isStaffSale ? 'APP-POS-COUNTER' : 'APP-ORDER'
            };

            const cartTotal = parseFloat(document.getElementById('ticket-total')?.innerText.replace('$', '')) ||
                parseFloat(document.getElementById('staff-cart-total')?.innerText.replace('$', '')) ||
                parseFloat(document.getElementById('cart-total')?.innerText.replace('$', '')) || 0;

            app.ui.updateConsole("CREATING_ORDER...");

            try {
                // Submit Lead
                const lRes = await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: 'createLead', lead: leadData })
                });
                const lData = await lRes.json();

                // --- 2. Create Order (Project) ---
                const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
                const useOtp = company?.usa_otp_entrega === true || company?.usa_otp_entrega === "TRUE";
                let generatedOtp = "";

                if (useOtp) {
                    generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
                    app.state._currentOrderOtp = generatedOtp; // Temp store for step 3
                }

                const orderData = {
                    id_empresa: app.state.companyId,
                    id_cliente: lData.newId,
                    nombre_proyecto: `Pedido ${company?.nomempresa || "POS"} - ${name}`,
                    descripcion: notes,
                    estado: 'PEDIDO-RECIBIDO',
                    fecha_inicio: new Date().toISOString(),
                    line_items: JSON.stringify(app.state.cart),
                    codigo_otp: generatedOtp
                };

                const oRes = await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: 'createProject', project: orderData })
                });
                const oData = await oRes.json();

                // 3. Register Payment
                const payData = {
                    id_empresa: app.state.companyId,
                    id_proyecto: oData.newId || orderData.id_proyecto,
                    monto: cartTotal,
                    concepto: `Venta POS - ${name}`,
                    metodo_pago: method,
                    folio: confirmNum || "CAJA",
                    referencia: isStaffSale ? "STAFF" : "CLIENTE-URL"
                };

                await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: 'addProjectPayment', payment: payData })
                });

                // 4. Send WhatsApp Notification
                // We use app.state.cart (Items_JSON source) to build a beautiful summary
                const itemsText = app.state.cart.map(c => `• *${c.name}* x${c.qty} _($${(c.price * c.qty).toFixed(2)})_`).join('\n');

                let waMsg =
                    `🚀 *NUEVA ORDEN RECIBIDA*\n` +
                    `----------------------------\n` +
                    `👤 *Cliente:* ${name}\n` +
                    `📞 *Tel:* ${phone}\n` +
                    `📍 *Dir:* ${address}\n` +
                    (notes ? `📝 *Notas:* ${notes}\n` : "") +
                    `💳 *Pago:* ${method}\n`;

                if (generatedOtp) {
                    waMsg += `🔑 *CÓDIGO DE ENTREGA:* ${generatedOtp}\n`;
                }

                waMsg +=
                    `----------------------------\n` +
                    `📦 *PRODUCTOS:*\n${itemsText}\n` +
                    `----------------------------\n` +
                    `💰 *TOTAL A PAGAR: $${cartTotal.toFixed(2)}*\n\n` +
                    `_Enviado desde el sistema SuitOrg POS Express._`;

                const encodedMsg = encodeURIComponent(waMsg);
                const waBase = "https://wa.me/5218120731000"; // Dynamic or PFM business link

                /* Automatic send removed to favor Step 3 Manual Trigger per user request
                if (phone && phone !== "N/A" && phone !== "0000000000") {
                    console.log("SENDING_AUTO_WA:", waMsg);
                    window.open(`${waBase}?text=${encodedMsg}`, '_blank');
                } else {
                    console.log("ORDER_STORED_WITHOUT_WA_NOTIF");
                }
                */


                // alert(isStaffSale ? "¡Venta registrada con éxito!" : "¡Pedido recibido con éxito! En breve recibirás confirmación por WhatsApp.");

                if (isStaffSale) {
                    alert("¡Venta registrada con éxito!");
                    app.pos.clearCart();
                    app.pos.closeCheckout(); // Clean all fields
                } else {
                    // Move to Step 3 (Success/WhatsApp) - DO NOT clear cart yet so WhatsApp message can be built
                    app.pos.nextStep(3);
                }

                // 5. UPDATE STOCK ON BACKEND
                for (const item of app.state.cart) {
                    const prod = app.data.Catalogo.find(p => p.id_producto === item.id);
                    if (prod) {
                        const newStock = (parseInt(prod.stock) || 0) - item.qty;
                        fetch(app.apiUrl, {
                            method: 'POST',
                            headers: { "Content-Type": "text/plain" },
                            body: JSON.stringify({ action: 'updateProduct', product: { id_producto: item.id, stock: newStock } })
                        }).catch(e => console.error("Stock update fail:", e));
                        prod.stock = newStock; // Local update
                    }
                }

                // Refresh data (async)
                app.loadData().then(() => {
                    if (window.location.hash === '#pos') app.ui.renderPOS();
                    if (window.location.hash === '#staff-pos') app.ui.renderStaffPOS();
                    app.pos.updateLastSaleDisplay();
                });

            } catch (e) {
                console.error("Order Error:", e);
                alert("Hubo un error al procesar tu pedido.");
            } finally {
                if (btn) {
                    btn.innerText = originalText;
                    btn.disabled = false;
                }
            }
        },

        renderCartSummary: () => {
            const container = document.getElementById('cart-list-summary');
            if (!container) return;

            if (app.state.cart.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:#999;">Carrito vacío</p>';
                return;
            }

            let total = 0;
            const itemsHtml = app.state.cart.map(item => {
                const subtotal = item.price * item.qty;
                total += subtotal;
                return `
                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding: 4px 0; border-bottom: 1px dashed #eee;">
                        <span>${item.qty}x ${item.name}</span>
                        <span style="font-weight:bold;">$${subtotal.toFixed(2)}</span>
                    </div>
                `;
            }).join('');

            container.innerHTML = `
                <div style="background:#f9f9f9; padding:10px; border-radius:8px; margin-bottom:15px; border: 1px solid #eee;">
                    ${itemsHtml}
                    <div style="display:flex; justify-content:space-between; margin-top:10px; font-weight:bold; color:var(--primary-color); font-size:1rem; border-top: 2px solid #eee; padding-top:5px;">
                        <span>TOTAL</span>
                        <span>$${total.toFixed(2)}</span>
                    </div>
                </div>
            `;
        },

        handlePayMethodChange: () => {
            const method = document.getElementById('pay-method').value;
            const confirmBlock = document.getElementById('confirm-block');
            const bankDisplay = document.getElementById('bank-info-display');
            const bankText = document.getElementById('bank-details-text');

            // Toggle N° Confirmación block
            if (confirmBlock) confirmBlock.classList.toggle('hidden', method !== 'Transferencia');

            // Toggle & Populate Bank Info
            if (bankDisplay && bankText) {
                if (method === 'Transferencia') {
                    const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);

                    // Support multiple casing formats for bank information
                    const bName = company.infobanco || company.Info_Banco || company.info_banco;
                    const bAcc = company.infocuenta || company.Info_Cuenta || company.info_cuenta || "Pendiente";
                    const bNom = company.infonom || company.InfoNom || company.info_nom || company.Info_Nom || "";

                    if (company && bName) {
                        bankText.innerHTML = `
                            <div style="font-weight:bold; margin-bottom:4px;">${bName}</div>
                            <div style="font-size:1.1rem; letter-spacing:1px; margin-bottom:4px;">${bAcc}</div>
                            ${bNom ? `<div style="font-size:0.8rem; opacity:0.8;">Titular: ${bNom}</div>` : ''}
                        `;
                        bankDisplay.classList.remove('hidden');
                    } else {
                        bankText.innerText = "Datos bancarios no configurados.";
                        bankDisplay.classList.remove('hidden');
                    }
                } else {
                    bankDisplay.classList.add('hidden');
                }
            }
        },

        openCheckout: () => {
            if (app.state.cart.length === 0) return alert("El carrito está vacío.");

            // Reset to Step 1
            app.pos.nextStep(1);

            document.getElementById('checkout-modal').classList.remove('hidden');

            // Render Express Ticket (Step 1)
            app.pos.renderExpressTicket();

            // Initial pay method check
            app.pos.handlePayMethodChange();
        },

        nextStep: (n) => {
            // Hide all steps
            document.querySelectorAll('.checkout-step').forEach(s => s.classList.add('hidden'));
            document.querySelectorAll('.step-dot').forEach(d => d.classList.remove('active'));

            // Show requested step
            const target = document.getElementById(`checkout-step-${n}`);
            if (target) target.classList.remove('hidden');

            // Handle Step 3 OTP display
            if (n === 3) {
                const otpBanner = document.getElementById('otp-success-banner');
                const otpVal = document.getElementById('otp-success-value');
                if (otpBanner && otpVal) {
                    if (app.state._currentOrderOtp) {
                        otpVal.innerText = app.state._currentOrderOtp;
                        otpBanner.classList.remove('hidden');
                    } else {
                        otpBanner.classList.add('hidden');
                    }
                }
            }

            // Update dots
            const dot = document.getElementById(`step-dot-${n}`);
            if (dot) dot.classList.add('active');
        },

        closeCheckout: () => {
            document.getElementById('checkout-modal').classList.add('hidden');
            // Uber Eats Style: Always clear if we finished or if explicitly closed after success
            const isStep3 = !document.getElementById('checkout-step-3').classList.contains('hidden');
            if (isStep3) {
                app.pos.clearCart();
                // Clear fields to avoid data persistence
                document.getElementById('cust-name').value = '';
                document.getElementById('cust-phone').value = '';
                document.getElementById('cust-address').value = '';
                document.getElementById('cust-notes').value = '';
                document.getElementById('pay-method').value = 'Efectivo';
                document.getElementById('pay-confirm').value = '';
                document.getElementById('bank-info-display').classList.add('hidden');
                document.getElementById('confirm-block').classList.add('hidden');

                // Return to home/inicio
                window.location.hash = '#home';
            }
        },

        renderExpressTicket: () => {
            const container = document.getElementById('express-ticket-items');
            const totalEl = document.getElementById('express-ticket-total');
            const dateEl = document.getElementById('express-ticket-date');
            const logoEl = document.getElementById('express-ticket-logo');

            if (!container) return;

            // Date
            if (dateEl) dateEl.innerText = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Logo
            const co = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            if (logoEl && co) {
                const logoUrl = co.logo_url || co.url_logo;
                if (logoUrl) {
                    logoEl.src = app.utils.fixDriveUrl(logoUrl);
                    logoEl.classList.remove('hidden');
                } else {
                    logoEl.classList.add('hidden');
                }
            }

            // Items
            let total = 0;
            container.innerHTML = app.state.cart.map(item => {
                const sub = item.price * item.qty;
                total += sub;
                return `
                    <div class="ticket-item-express">
                        <span class="ticket-item-name">${item.name} x${item.qty}</span>
                        <span class="ticket-item-price">$${sub.toFixed(2)}</span>
                    </div>
                `;
            }).join('');

            if (totalEl) totalEl.innerText = `$${total.toFixed(2)}`;
        },

        sendWhatsApp: () => {
            const name = document.getElementById('cust-name').value;
            const phone = document.getElementById('cust-phone').value;
            const address = document.getElementById('cust-address').value;
            const notes = document.getElementById('cust-notes')?.value || '';
            const method = document.getElementById('pay-method').value;
            const confirmNum = document.getElementById('pay-confirm')?.value || 'N/A';

            const cartTotal = parseFloat(document.getElementById('express-ticket-total').innerText.replace('$', '')) || 0;
            const itemsText = app.state.cart.map(c => `• *${c.name}* x${c.qty} _($${(c.price * c.qty).toFixed(2)})_`).join('\n');

            const co = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            const businessPhone = co?.telefonowhatsapp || "5218120731000";

            let waMsg =
                `🚀 *NUEVA ORDEN RECIBIDA*\n` +
                `----------------------------\n` +
                `👤 *Cliente:* ${name}\n` +
                `📞 *Tel:* ${phone}\n` +
                `📍 *Dir:* ${address}\n`;

            if (notes) {
                waMsg += `📝 *Notas:* ${notes}\n`;
            }

            waMsg += `💳 *Pago:* ${method}\n`;

            if (method === 'Transferencia') {
                waMsg += `🔢 *Confirmación:* ${confirmNum}\n`;
            }

            waMsg +=
                `----------------------------\n` +
                `📦 *PRODUCTOS:*\n${itemsText}\n` +
                `----------------------------\n` +
                `💰 *TOTAL A PAGAR: $${cartTotal.toFixed(2)}*\n\n` +
                `_Favor de confirmar mi pedido. Gracias._`;

            const encodedMsg = encodeURIComponent(waMsg);
            window.open(`https://wa.me/${businessPhone}?text=${encodedMsg}`, '_blank');

            // Surgical cleanup after opening WhatsApp
            app.pos.closeCheckout();
        },

        openStaffCheckout: () => {
            if (app.state.cart.length === 0) return alert("Elegir productos primero.");
            // Fill simulated customer info for quick staff sale
            document.getElementById('cust-name').value = "Venta en Mostrador";
            document.getElementById('cust-phone').value = "N/A";
            document.getElementById('pay-method').value = "Efectivo";

            // For staff, we just open step 2 directly or handled simplified
            app.pos.nextStep(2);
            document.getElementById('checkout-modal').classList.remove('hidden');
            app.pos.handlePayMethodChange();
        },


        updateOrderStatus: async (id, newStatus, skipOtp = false) => {
            console.log(`[POS_UPDATE] ${id} -> ${newStatus} (skipOtp: ${skipOtp})`);

            // Check for OTP if heading to ENTREGADO and not already verified
            if (newStatus === 'ENTREGADO' && !skipOtp) {
                const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
                const order = app.data.Proyectos.find(p => p.id_proyecto === id);
                const useOtp = company?.usa_otp_entrega === true || company?.usa_otp_entrega === "TRUE" || company?.usa_otp_entrega === "1";

                if (useOtp && order?.codigo_otp) {
                    console.log(`[OTP_REQUIRED] Order: ${id}, Expected: ${order.codigo_otp}`);
                    // Open Premium OTP Modal
                    app.ui.showOtpEntry(id, newStatus, String(order.codigo_otp).trim());
                    return;
                } else {
                    console.log(`[OTP_NOT_REQUIRED] UseOtp: ${useOtp}, OrderOtp: ${order?.codigo_otp}`);
                }
            }

            app.ui.updateConsole(`UPDATING_ORDER_${id.slice(-4)}...`);
            try {
                await fetch(app.apiUrl, {
                    method: 'POST',
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({
                        action: 'updateProjectStatus',
                        id: id,
                        status: newStatus
                    })
                });

                // Optimistic UI update or reload
                const order = app.data.Proyectos.find(p => p.id_proyecto === id);
                if (order) order.estado = newStatus;

                app.ui.renderPOS();
                app.ui.updateConsole("ORDER_UPDATED_OK");
            } catch (e) {
                console.error(e);
                app.ui.updateConsole("UPDATE_FAIL", true);
            }
        },

        clearCart: () => {
            app.state.cart = [];
            app.pos.updateCartVisuals();
        },

        updateLastSaleDisplay: () => {
            const el = document.getElementById('ticket-last-val');
            if (!el) return;

            // Find project IDs for current company
            const myProjectIds = app.data.Proyectos
                .filter(p => p.id_empresa === app.state.companyId)
                .map(p => p.id_proyecto);

            // Filter payments for those projects and sort by date desc
            const payments = (app.data.Proyectos_Pagos || [])
                .filter(pay => myProjectIds.includes(pay.id_proyecto))
                .sort((a, b) => new Date(b.fecha_pago || 0) - new Date(a.fecha_pago || 0));

            const lastOne = payments[0];
            if (lastOne) {
                el.innerText = `$${parseFloat(lastOne.monto).toFixed(2)}`;
            } else {
                el.innerText = "$0.00";
            }
        },

        showLastSale: () => {
            const myProjectIds = app.data.Proyectos
                .filter(p => p.id_empresa === app.state.companyId)
                .map(p => p.id_proyecto);

            const lastOne = (app.data.Proyectos_Pagos || [])
                .filter(pay => myProjectIds.includes(pay.id_proyecto))
                .sort((a, b) => new Date(b.fecha_pago || 0) - new Date(a.fecha_pago || 0))[0];

            if (lastOne) {
                alert(`DETALLE ÚLTIMA VENTA:\n----------------------\nID: ${lastOne.id_pago}\nConcepto: ${lastOne.concepto}\nMonto: $${lastOne.monto}\nMétodo: ${lastOne.metodo_pago}\nFecha: ${new Date(lastOne.fecha_pago).toLocaleString()}`);
            } else {
                alert("No hay ventas registradas aún.");
            }
        }
    },

    // -------------------------------------------------------------------------
    monitor: {
        start: () => {
            setInterval(() => {
                if (!app.state.currentUser) return;
                const now = Date.now();
                const diff = (now - app.state.lastActivity) / 1000;

                // Dynamic Timeout based on Credit Mode
                const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
                const modo = (company && company.modo_creditos) || "USUARIO";

                // If DIARIO or GLOBAL, we use a much longer timeout (e.g., 8 hours = 28800s)
                // If USUARIO, we keep the strict 120s to optimize credit consumption
                const timeoutLimit = (modo === "DIARIO" || modo === "GLOBAL") ? 28800 : 120;

                if (diff > timeoutLimit) {
                    app.ui.updateConsole(`TIMEOUT: ${timeoutLimit}s exceeded.`, true);
                    alert(`Sesión cerrada por inactividad (${timeoutLimit}s).`);
                    app.auth.logout();
                }
            }, 5000);
        }
    }
};

// Start App
window.addEventListener('DOMContentLoaded', app.init);
