
/**
 * EVASOL - Core Application Logic
 * Supports: Multi-tenant config, Credits, God Mode, dynamic UI.
 */

const app = {
    // CONFIGURATION
    apiUrl: "https://script.google.com/macros/s/AKfycbxq9r3xHx01d-_XmqTJbwn_C3mcBj0iGwYByEOChWPrG2g8dw5OWrJ_M_QV-DgSLuwULg/exec",

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
        _consoleStarted: false
    },

    // AI Agents Module
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
                const docs = app.data.Empresa_Documentos.map(d => d.nombre_archivo).join(", ") || "Ninguno";

                if (agentName === 'Escritor') {
                    response = `[BORRADOR GENERADO]\n\nBasado en la estructura de EVASOL y los ${app.data.Empresa_Documentos.length} documentos sincronizados, estoy listo para redactar.\n\nDocumentos de referencia: ${docs}`;
                } else if (agentName === 'Analista') {
                    response = `[ANÁLISIS DE DATOS REAL]\n\n📊 Resumen de Operaciones:\n- Leads: ${leads}\n- Proyectos: ${projs}\n- Base de Conocimiento: ${app.data.Empresa_Documentos.length} archivos.\n\nSugerencia: Revisa los documentos [${docs}] para encontrar detalles específicos sobre las empresas del grupo.`;
                } else if (agentName === 'Marketing') {
                    response = `[ESTRATEGIA]\n\nUsando el nombre "${app.state.companyId}", podemos lanzar una campaña resaltando nuestros ${projs} proyectos exitosos.`;
                } else if (agentName === 'Negocio') {
                    response = `[INTELIGENCIA DE NEGOCIO]\n\nDetecto ${app.data.Empresa_Documentos.length} documentos de conocimiento. Si sincronizas el 'Acta Constitutiva', podré detallar la estructura legal del Grupo EVASOL.`;
                }

                output.value = response;
            }, 1000);
        }
    },

    deleteItem: async (type, id) => {
        if (!confirm("¿Estás seguro de BORRAR este registro? No se puede deshacer.")) return;

        // Optimistic Delete
        const originalData = [...app.data[type]];
        app.data[type] = app.data[type].filter(item => {
            if (type === 'Leads') return item.id_lead !== id;
            if (type === 'Proyectos') return item.id_proyecto !== id;
            if (type === 'Catalogo') return item.id_producto !== id;
            return true;
        });

        // Re-render
        if (type === 'Leads') app.ui.renderLeads();
        if (type === 'Proyectos') app.ui.renderProjects();
        if (type === 'Catalogo') app.ui.renderCatalog();

        try {
            await fetch(app.apiUrl, {
                method: 'POST',
                redirect: "follow",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: 'deleteItem', type: type, id: id })
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
        console.log("System initializing...");

        // Bind Events early so buttons work while loading
        app.ui.bindEvents();
        app.router.init();
        app.monitor.start();

        // Show Loading overlay if it exists in DOM
        if (!document.getElementById('loading-overlay')) {
            document.body.insertAdjacentHTML('beforeend', '<div id="loading-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.9);z-index:99999;display:flex;justify-content:center;align-items:center;flex-direction:column"><i class="fas fa-spinner fa-spin fa-3x"></i><p style="margin-top:20px">Conectando con Google Sheets...</p></div>');
        }

        const loaded = await app.loadData();

        // Version Check
        app.checkBackendVersion();

        const loader = document.getElementById('loading-overlay');
        if (loader) loader.remove();

        if (!loaded) {
            console.warn("Error loading data from Sheets.");
        }

        console.log("Data loaded:", app.data);

        // Apply Company Config
        if (app.data && app.data.Config_Empresas) {
            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            if (company) {
                app.ui.applyTheme(company);
                app.ui.renderPillars(company);
                app.ui.updateWhatsAppLinks(company);
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
                if (data.version === "2.7.0" || data.version === "2.6.5" || data.version === "2.6.0" || data.version === "2.5.2") {
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
            const response = await fetch(app.apiUrl + "?action=getAll");
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

            const user = app.data.Usuarios.find(u =>
                (u.email === userOrEmail || u.username === userOrEmail || u.nombre === userOrEmail)
            );

            if (!user) return { success: false, msg: "Usuario no encontrado" };

            const sheetPass = (user.password || "").toString().trim();
            const inputPass = (password || "").toString().trim();

            if (sheetPass !== inputPass) {
                return { success: false, msg: "Contraseña incorrecta" };
            }

            // 3. Resolve permissions based on Policy Origin (ROL vs USUARIO)
            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            const origenPoliticas = (company && company.origen_politicas) || "USUARIO";
            const modoCreditos = (company && company.modo_creditos) || "USUARIO";

            let effectiveLevel = parseInt(user.nivel_acceso) || 0;
            let effectiveModules = "";
            let effectiveCredits = parseInt(user.creditos) || 0;
            let limitDateStr = user.fecha_limite_acceso;

            if (origenPoliticas === "ROL" && app.data.Config_Roles) {
                const roleData = app.data.Config_Roles.find(r => r.id_rol === user.id_rol);
                if (roleData) {
                    effectiveLevel = parseInt(roleData.nivel_acceso) || 0;
                    effectiveModules = roleData.modulos_visibles || "";
                    // If not Global, use Role's base credits
                    if (modoCreditos !== "GLOBAL") effectiveCredits = parseInt(roleData.creditos_base) || 0;

                    // Calculate expiration if days provided
                    if (roleData.vigencia_dias) {
                        const date = new Date(user.fecha_creacion || Date.now());
                        date.setDate(date.getDate() + parseInt(roleData.vigencia_dias));
                        limitDateStr = date.toISOString();
                    }
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
                } else {
                    if (effectiveCredits <= 0) return { success: false, msg: "Sin créditos suficientes" };
                    effectiveCredits--;
                    user.creditos = effectiveCredits; // Update local
                    currentCredits = effectiveCredits;
                    app.auth.persistCreditDeduction('USUARIO', user.id_usuario);
                }

                if (currentCredits <= 5) {
                    alert("⚠️ ADVERTENCIA: Te quedan solo " + currentCredits + " créditos. Por favor, comunícate con el equipo de soporte técnico para una recarga.");
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
        applyTheme: (company) => {
            document.title = `${company.nomempresa} - Gestión`;
            document.getElementById('header-title').innerText = company.nomempresa;

            if (company.color_tema) {
                document.documentElement.style.setProperty('--primary-color', company.color_tema);
            }
        },

        updateWhatsAppLinks: (company) => {
            const btn = document.getElementById('whatsapp-float');
            if (btn && company.telefonowhatsapp) {
                btn.href = `https://wa.me/${company.telefonowhatsapp}`;
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

        updateConsole: (msg, isError = false) => {
            const el = document.getElementById('sb-console');
            const txt = document.getElementById('console-text');
            if (!el || !txt) return;

            if (isError) {
                el.classList.add('error');
                txt.innerText = `> ERR: ${msg.toUpperCase()}`;
                // Auto-clear error after 10s if it's just a notification
                setTimeout(() => el.classList.remove('error'), 10000);
            } else {
                if (!el.classList.contains('error')) {
                    txt.innerText = `> ${msg.toUpperCase()}`;
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
                document.getElementById('sb-time').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                document.getElementById('sb-date').innerText = now.toLocaleDateString();
            };
            updateTime();
            setInterval(updateTime, 1000);

            if (!app.state._consoleStarted) {
                app.ui.runConsoleSim();
                app.state._consoleStarted = true;
            }

            document.getElementById('sb-company').innerHTML = `<i class="fas fa-building"></i> ${app.state.companyId}`;

            const userSpan = document.getElementById('sb-user');
            if (userSpan && app.state.currentUser) {
                userSpan.innerHTML = `<i class="fas fa-user-shield"></i> ${app.state.currentUser.nombre}`;
            }

            const coinEl = document.getElementById('sb-credits');
            if (coinEl) {
                const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
                const modo = (company && company.modo_creditos) === "GLOBAL" ? "Pool" : "Personal";
                const val = (company && company.modo_creditos) === "GLOBAL" ? (company.creditos_totales || 0) : (app.state.currentUser ? app.state.currentUser.creditos : 0);

                coinEl.innerHTML = `
                    <div class="credits-pill" title="Modo: ${modo}">
                        <i class="fas fa-coins" style="color: #ffd700;"></i> 
                        <span>${val}</span>
                    </div>
                `;
            }
        },

        setLoggedInState: (user) => {
            document.getElementById('status-bar').classList.remove('hidden');
            document.getElementById('sb-user').innerText = user.nombre;
            document.getElementById('menu-public').classList.add('hidden');
            document.getElementById('menu-staff').classList.remove('hidden');
            document.getElementById('login-modal-overlay').classList.add('hidden');

            // Dynamic Menu Filtering
            const modules = (user.modulos_visibles || "").toLowerCase();
            const menuItems = document.querySelectorAll('#menu-staff li');
            menuItems.forEach(li => {
                const link = li.querySelector('a');
                if (!link || link.id === 'btn-logout') return;
                const target = link.hash.replace('#', '').toLowerCase();
                if (user.rol === 'DIOS' || modules.includes(target) || modules === "") {
                    li.classList.remove('hidden');
                } else {
                    li.classList.add('hidden');
                }
            });

            // Dashboard Values
            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            const isGlobal = (company && company.modo_creditos) === "GLOBAL";

            // Dashboard Card Visibility
            const dashView = document.getElementById('view-dashboard');
            if (dashView) {
                const dashModules = dashView.querySelectorAll('.feature-card');
                dashModules.forEach(card => {
                    const title = card.querySelector('h3') ? card.querySelector('h3').innerText.toLowerCase() : "";
                    if (user.rol === 'DIOS' || modules === "" || modules.includes(title) || title.includes("resumen")) {
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
            const hasAIAccess = user.rol === 'DIOS' || (user.nivel_acceso && user.nivel_acceso >= 5);
            const godTools = document.getElementById('god-tools');
            if (godTools) {
                if (hasAIAccess) {
                    godTools.classList.remove('hidden');
                    godTools.querySelector('h3').innerText = user.rol === 'DIOS' ? 'GOD MODE' : 'HERRAMIENTAS IA';
                } else {
                    godTools.classList.add('hidden');
                }
            }

            // GATED ACTION BUTTONS (Level 5+ for basic capture, 10+ for management)
            const level = parseInt(user.nivel_acceso) || 0;
            const isAdmin = user.rol === 'DIOS' || level >= 10;
            const isStaff = user.rol === 'DIOS' || level >= 5;

            const btnLead = document.getElementById('btn-show-lead-modal');
            if (btnLead) isStaff ? btnLead.classList.remove('hidden') : btnLead.classList.add('hidden');

            const btnProject = document.getElementById('btn-show-project-modal');
            if (btnProject) isStaff ? btnProject.classList.remove('hidden') : btnProject.classList.add('hidden');

            const btnProduct = document.getElementById('btn-show-product-modal');
            if (btnProduct) isAdmin ? btnProduct.classList.remove('hidden') : btnProduct.classList.add('hidden');

            const btnSync = document.getElementById('btn-sync-drive');
            if (btnSync) isAdmin ? btnSync.classList.remove('hidden') : btnSync.classList.add('hidden');
        },

        setLoggedOutState: () => {
            // document.getElementById('status-bar').classList.add('hidden'); // Keep visible for Version info
            document.getElementById('sb-user').innerHTML = '<i class="fas fa-user-secret"></i> Visitante';
            document.getElementById('menu-public').classList.remove('hidden');
            document.getElementById('menu-staff').classList.add('hidden');
            document.getElementById('god-tools').classList.add('hidden');
        },

        renderLeads: () => {
            const tbody = document.getElementById('leads-table-body');
            tbody.innerHTML = '';
            const isAdmin = app.state.currentUser && (app.state.currentUser.rol === 'DIOS' || (app.state.currentUser.nivel_acceso >= 10));

            app.data.Leads.forEach(lead => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><b>[${lead.id_lead || 'N/A'}]</b> ${lead.nombre}</td>
                    <td>${lead.direccion || '-'}</td>
                    <td>${lead.telefono}</td>
                    <td><span style="padding:4px 8px; border-radius:4px; background:#e0f2f1; color: #00695c; font-size:0.8rem">${lead.estado}</span></td>
                    <td>
                        <div class="actions-cell">
                            ${isAdmin ? `<button class="btn-small btn-danger" onclick="app.deleteItem('Leads', '${lead.id_lead}')">Borrar</button>` : ''}
                            <button class="btn-small" onclick="alert('Detalles de ${lead.nombre}')">Ver</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        },


        renderProjects: () => {
            const list = app.data.Proyectos;
            // Ensure table exists (lazy load check)
            let table = document.getElementById('projects-table-body');
            if (!table) return;
            table.innerHTML = '';

            const isAdmin = app.state.currentUser && (app.state.currentUser.rol === 'DIOS' || (app.state.currentUser.nivel_acceso >= 10));

            list.forEach(p => {
                // Dynamic Status Discovery
                const flow = app.data.Config_Flujo_Proyecto || [];
                const phase = flow.find(f => f.id_fase === p.estado) || { nombre_fase: p.estado, peso_porcentaje: 0, color_hex: "#999" };
                const color = phase.color_hex || "#999";
                const pct = parseInt(phase.peso_porcentaje) || 0;

                // Resolve client name
                const client = app.data.Leads.find(l => l.id_lead === p.id_cliente);
                const clientName = client ? client.nombre : (p.cliente_nombre || 'N/A');

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <b>[${p.id_proyecto || 'Pending'}]</b> ${p.nombre_proyecto}
                        <div class="progress-container"><div class="progress-bar" style="width:${pct}%; background:${color}"></div></div>
                        <span class="text-small">${pct}% - ${phase.nombre_fase}</span>
                    </td>
                    <td>${clientName}</td>
                    <td><span style="padding:4px 8px; border-radius:4px; background:${color}; color: white; font-size:0.7rem; font-weight:bold;">${phase.nombre_fase.toUpperCase()}</span></td>
                    <td>
                        <div class="actions-cell">
                            ${isAdmin ? `<button class="btn-small btn-danger" onclick="app.deleteItem('Proyectos', '${p.id_proyecto}')">Borrar</button>` : ''}
                            <button class="btn-small" onclick="app.ui.openProjectDetails('${p.id_proyecto}')">Ver</button>
                        </div>
                    </td>
                `;
                table.appendChild(tr);
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
                                ${(app.data.Config_Flujo_Proyecto || []).map(f => `
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
                    <div style="margin-bottom:10px; padding:10px; background:#f9f9f9; border-radius:4px; display:flex; gap:5px; align-items:flex-end;">
                        <div class="form-group" style="margin-bottom:0">
                            <label style="font-size:0.7rem">Nueva etapa</label>
                            <input type="text" id="new-stage-name" placeholder="Ej: Levantamiento" style="width:140px; font-size:0.8rem">
                        </div>
                        <div class="form-group" style="margin-bottom:0">
                            <label style="font-size:0.7rem">Fecha Limite</label>
                            <input type="date" id="new-stage-date" style="width:120px; font-size:0.8rem">
                        </div>
                        <button class="btn-small" onclick="app.ui.addProjectStage('${pId}')" style="height:32px;">+</button>
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
                    <div style="margin-bottom:10px; display:flex; gap:5px;">
                        <input type="text" id="new-log-txt" placeholder="Añadir nota manual..." style="flex:1; font-size:0.8rem">
                        <button class="btn-small" onclick="app.ui.addProjectManualLog('${pId}')">Enviar</button>
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
                // We don't have a specific 'updateProject' but we can reuse createProject or add a small handler
                // For now, let's just log it or add a simple generic update if possible.
                // Reusing createProject with same ID usually overwrites in robust systems, but let's be careful.
                // Assuming backend can handle it or we add 'updateProject' later.
            } catch (e) { console.error(e); }
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
            app.data.Catalogo.forEach(prod => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    <div class="product-img">
                        <i class="fas fa-solar-panel"></i>
                    </div>
                    <div class="product-info">
                        <div class="product-title"><span>[${prod.id_producto || 'New'}]</span> ${prod.nombre}</div>
                        <div class="product-stock">Stock: ${prod.stock} ${prod.unidad}</div>
                        <div class="product-price">$${prod.precio.toLocaleString()}</div>
                    </div>
                `;
                grid.appendChild(card);
            });
        },

        openLeadModal: () => {
            document.getElementById('lead-modal-overlay').classList.remove('hidden');
            document.getElementById('new-lead-name').focus();
            document.getElementById('lead-msg').classList.add('hidden');
            document.getElementById('form-new-lead').reset();
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

            // Populate clients
            const select = document.getElementById('proj-client');
            if (select) {
                select.innerHTML = '<option value="">-- Seleccionar --</option>';
                app.data.Leads.forEach(l => {
                    const opt = document.createElement('option');
                    opt.value = l.id_lead; // Use ID as value
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
                // Filter Agents by Access Level
                const availableAgents = app.data.Prompts_IA.filter(a => (parseInt(a.nivel_acceso) || 0) <= user.nivel_acceso && (a.habilitado === true || a.habilitado === "TRUE"));

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

                const btn = form.querySelector('button');
                const originalText = btn.innerText;
                btn.innerText = "Enviando...";
                btn.disabled = true;

                const toTitleCase = (str) => str.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());

                const name = toTitleCase(document.getElementById('new-lead-name').value);
                const phone = document.getElementById('new-lead-phone').value;
                const email = document.getElementById('new-lead-email').value;
                const source = toTitleCase(document.getElementById('new-lead-source').value);

                const newLead = {
                    id_lead: "lead-" + Date.now(),
                    id_empresa: app.state.companyId,
                    nombre: name,
                    telefono: phone,
                    email: email,
                    origen: source,
                    estado: "NUEVO",
                    fecha_creacion: new Date().toISOString()
                };

                try {
                    // API Call
                    // Use text/plain to avoid CORS Preflight (OPTIONS) which GAS doesn't handle well
                    const response = await fetch(app.apiUrl, {
                        method: 'POST',
                        redirect: "follow",
                        headers: { "Content-Type": "text/plain;charset=utf-8" },
                        body: JSON.stringify({ action: 'createLead', lead: newLead })
                    });

                    const result = await response.json();

                    if (!result.success && !result.status) {
                        throw new Error("Backend devolvió error: " + JSON.stringify(result));
                    }

                    // UPDATE ID WITH SERVER RESPONSE (e.g. LEAD-1)
                    if (result.newId) {
                        newLead.id_lead = result.newId;
                    }

                    // Optimistic Update
                    app.data.Leads.unshift(newLead);
                    app.ui.renderLeads();

                    const msg = document.getElementById('lead-msg');
                    msg.innerText = "¡Guardado en Google Sheets!";
                    msg.classList.remove('hidden');

                    setTimeout(() => {
                        document.getElementById('lead-modal-overlay').classList.add('hidden');
                        msg.classList.add('hidden');
                        btn.innerText = originalText;
                        btn.disabled = false;
                        // Clear form
                        e.target.reset();
                    }, 1500);

                } catch (err) {
                    console.error("Fetch Error:", err);
                    alert("❌ ERROR AL GUARDAR EN NUBE:\n" + err.message + "\n\nVerifica que la URL del script sea correcta y el despliegue permita 'Cualquier usuario'.");
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
                const cat = toTitleCase(document.getElementById('prod-cat').value);
                const price = parseFloat(document.getElementById('prod-price').value);
                const stock = parseInt(document.getElementById('prod-stock').value);

                const newProd = {
                    id_producto: "prod-" + Date.now(),
                    id_empresa: app.state.companyId,
                    nombre: name,
                    categoria: cat,
                    precio: price,
                    stock: stock,
                    unidad: "pza",
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
                        message: text
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
                msgDiv.innerHTML = text.replace(/\n/g, '<br>'); // Simple break formatting
            } else {
                msgDiv.style.background = 'var(--primary-color)';
                msgDiv.style.color = 'white';
                msgDiv.style.alignSelf = 'flex-end';
                msgDiv.innerText = text;
            }

            historyDiv.appendChild(msgDiv);
            historyDiv.scrollTop = historyDiv.scrollHeight;
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
            const hash = window.location.hash || '#home';

            // Protected Routes Check
            const protectedRoutes = ['#dashboard', '#leads', '#projects', '#catalog', '#agents', '#knowledge'];
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
            if (hash === '#knowledge') {
                document.getElementById('view-knowledge').classList.remove('hidden');
                app.ui.renderKnowledge();
            }

            // Scroll to top
            window.scrollTo(0, 0);
        }
    },

    // -------------------------------------------------------------------------
    // MONITOR (TIMEOUT)
    // -------------------------------------------------------------------------
    monitor: {
        start: () => {
            setInterval(() => {
                if (!app.state.currentUser) return; // Only monitor if logged in
                const now = Date.now();
                const diff = (now - app.state.lastActivity) / 1000;

                // 120 seconds timeout
                if (diff > 120) {
                    alert("Sesión cerrada por inactividad (120s).");
                    app.auth.logout();
                }
            }, 5000); // Check every 5s
        }
    }
};

// Start App
window.addEventListener('DOMContentLoaded', app.init);
