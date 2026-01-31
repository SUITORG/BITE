/**
 * MANTENIMIENTO: MODULO DE EVENTOS (v1.0.0)
 * Este archivo centraliza todas las escuchas de eventos (DOM Binding)
 * para limpiar el archivo ui.js y facilitar el mantenimiento.
 */

app.events = {
    init: () => {
        console.log("🚀 Módulo de Eventos Inicializado");
        app.events.bindGlobal();
        app.events.bindLogin();
        app.events.bindForms();
        app.events.bindUX();
        app.events.bindNav();
    },


    bindGlobal: () => {
        // Sonido Global de Clic (v4.6.8)
        document.addEventListener('click', (e) => {
            const isButton = e.target.closest('button') ||
                e.target.closest('.btn-primary') ||
                e.target.closest('.btn-secondary') ||
                e.target.closest('.pay-btn') ||
                e.target.closest('.enterprise-bubble') ||
                e.target.closest('.nav-list a');
            if (isButton) app.utils.playClick();
        }, true);
    },

    bindLogin: () => {
        // Gatillo de Login (vía Delegación de Eventos)
        document.addEventListener('click', (e) => {
            const loginBtn = e.target.closest('.nav-login-btn') || e.target.closest('#btn-login-trigger');
            if (loginBtn) {
                e.preventDefault();
                app.ui.showLogin();
            }
        });

        // Navegación con Enter en Login

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

        // Cierre de Login
        const closeLogin = document.getElementById('btn-close-login');
        if (closeLogin) {
            closeLogin.onclick = () => {
                document.getElementById('login-modal-overlay').classList.add('hidden');
            };
        }

        // Ejecución de Login
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
    },

    bindForms: () => {
        // Formulario de Conocimiento (Manual)
        const kForm = document.getElementById('form-knowledge-manual');
        if (kForm) kForm.onsubmit = app.ui.saveKnowledgeManual;

        // Formulario de Productos (Catálogo)
        const pForm = document.getElementById('form-product');
        if (pForm) pForm.onsubmit = app.ui.saveProduct;

        // Formulario de Nuevos Leads (Staff)
        const formNewLead = document.getElementById('form-new-lead');
        if (formNewLead) {
            formNewLead.onsubmit = async (e) => {
                e.preventDefault();
                app.events._handleNewLead(e);
            };
        }

        // Cerrar Lead Modal
        const closeLead = document.getElementById('btn-close-lead');
        if (closeLead) {
            closeLead.onclick = () => {
                document.getElementById('lead-modal-overlay').classList.add('hidden');
            };
        }

        // Formulario de Nuevo Producto (Modal Simple)
        const formNewProd = document.getElementById('form-new-product');
        if (formNewProd) {
            formNewProd.onsubmit = async (e) => {
                e.preventDefault();
                app.events._handleNewProduct(e);
            };
        }
        const closeProd = document.getElementById('btn-close-product');
        if (closeProd) {
            closeProd.onclick = () => {
                document.getElementById('product-modal-overlay').classList.add('hidden');
            };
        }

        // Formulario de Nuevo Proyecto
        const formNewProj = document.getElementById('form-new-project');
        if (formNewProj) {
            formNewProj.onsubmit = async (e) => {
                e.preventDefault();
                app.events._handleNewProject(e);
            };
        }
        const closeProj = document.getElementById('btn-close-project');
        if (closeProj) {
            closeProj.onclick = () => {
                document.getElementById('project-modal-overlay').classList.add('hidden');
            };
        }

        // Formulario de Lead Público (Cliente)
        const publicLeadForm = document.getElementById('public-lead-form');
        if (publicLeadForm) {
            publicLeadForm.onsubmit = async (e) => {
                e.preventDefault();
                app.events._handlePublicLead(e);
            };
        }
    },

    bindUX: () => {
        // Auditoría de Actividad
        document.body.onclick = () => app.state.lastActivity = Date.now();
        document.body.onmousemove = () => app.state.lastActivity = Date.now();
        document.body.onkeypress = () => app.state.lastActivity = Date.now();

        // Enter en Chat de IA
        const chatInput = document.getElementById('chat-user-input');
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    app.agents.sendMessage();
                }
            });
        }
    },

    // --- HANDLERS INTERNOS (Lógica de Envío) ---

    _handleNewLead: async (e) => {
        const form = e.target;
        if (form.dataset.submitting === "true") return;
        form.dataset.submitting = "true";
        const mode = form.dataset.mode || "create";
        const leadId = form.dataset.leadId;
        const btn = form.querySelector('button');
        const originalText = btn.innerText;

        btn.innerText = "Enviando...";
        btn.disabled = true;

        const toTitleCase = (str) => str.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
        const leadData = {
            id_lead: leadId || ("lead-" + Date.now()),
            id_empresa: app.state.companyId,
            nombre: toTitleCase(document.getElementById('new-lead-name').value),
            telefono: document.getElementById('new-lead-phone').value,
            email: document.getElementById('new-lead-email').value,
            direccion: document.getElementById('new-lead-address').value,
            origen: toTitleCase(document.getElementById('new-lead-source').value),
            estado: "NUEVO",
            activo: true,
            fecha_creacion: new Date().toISOString()
        };

        try {
            const action = (mode === "edit") ? "updateLead" : "createLead";
            const response = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action, lead: leadData, token: app.apiToken })
            });
            const result = await response.json();

            if (mode === "create") {
                if (result.newId) leadData.id_lead = result.newId;
                app.data.Leads.unshift(leadData);
            } else {
                const idx = app.data.Leads.findIndex(l => l.id_lead === leadId);
                if (idx !== -1) app.data.Leads[idx] = { ...app.data.Leads[idx], ...leadData };
            }

            app.ui.renderLeads();
            const msg = document.getElementById('lead-msg');
            msg.innerText = (mode === "edit") ? "¡Cambios guardados!" : "¡Guardado!";
            msg.classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('lead-modal-overlay').classList.add('hidden');
                msg.classList.add('hidden');
                btn.innerText = originalText;
                btn.disabled = false;
                form.reset();
            }, 1000);
        } catch (err) {
            alert("Error: " + err.message);
            btn.innerText = originalText;
            btn.disabled = false;
        } finally {
            form.dataset.submitting = "false";
        }
    },

    _handleNewProduct: async (e) => {
        const form = e.target;
        if (form.dataset.submitting === "true") return;
        form.dataset.submitting = "true";
        const btn = form.querySelector('button');
        btn.disabled = true;

        const toTitleCase = (str) => str.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
        const newProd = {
            id_producto: "PROD-" + Date.now().toString().slice(-6),
            id_empresa: app.state.companyId,
            nombre: toTitleCase(document.getElementById('prod-name').value),
            descripcion: document.getElementById('prod-desc').value,
            categoria: toTitleCase(document.getElementById('prod-cat').value),
            precio: parseFloat(document.getElementById('prod-price').value) || 0,
            precio_oferta: parseFloat(document.getElementById('prod-offer').value) || 0,
            stock: parseInt(document.getElementById('prod-stock').value) || 0,
            unidad: document.getElementById('prod-unit').value || "pza",
            imagen_url: document.getElementById('prod-img').value,
            activo: true
        };

        app.data.Catalogo.push(newProd);
        app.ui.renderCatalog();

        try {
            const response = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: 'createProduct', product: newProd, token: app.apiToken })
            });
            const res = await response.json();
            if (res.newId) {
                const idx = app.data.Catalogo.indexOf(newProd);
                if (idx !== -1) app.data.Catalogo[idx].id_producto = res.newId;
                app.ui.renderCatalog();
            }
        } catch (err) { console.error(err); } finally {
            form.dataset.submitting = "false";
            document.getElementById('prod-msg').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('product-modal-overlay').classList.add('hidden');
                document.getElementById('prod-msg').classList.add('hidden');
                btn.disabled = false;
            }, 1000);
        }
    },

    _handleNewProject: async (e) => {
        const form = e.target;
        if (form.dataset.submitting === "true") return;
        form.dataset.submitting = "true";
        const btn = form.querySelector('button');
        btn.disabled = true;

        const toTitleCase = (str) => str.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
        const clientSelect = document.getElementById('proj-client');
        const newProj = {
            id_proyecto: "proj-" + Date.now(),
            id_empresa: app.state.companyId,
            id_cliente: clientSelect.value,
            cliente_nombre: clientSelect.options[clientSelect.selectedIndex].text,
            nombre_proyecto: toTitleCase(document.getElementById('proj-name').value),
            estado: document.getElementById('proj-status').value,
            fecha_inicio: document.getElementById('proj-start').value,
            fecha_fin: document.getElementById('proj-end').value
        };

        app.data.Proyectos.unshift(newProj);
        app.ui.renderProjects();

        try {
            const response = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: 'createProject', project: newProj, token: app.apiToken })
            });
            const res = await response.json();
            if (res.newId) {
                const idx = app.data.Proyectos.indexOf(newProj);
                if (idx !== -1) app.data.Proyectos[idx].id_proyecto = res.newId;
                app.ui.renderProjects();
            }
        } catch (err) { console.error(err); } finally {
            form.dataset.submitting = "false";
            document.getElementById('proj-msg').classList.remove('hidden');
            setTimeout(() => {
                document.getElementById('project-modal-overlay').classList.add('hidden');
                document.getElementById('proj-msg').classList.add('hidden');
                btn.disabled = false;
            }, 1000);
        }
    },

    _handlePublicLead: async (e) => {
        const form = e.target;
        if (form.dataset.submitting === "true") return;
        form.dataset.submitting = "true";
        const btn = form.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = "Enviando...";
        btn.disabled = true;

        const toTitleCase = (str) => str.toLowerCase().replace(/(?:^|\s)\S/g, a => a.toUpperCase());
        const newLead = {
            id_lead: "lead-" + Date.now(),
            id_empresa: app.state.companyId,
            nombre: toTitleCase(document.getElementById('lead-name').value),
            telefono: document.getElementById('lead-phone').value,
            email: document.getElementById('lead-email').value,
            direccion: document.getElementById('lead-address').value,
            origen: "Web",
            estado: "NUEVO",
            fecha_creacion: new Date().toISOString()
        };

        try {
            const response = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: 'createLead', lead: newLead, token: app.apiToken })
            });
            const result = await response.json();
            if (result.success || result.status === "online") {
                if (result.newId) newLead.id_lead = result.newId;
                if (!app.data.Leads) app.data.Leads = [];
                app.data.Leads.unshift(newLead);
                app.ui.renderLeads();
                alert("¡Gracias! Pronto nos contactaremos.");
                form.reset();
            }
        } catch (err) { alert("Error al enviar."); } finally {
            btn.innerText = originalText;
            btn.disabled = false;
            form.dataset.submitting = "false";
        }
    },

    bindNav: () => {
        const toggle = document.getElementById('menu-toggle');
        const overlay = document.getElementById('mobile-menu-overlay');
        const navLists = document.querySelectorAll('.nav-list');

        const toggleMenu = (forceClose = false) => {
            navLists.forEach(list => {
                if (forceClose) list.classList.remove('active');
                else list.classList.toggle('active');
            });
            if (overlay) {
                if (forceClose) overlay.classList.add('hidden');
                else overlay.classList.toggle('hidden');
            }
        };

        if (toggle) {
            toggle.onclick = () => toggleMenu();
        }

        if (overlay) {
            overlay.onclick = () => toggleMenu(true);
        }

        // Close on link click
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-list a')) {
                toggleMenu(true);
            }
        });
    }
};

