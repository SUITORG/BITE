/**
 * EVASOL - ADMIN MODULE (v4.7.0)
 * Responsabilidad: CRM, Proyectos, Dashboard y Reportes.
 */
app.admin = {
    renderDashboard: () => {
        const user = app.state.currentUser;
        if (!user) return;
        const main = document.getElementById('view-dashboard');
        if (main) {
            app.ui.updateConsole("DASHBOARD_READY");
            // Render charts if active
            const reportMode = app.state._reportMode || 'fixed';
            if (reportMode === 'dashboard') {
                app.admin.renderBusinessDashboard();
            }
        }
    },

    // --- KPI CHARTS (v4.7.0 Ported) ---
    _renderDailySalesChart: (data) => {
        const ctx = document.getElementById('chart-sales-daily');
        if (!ctx) return;
        if (app.state.chartSales) app.state.chartSales.destroy();
        app.state.chartSales = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Ventas ($)',
                    data: data.values,
                    backgroundColor: 'rgba(52, 152, 219, 0.5)',
                    borderColor: '#3498db',
                    borderWidth: 2,
                    borderRadius: 5
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    },

    _renderPaymentMethodsChart: (data) => {
        const ctx = document.getElementById('chart-payment-methods');
        if (!ctx) return;
        if (app.state.chartPayments) app.state.chartPayments.destroy();
        app.state.chartPayments = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    },

    _renderMonthlyTrendChart: (data) => {
        const ctx = document.getElementById('chart-monthly-trend');
        if (!ctx) return;
        if (app.state.chartMonthly) app.state.chartMonthly.destroy();
        app.state.chartMonthly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Ingresos Mensuales',
                    data: data.values,
                    borderColor: '#9b59b6',
                    backgroundGradient: 'rgba(155, 89, 182, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    },

    // --- REPORTS ENGINE ---
    currentReportType: 'general',

    setReportMode: (mode) => {
        app.state._reportMode = mode;
        const viewFixed = document.getElementById('report-view-fixed');
        const viewDash = document.getElementById('report-view-dashboard');
        const btnFixed = document.getElementById('btn-mode-fixed');
        const btnDash = document.getElementById('btn-mode-dashboard');

        if (mode === 'fixed') {
            viewFixed?.classList.remove('hidden');
            viewDash?.classList.add('hidden');
            btnFixed?.classList.add('active');
            btnDash?.classList.remove('active');
            app.admin.renderReport();
        } else {
            viewFixed?.classList.add('hidden');
            viewDash?.classList.remove('hidden');
            btnFixed?.classList.remove('active');
            btnDash?.classList.add('active');
            app.admin.renderBusinessDashboard();
        }
    },

    selectReportType: (type, btn) => {
        app.admin.currentReportType = type;
        document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        else {
            const target = document.querySelector(`.report-tab-btn[data-report="${type}"]`);
            if (target) target.classList.add('active');
        }
        app.admin.renderReport();
    },

    handleReportTypeChange: () => {
        app.admin.renderReport();
    },

    renderReport: () => {
        const container = document.getElementById('report-content');
        if (!container) return;
        const typeSelect = document.getElementById('report-type');
        const dateInput = document.getElementById('report-date');
        if (!typeSelect || !dateInput) return;

        const type = typeSelect.value; // DIARIO / MENSUAL
        const dateVal = dateInput.value;
        const reportCategory = app.admin.currentReportType;

        container.innerHTML = `<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:10px;">Procesando datos...</p></div>`;

        // Filter data by Company
        const companyId = app.state.companyId;
        const projects = (app.data.Proyectos || []).filter(p => app.utils.getCoId(p) === companyId);
        const projectIds = projects.map(p => p.id_proyecto);
        let payments = (app.data.Pagos || app.data.Proyectos_Pagos || []).filter(p => projectIds.includes(p.id_proyecto));

        // Date filter
        const targetDate = dateVal ? new Date(dateVal + "T00:00:00") : new Date();
        if (type === 'DIARIO') {
            const dayStr = targetDate.toISOString().split('T')[0];
            payments = payments.filter(p => (p.fecha_pago || "").toString().startsWith(dayStr));
        } else {
            const month = targetDate.getMonth();
            const year = targetDate.getFullYear();
            payments = payments.filter(p => {
                const d = new Date(p.fecha_pago);
                return d.getMonth() === month && d.getFullYear() === year;
            });
        }

        if (payments.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:60px; color:#999;"><i class="fas fa-search fa-3x" style="opacity:0.3; margin-bottom:15px;"></i><p>No se encontraron registros para este periodo.</p></div>`;
            return;
        }

        if (reportCategory === 'general') {
            app.admin._renderGeneralReport(container, payments);
        } else if (reportCategory === 'payments') {
            app.admin._renderPaymentsReport(container, payments);
        } else if (reportCategory === 'profit') {
            app.admin._renderProfitReport(container, payments);
        } else if (reportCategory === 'products') {
            app.admin._renderProductsReport(container, payments);
        }
    },

    _renderGeneralReport: (container, payments) => {
        const total = payments.reduce((acc, p) => acc + (parseFloat(p.monto) || 0), 0);
        const count = payments.length;
        const avg = total / count;
        container.innerHTML = `
            <div class="report-summary-cards">
                <div class="summary-card">
                    <h4>Venta Total</h4>
                    <div class="value">$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="summary-card" style="border-left-color: #3498db;">
                    <h4>Tickets</h4>
                    <div class="value">${count}</div>
                </div>
                <div class="summary-card" style="border-left-color: #2ecc71;">
                    <h4>Promedio</h4>
                    <div class="value">$${avg.toFixed(2)}</div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Folio / ID</th>
                            <th>Fecha</th>
                            <th>Concepto</th>
                            <th>Método</th>
                            <th>Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${payments.slice(0, 100).map(p => `
                            <tr>
                                <td><b>${(p.id_pago || (p.id_proyecto || "").slice(-6))}</b></td>
                                <td>${new Date(p.fecha_pago).toLocaleDateString()}</td>
                                <td>${p.concepto || 'Venta POS'}</td>
                                <td><span class="method-badge method-tag-${(p.metodo_pago || 'efectivo').toLowerCase()}">${p.metodo_pago || 'Efectivo'}</span></td>
                                <td style="font-weight:bold;">$${(parseFloat(p.monto) || 0).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    _renderPaymentsReport: (container, payments) => {
        const map = {};
        payments.forEach(p => {
            const m = p.metodo_pago || 'Efectivo';
            map[m] = (map[m] || 0) + (parseFloat(p.monto) || 0);
        });
        container.innerHTML = `
            <div class="report-summary-cards">
                ${Object.keys(map).map(m => `
                    <div class="summary-card" style="border-left-color: ${m === 'Efectivo' ? '#27ae60' : (m === 'Transferencia' ? '#2980b9' : '#f39c12')}">
                        <h4>${m.toUpperCase()}</h4>
                        <div class="value">$${map[m].toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                `).join('')}
            </div>
            <p style="text-align:center; padding:20px; color:#666; font-style:italic;">Ideal para corte de caja y validación de transferencias bancarias.</p>
        `;
    },

    _renderProfitReport: (container, payments) => {
        container.innerHTML = `<div style="text-align:center; padding:40px;"><i class="fas fa-hammer fa-2x"></i><p>Reporte de Rentabilidad en construcción...</p></div>`;
    },

    _renderProductsReport: (container, payments) => {
        container.innerHTML = `<div style="text-align:center; padding:40px;"><i class="fas fa-boxes fa-2x"></i><p>Reporte de Volumen por Producto en construcción...</p></div>`;
    },

    exportReport: (format) => {
        const type = app.admin.currentReportType;
        app.ui.updateConsole(`EXPORTING_${type.toUpperCase()}_TO_${format}...`);
        alert(`Función de exportación a ${format} iniciada.`);
    },

    renderBusinessDashboard: () => {
        const companyId = app.state.companyId;
        const projectIds = (app.data.Proyectos || []).filter(p => app.utils.getCoId(p) === companyId).map(p => p.id_proyecto);
        const payments = (app.data.Pagos || app.data.Proyectos_Pagos || []).filter(p => projectIds.includes(p.id_proyecto));

        // Mock data for charts (Last 7 days)
        const labels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
        const values = [1200, 1900, 1500, 2100, 2800, 3500, 2400];

        app.admin._renderDailySalesChart({ labels, values });
        app.admin._renderPaymentMethodsChart({ labels: ['Efectivo', 'Tarjeta', 'Transf'], values: [60, 25, 15] });
        app.admin._renderMonthlyTrendChart({ labels: ['Ene', 'Feb', 'Mar', 'Abr'], values: [45000, 52000, 48000, 61000] });

        app.ui.updateConsole("BIZ_DASHBOARD_READY");
    },

    // --- CRM / LEADS ---
    openLeadModal: () => {
        const modal = document.getElementById('lead-modal-overlay');
        const form = document.getElementById('form-new-lead');
        form.reset();
        form.dataset.mode = "create";
        delete form.dataset.leadId;
        modal.classList.remove('hidden');
        document.getElementById('new-lead-name').focus();
    },

    editLead: (id) => {
        const lead = app.data.Leads.find(l => l.id_lead === id);
        if (!lead) return;
        const modal = document.getElementById('lead-modal-overlay');
        const form = document.getElementById('form-new-lead');
        form.dataset.mode = "edit";
        form.dataset.leadId = id;
        document.getElementById('new-lead-name').value = lead.nombre || "";
        document.getElementById('new-lead-phone').value = lead.telefono || "";
        document.getElementById('new-lead-email').value = lead.email || "";
        document.getElementById('new-lead-address').value = lead.direccion || "";
        document.getElementById('new-lead-source').value = lead.origen || "Local";
        modal.classList.remove('hidden');
    },

    saveLead: async (e) => {
        e.preventDefault();
        const form = e.target;
        const isEdit = form.dataset.mode === "edit";
        const leadData = {
            id_lead: form.dataset.leadId,
            id_empresa: app.state.companyId,
            nombre: document.getElementById('new-lead-name').value,
            telefono: document.getElementById('new-lead-phone').value,
            email: document.getElementById('new-lead-email').value,
            direccion: document.getElementById('new-lead-address').value,
            origen: document.getElementById('new-lead-source').value
        };

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = "PROCESANDO...";
        btn.disabled = true;

        try {
            const res = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                    action: isEdit ? 'updateLead' : 'createLead',
                    lead: leadData,
                    token: app.apiToken
                })
            });
            const result = await res.json();
            if (result.success) {
                await app.loadData();
                app.admin.renderLeads();
                document.getElementById('lead-modal-overlay').classList.add('hidden');
            }
        } catch (err) { console.error(err); }
        finally { btn.innerText = originalText; btn.disabled = false; }
    },

    renderLeads: () => {
        const tbody = document.getElementById('leads-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        const searchInput = document.getElementById('lead-search');
        const query = (searchInput?.value || '').toLowerCase().trim();

        const currentCoId = (app.state.companyId || "").toString().trim().toUpperCase();
        let list = (app.data.Leads || []).filter(l => {
            const matchCo = (l.id_empresa || "").toString().trim().toUpperCase() === currentCoId;
            const isActive = l.activo !== false && l.activo !== "FALSE" && l.activo !== "0" && l.estado !== "ELIMINADO";
            return matchCo && isActive;
        });

        if (query) {
            list = list.filter(l =>
                (l.nombre || "").toLowerCase().includes(query) ||
                (l.id_lead || "").toLowerCase().includes(query)
            );
        }

        list.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
        list.forEach(lead => {
            const tr = document.createElement('tr');
            const isAdmin = app.state.currentUser && (app.state.currentUser.nivel_acceso >= 10 || app.state.currentUser.rol === 'DIOS');
            const isStaff = app.state.currentUser && (app.state.currentUser.nivel_acceso >= 5 || app.state.currentUser.rol === 'DIOS');

            tr.innerHTML = `
                    <td>${lead.id_lead || 'N/A'} - <b>${lead.nombre}</b></td>
                    <td>${lead.direccion || '-'}</td>
                    <td>${lead.telefono}</td>
                    <td><span style="padding:4px 8px; border-radius:4px; background:#e0f2f1; color: #00695c; font-size:0.8rem">${lead.estado}</span></td>
                    <td>
                        <div class="actions-cell">
                            ${isAdmin ? `<button class="btn-small btn-danger" onclick="app.admin.deleteLead('${lead.id_lead}')" title="Borrar Lead"><i class="fas fa-trash"></i></button>` : ''}
                            ${isStaff ? `<button class="btn-small" onclick="app.admin.editLead('${lead.id_lead}')" title="Editar Lead"><i class="fas fa-edit"></i></button>` : ''}
                            <button class="btn-small btn-secondary" onclick="alert('Detalles de ${lead.nombre}')" title="Ver Detalles"><i class="fas fa-eye"></i></button>
                        </div>
                    </td>
                `;
            tbody.appendChild(tr);
        });
    },

    deleteLead: async (id) => {
        if (!confirm("¿Borrar lead?")) return;
        try {
            const res = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: 'deleteLead', id: id, token: app.apiToken })
            });
            const data = await res.json();
            if (data.success) {
                await app.loadData();
                app.admin.renderLeads();
            }
        } catch (e) { console.error(e); }
    },

    // --- PROJECTS ---
    openProjectModal: () => {
        document.getElementById('project-modal-overlay').classList.remove('hidden');
        const select = document.getElementById('proj-client');
        if (select) {
            select.innerHTML = '<option value="">-- Seleccionar --</option>';
            const filteredLeads = (app.data.Leads || []).filter(l => l.id_empresa === app.state.companyId);
            filteredLeads.forEach(l => {
                const opt = document.createElement('option');
                opt.value = l.id_lead;
                opt.innerText = l.nombre;
                select.appendChild(opt);
            });
        }
    },

    saveProject: async (e) => {
        e.preventDefault();
        const projectData = {
            id_empresa: app.state.companyId,
            nombre_proyecto: document.getElementById('project-name').value || document.getElementById('proj-name').value,
            id_cliente: document.getElementById('proj-client')?.value,
            descripcion: document.getElementById('project-desc')?.value || document.getElementById('proj-desc')?.value,
            estado: "NUEVO"
        };
        try {
            const res = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: 'createProject', project: projectData, token: app.apiToken })
            });
            const result = await res.json();
            if (result.success) {
                await app.loadData();
                app.admin.renderProjects();
                document.getElementById('project-modal-overlay').classList.add('hidden');
            }
        } catch (err) { console.error(err); }
    },

    renderProjects: () => {
        const tbody = document.getElementById('projects-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        const searchInput = document.getElementById('project-search');
        const query = (searchInput?.value || '').toLowerCase().trim();

        const currentCoId = (app.state.companyId || "").toString().trim().toUpperCase();
        let list = (app.data.Proyectos || []).filter(p => {
            const matchCo = (p.id_empresa || "").toString().trim().toUpperCase() === currentCoId;
            const isActive = p.activo !== false && p.activo !== "FALSE" && p.activo !== "0" && p.estado !== "ELIMINADO";
            return matchCo && isActive;
        });

        if (query) {
            list = list.filter(p => {
                const client = (app.data.Leads || []).find(l => l.id_lead === p.id_cliente);
                const clientName = (client ? client.nombre : (p.cliente_nombre || '')).toLowerCase();
                return (p.nombre_proyecto || "").toLowerCase().includes(query) ||
                    (p.id_proyecto || "").toLowerCase().includes(query) ||
                    clientName.includes(query);
            });
        }

        list.sort((a, b) => (a.nombre_proyecto || "").localeCompare(b.nombre_proyecto || ""));
        list.forEach(p => {
            const flow = (app.data.Config_Flujo_Proyecto || []).filter(f => f.id_empresa === app.state.companyId || f.id_empresa === 'GLOBAL');
            const phase = flow.find(f => f.id_fase === (p.status || p.estado)) || { nombre_fase: (p.status || p.estado), peso_porcentaje: 0, color_hex: "#999" };
            const color = phase.color_hex || "#999";
            const pct = parseInt(phase.peso_porcentaje) || 0;
            const client = app.data.Leads.find(l => l.id_lead === p.id_cliente);
            const clientName = client ? client.nombre : (p.cliente_nombre || 'N/A');

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
                            ${isAdmin ? `<button class="btn-small btn-danger" onclick="app.admin.deleteProject('${p.id_proyecto}')" title="Borrar Proyecto"><i class="fas fa-trash"></i></button>` : ''}
                            <button class="btn-small" onclick="app.admin.openProjectDetails('${p.id_proyecto}')" title="Ver/Gestionar"><i class="fas fa-tasks"></i></button>
                        </div>
                    </td>
                `;
            tbody.appendChild(tr);
        });
    },

    deleteProject: async (id) => {
        if (!confirm("¿Borrar proyecto?")) return;
        try {
            await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: 'deleteProject', id: id, token: app.apiToken })
            });
            await app.loadData();
            app.admin.renderProjects();
        } catch (e) { console.error(e); }
    },

    openProjectDetails: (pId) => {
        const p = app.data.Proyectos.find(x => x.id_proyecto === pId);
        if (!p) return;
        const client = app.data.Leads.find(l => l.id_lead === p.id_cliente);
        const clientName = client ? client.nombre : (p.cliente_nombre || 'N/A');

        const stages = (app.data.Proyectos_Etapas || []).filter(s => s.id_proyecto === pId);
        const logs = (app.data.Proyectos_Bitacora || []).filter(log => log.id_proyecto === pId);

        const content = document.getElementById('project-details-content');
        if (!content) return;

        content.innerHTML = `
                <div class="project-details-tabs" style="display:flex; gap:10px; border-bottom:1px solid #ddd; margin-bottom:15px; padding-bottom:10px;">
                    <button class="btn-small tab-btn active" onclick="app.admin.switchProjectTab('info', this)">Info</button>
                    <button class="btn-small tab-btn" onclick="app.admin.switchProjectTab('stages', this)">Etapas (${stages.length})</button>
                    <button class="btn-small tab-btn" onclick="app.admin.switchProjectTab('logs', this)">Bitácora (${logs.length})</button>
                </div>
                <div id="p-tab-info" class="p-tab-content">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div><strong>ID:</strong><br>${p.id_proyecto}</div>
                        <div><strong>Estatus Actual:</strong><br>
                            <select onchange="app.admin.updateProjectStatus('${p.id_proyecto}', this.value)" style="padding:4px; font-size:0.8rem; width:100%">
                                ${(app.data.Config_Flujo_Proyecto || []).filter(f => f.id_empresa === app.state.companyId || f.id_empresa === 'GLOBAL').map(f => `
                                    <option value="${f.id_fase}" ${p.estado === f.id_fase ? 'selected' : ''}>${f.nombre_fase}</option>
                                `).join('') || `<option value="${p.estado}">${p.estado}</option>`}
                            </select>
                        </div>
                        <div style="grid-column: span 2;"><strong>Nombre:</strong><br>${p.nombre_proyecto}</div>
                        <div style="grid-column: span 2;"><strong>Cliente:</strong><br>${clientName}</div>
                        <div style="grid-column: span 2; margin-top:10px;">
                             <button class="btn-small btn-success" onclick="app.admin.addProjectPayment('${pId}')"><i class="fas fa-dollar-sign"></i> Reg. Pago</button>
                        </div>
                    </div>
                </div>
                <div id="p-tab-stages" class="p-tab-content hidden">
                    <div style="text-align:right; margin-bottom:10px;">
                        <button class="btn-small" onclick="app.admin.addProjectStage('${pId}')"><i class="fas fa-plus"></i> Add Etapa</button>
                    </div>
                    <table class="data-table" style="font-size:0.8rem">
                        <thead><tr><th>Etapa</th><th>OK</th></tr></thead>
                        <tbody>
                            ${stages.map(s => `
                                <tr>
                                    <td>${s.nombre_etapa}</td>
                                    <td><input type="checkbox" ${s.completada ? 'checked' : ''} onchange="app.admin.toggleStage('${pId}', '${s.nombre_etapa}', this.checked)"></td>
                                </tr>`).join('') || '<tr><td colspan="2">No hay etapas</td></tr>'}
                        </tbody>
                    </table>
                </div>
                <div id="p-tab-logs" class="p-tab-content hidden">
                    <div style="text-align:right; margin-bottom:10px;">
                        <button class="btn-small" onclick="app.admin.addProjectManualLog('${pId}')"><i class="fas fa-comment"></i> Add Nota</button>
                    </div>
                    <div style="max-height: 250px; overflow-y: auto;">
                        ${logs.map(l => `<div style="padding:5px; border-bottom:1px solid #eee; font-size:0.8rem;"><b>${new Date(l.fecha_hora).toLocaleTimeString()}:</b> [${l.tipo}] ${l.detalle}</div>`).join('') || 'Sin registros'}
                    </div>
                </div>
        `;
        document.getElementById('project-details-modal').classList.remove('hidden');
    },

    switchProjectTab: (tabId, clickedButton) => {
        document.querySelectorAll('.p-tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById('p-tab-' + tabId)?.classList.remove('hidden');
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        clickedButton?.classList.add('active');
    },

    updateProjectStatus: async (pId, newStatus) => {
        try {
            await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: 'updateProjectStatus', id: pId, status: newStatus, token: app.apiToken })
            });
            await app.loadData();
            app.admin.renderProjects();
        } catch (e) { console.error(e); }
    },

    // --- CATALOG MANAGEMENT ---
    renderCatalog: () => {
        const grid = document.getElementById('catalog-grid');
        if (!grid) return;

        const query = (document.getElementById('catalog-search')?.value || '').toLowerCase().trim();

        const user = app.state.currentUser;
        const level = parseInt(user?.nivel_acceso || 0);
        const role = (user?.id_rol || "").toUpperCase();
        const modules = (app.state.visibleModules || []).map(m => m.toLowerCase());

        const canAdd = role === 'DIOS' || level >= 10 || modules.includes('catalog_add');
        const canEdit = role === 'DIOS' || level >= 10 || modules.includes('catalog_edit');
        const canDelete = role === 'DIOS' || level >= 10 || modules.includes('catalog_delete');
        const canStock = role === 'DIOS' || level >= 5 || modules.includes('catalog_stock') || modules.includes('pos');

        const btnAdd = document.getElementById('btn-show-product-modal');
        if (btnAdd) canAdd ? btnAdd.classList.remove('hidden') : btnAdd.classList.add('hidden');

        let list = (app.data.Catalogo || []).filter(p => {
            const matchCo = p.id_empresa === app.state.companyId;
            const isActive = p.activo !== false && p.activo !== "FALSE" && p.activo !== "0";
            return matchCo && isActive;
        });

        if (query) {
            list = list.filter(p => (p.nombre || "").toLowerCase().includes(query) || (p.id_producto || "").toLowerCase().includes(query));
        }

        list.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

        // OPTIMIZACIÓN v4.7.5: Renderizado por fragmentos para evitar reflujo excesivo del DOM
        const fragment = document.createDocumentFragment();

        list.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'product-card';
            const img = prod.imagen_url ? app.utils.fixDriveUrl(prod.imagen_url) : 'https://docs.google.com/uc?export=view&id=1t6BmvpGTCR6-OZ3Nnx-yOmpohe5eCKvv';
            const price = app.utils.getEffectivePrice(prod);

            card.innerHTML = `
                <div class="product-img">
                    <img src="${img}" loading="lazy">
                    ${prod.precio_oferta ? `<span class="ribbon oferta">OFERTA</span>` : ''}
                </div>
                <div class="product-info">
                    <div class="product-title"><b>[${prod.id_producto}]</b> ${prod.nombre}</div>
                    <div class="product-stock">Stock: <b>${prod.stock || 0}</b> ${prod.unidad || 'pza'}</div>
                    <div class="product-price">$${price.toFixed(2)}</div>
                    <div class="actions-cell" style="display:flex; gap:5px; margin-top:10px;">
                        ${canStock ? `<button class="btn-small" onclick="app.admin.editProductStock('${prod.id_producto}')"><i class="fas fa-cubes"></i></button>` : ''}
                        ${canEdit ? `<button class="btn-small btn-warning" onclick="app.admin.openProductModal('${prod.id_producto}')"><i class="fas fa-edit"></i></button>` : ''}
                        ${canDelete ? `<button class="btn-small btn-danger" onclick="app.admin.deleteProduct('${prod.id_producto}', '${prod.nombre}')"><i class="fas fa-trash-alt"></i></button>` : ''}
                    </div>
                </div>`;
            fragment.appendChild(card);
        });

        grid.innerHTML = ''; // Limpieza única
        grid.appendChild(fragment); // Inyección en un solo paso (Atomic UI Update)
    },

    editProductStock: (id) => {
        const p = app.data.Catalogo.find(x => x.id_producto === id);
        if (!p) return;
        const newStock = prompt(`Actualizar Stock para ${p.nombre}:`, p.stock);
        if (newStock !== null) app.admin.saveProductStock(id, newStock);
    },

    saveProductStock: async (id, stock) => {
        try {
            await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: 'updateStock', id, stock, token: app.apiToken })
            });
            await app.loadData();
            app.admin.renderCatalog();
        } catch (e) { console.error(e); }
    },

    deleteProduct: async (id, name) => {
        if (!confirm(`¿Borrar ${name}?`)) return;
        try {
            await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: 'deleteProduct', id, token: app.apiToken })
            });
            await app.loadData();
            app.admin.renderCatalog();
        } catch (e) { console.error(e); }
    },

    openProductModal: (id = null) => {
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('form-product');
        form.reset();
        form.dataset.mode = id ? 'edit' : 'create';
        form.dataset.prodId = id || '';

        if (id) {
            const p = app.data.Catalogo.find(x => x.id_producto === id);
            if (p) {
                document.getElementById('p-name').value = p.nombre || '';
                document.getElementById('p-price').value = p.precio || '';
                document.getElementById('p-stock').value = p.stock || '';
                document.getElementById('p-image-url').value = p.imagen_url || '';
            }
        }
        modal.classList.remove('hidden');
    },

    saveProduct: async (e) => {
        e.preventDefault();
        const form = e.target;
        const id = form.dataset.prodId;
        const prodData = {
            id_producto: id,
            id_empresa: app.state.companyId,
            nombre: document.getElementById('p-name').value,
            precio: parseFloat(document.getElementById('p-price').value),
            stock: parseInt(document.getElementById('p-stock').value),
            imagen_url: document.getElementById('p-image-url').value
        };
        try {
            await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: id ? 'saveProduct' : 'createProduct', product: prodData, token: app.apiToken })
            });
            await app.loadData();
            app.admin.renderCatalog();
            document.getElementById('product-modal').classList.add('hidden');
        } catch (err) { console.error(err); }
    },

    // --- KNOWLEDGE ---
    renderKnowledge: () => {
        const grid = document.getElementById('knowledge-list');
        if (!grid) return;
        grid.innerHTML = '';
        const docs = app.data.Empresa_Documentos.filter(d => d.id_empresa === app.state.companyId);
        docs.forEach(doc => {
            const card = document.createElement('div');
            card.className = 'feature-card';
            card.innerHTML = `
                <h4>${doc.nombre_archivo}</h4>
                <button class="btn-small" onclick="window.open('https://drive.google.com/open?id=${doc.id_drive_file}', '_blank')">Abrir</button>
            `;
            grid.appendChild(card);
        });
    },

    syncKnowledge: async () => {
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const folderId = company?.drive_folder_id;
        if (!folderId) return alert("No hay carpeta configurada.");
        try {
            const res = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: 'syncDriveFiles', id_empresa: app.state.companyId, folderId: folderId })
            });
            const data = await res.json();
            if (data.success) {
                await app.loadData();
                app.admin.renderKnowledge();
            }
        } catch (e) { console.error(e); }
    },

    renderQuotas: () => {
        const tbody = document.getElementById('quotas-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        const user = app.state.currentUser;
        if (!user || parseInt(user.nivel_acceso) < 10) {
            tbody.innerHTML = '<tr><td colspan="5">Acceso restringido</td></tr>';
            return;
        }
        const quotas = (app.data.Cuotas_Pagos || []).filter(q => q.id_empresa === app.state.companyId);
        quotas.forEach(q => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${q.concepto || 'Cuota Mensual'}</td>
                <td>$${q.monto}</td>
                <td>${new Date(q.fecha_vencimiento).toLocaleDateString()}</td>
                <td>${q.estado}</td>
                <td style="text-align:right;"><button class="btn-small">Pagar</button></td>
            `;
            tbody.appendChild(tr);
        });
    },

    // --- PROJECT STAGES & LOGS (v4.7.0 Ported) ---
    addProjectStage: async (pId) => {
        const name = prompt("Nombre de la nueva etapa:");
        if (!name) return;
        try {
            await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: 'addProjectStage', id: pId, stage: name, token: app.apiToken })
            });
            await app.loadData();
            app.admin.openProjectDetails(pId);
        } catch (e) { console.error(e); }
    },

    toggleStage: async (pId, stageName, completed) => {
        try {
            await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: 'toggleProjectStage', id: pId, stage: stageName, completed, token: app.apiToken })
            });
            await app.loadData();
            app.admin.internalAddLog(pId, 'ETAPA', `Etapa ${stageName} marcada como ${completed ? 'COMPLETADA' : 'PENDIENTE'}`);
        } catch (e) { console.error(e); }
    },

    addProjectPayment: async (pId) => {
        const monto = prompt("Monto del pago:");
        const concepto = prompt("Concepto:");
        if (!monto) return;
        try {
            await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: 'addProjectPayment', id: pId, monto, concepto, token: app.apiToken })
            });
            await app.loadData();
            app.admin.internalAddLog(pId, 'PAGO', `Pago registrado: $${monto} - ${concepto}`);
            app.admin.openProjectDetails(pId);
        } catch (e) { console.error(e); }
    },

    addProjectManualLog: async (pId) => {
        const txt = prompt("Entrada de bitácora:");
        if (!txt) return;
        await app.admin.internalAddLog(pId, 'MANUAL', txt);
        app.admin.openProjectDetails(pId);
    },

    internalAddLog: async (pId, type, text) => {
        try {
            await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: 'addProjectLog', id: pId, type, detail: text, token: app.apiToken })
            });
        } catch (e) { console.error(e); }
    },
};
