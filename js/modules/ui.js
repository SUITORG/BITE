app.ui = {
    showLogin: () => {
        document.getElementById('login-modal-overlay').classList.remove('hidden');
        const userIn = document.getElementById('login-user');
        if (userIn) userIn.focus();
    },
    // --- DATA REFRESH ---
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
        // --- Dynamic SEO & Branding (Multi-tenant v4.6.9) ---
        const bizType = (company?.tipo_negocio || "").toString().toLowerCase();
        const bizId = (company?.id_empresa || "").toString().toUpperCase();
        const foodKeywords = ['alimentos', 'comida', 'restaurante', 'snack', 'food', 'taco', 'hamburguesa', 'bite'];
        const isFood = foodKeywords.some(k => bizType.includes(k) || bizId.includes(k));

        const platformName = isFood ? "Suit.Bite" : "Suit.Org";
        document.title = `${company.nomempresa} | ${platformName}`;

        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            const platformSlogan = isFood ? "Pedidos online y gestión gastronómica" : "Ecosistema digital y gestión empresarial";
            metaDesc.setAttribute('content', `${company.nomempresa} - ${company.descripcion || company.eslogan}. Potenciado por ${platformName} | ${platformSlogan}.`);
        }

        const metaKey = document.querySelector('meta[name="keywords"]');
        if (metaKey) {
            metaKey.setAttribute('content', `${company.nomempresa}, ${company.id_empresa}, ${isFood ? 'pedidos comida' : 'punto de venta'}, ${platformName}, saas méxico`);
        }

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
        try {
            app.public.renderHome(company);
            app.public.renderGallery();
            app.public.renderSEO();
            app.public.renderPillars(company);
            app.public.renderFooter(company);
        } catch (e) {
            console.error("[THEME_CRASH]", e);
            app.ui.updateConsole("ERR_RENDER_THEME", true);
        }
    },
    renderHome: (c) => app.public.renderHome(c),
    renderSEO: () => app.public.renderSEO(),
    renderFoodMenu: () => app.public.renderFoodMenu(),
    renderOrbit: () => app.public.renderOrbit(),
    renderFooter: (c) => app.public.renderFooter(c),
    renderPillars: (c) => app.public.renderPillars(c),
    renderGallery: () => app.public.renderGallery(),
    showAboutUs: () => app.public.showAboutUs(),
    showPolicies: () => app.public.showPolicies(),
    showReviews: () => app.public.showReviews(),
    showLocation: () => app.public.showLocation(),
    toggleMobileTicket: (s) => app.public.toggleMobileTicket(s),
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
    setPosPaymentMethod: (method) => {
        const input = document.getElementById('pos-pay-method');
        if (!input) return;
        input.value = method;
        // Update button visual state
        document.querySelectorAll('.pos-sidebar .pay-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-value') === method);
        });
        // Trigger folio/bank info logic
        app.ui.togglePosFolio();
    },
    setPublicPaymentMethod: (method) => {
        const input = document.getElementById('pay-method');
        if (!input) return;
        input.value = method;
        // Update button visual state in public checkout
        document.querySelectorAll('#checkout-step-2 .pay-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-value') === method);
        });
        // Trigger existing handlePayMethodChange logic
        app.pos.handlePayMethodChange();
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
    setReportMode: (mode) => {
        const fixedView = document.getElementById('report-view-fixed');
        const dashView = document.getElementById('report-view-dashboard');
        const btnFixed = document.getElementById('btn-mode-fixed');
        const btnDash = document.getElementById('btn-mode-dashboard');
        if (mode === 'dashboard') {
            fixedView.classList.add('hidden');
            dashView.classList.remove('hidden');
            btnDash.classList.add('active');
            btnFixed.classList.remove('active');
            app.ui.renderDashboard();
        } else {
            fixedView.classList.remove('hidden');
            dashView.classList.add('hidden');
            btnFixed.classList.add('active');
            btnDash.classList.remove('active');
            app.ui.renderReport();
        }
    },
    renderDashboard: () => {
        console.log("[DASH_ENGINE] Rendering Executive Analytics...");
        const companyId = app.state.companyId;
        // 1. Filter Data (Aislamiento de Empresa)
        const myProjectIds = app.data.Proyectos
            .filter(p => p.id_empresa === companyId)
            .map(p => p.id_proyecto);
        const allPayments = (app.data.Proyectos_Pagos || []).filter(p => myProjectIds.includes(p.id_proyecto));
        // 2. Process KPIs
        const totalVentas = allPayments.reduce((acc, p) => acc + parseFloat(p.monto || 0), 0);
        const numTickets = allPayments.length;
        const avgTicket = numTickets > 0 ? (totalVentas / numTickets) : 0;
        // Update KPI DOM
        if (document.getElementById('dash-total-ventas')) document.getElementById('dash-total-ventas').innerText = `$${totalVentas.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        if (document.getElementById('dash-num-tickets')) document.getElementById('dash-num-tickets').innerText = numTickets;
        if (document.getElementById('dash-avg-ticket')) document.getElementById('dash-avg-ticket').innerText = `$${avgTicket.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        // 3. Process Chart Data
        app.ui._renderDailySalesChart(allPayments);
        app.ui._renderPaymentMethodsChart(allPayments);
        app.ui._renderMonthlyTrendChart(allPayments);
    },
    _renderDailySalesChart: (payments) => {
        const ctx = document.getElementById('chart-sales-daily');
        if (!ctx) return;
        // Get last 7 days including today
        const days = [];
        const counts = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const iso = d.toISOString().split('T')[0];
            days.push(d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }));
            const dailySum = payments
                .filter(p => (p.fecha_pago || "").toString().startsWith(iso))
                .reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0);
            counts.push(dailySum);
        }
        if (window.myDailyChart) window.myDailyChart.destroy();
        window.myDailyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: 'Ventas ($)',
                    data: counts,
                    backgroundColor: 'rgba(0, 77, 64, 0.7)',
                    borderRadius: 8,
                    hoverBackgroundColor: '#004d40'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { display: false } } }
            }
        });
    },
    _renderPaymentMethodsChart: (payments) => {
        const ctx = document.getElementById('chart-payment-methods');
        if (!ctx) return;
        const methods = {};
        payments.forEach(p => {
            const m = p.metodo_pago || 'Otro';
            methods[m] = (methods[m] || 0) + parseFloat(p.monto || 0);
        });
        if (window.myPaymentChart) window.myPaymentChart.destroy();
        window.myPaymentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(methods),
                datasets: [{
                    data: Object.values(methods),
                    backgroundColor: ['#004d40', '#00bfa5', '#80cbc4', '#e0f2f1'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, usePointStyle: true } }
                },
                cutout: '70%'
            }
        });
    },
    _renderMonthlyTrendChart: (payments) => {
        const ctx = document.getElementById('chart-monthly-trend');
        if (!ctx) return;
        // Get last 6 months
        const labels = [];
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthName = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
            labels.push(monthName);
            const m = d.getMonth();
            const y = d.getFullYear();
            const monthlySum = payments.filter(p => {
                const pd = new Date(p.fecha_pago);
                return pd.getMonth() === m && pd.getFullYear() === y;
            }).reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0);
            data.push(monthlySum);
        }
        if (window.myTrendChart) window.myTrendChart.destroy();
        window.myTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ingresos',
                    data: data,
                    borderColor: '#004d40',
                    backgroundColor: 'rgba(0, 77, 64, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    },
    printTicket: (orderData = null, cartItems = null) => {
        const iframe = document.getElementById('print-iframe');
        if (!iframe) return;
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const items = cartItems || app.state.cart;
        const subtotal = items.reduce((acc, i) => acc + (parseFloat(i.price) * i.qty), 0);
        const fee = orderData?.costo_envio || (app.state.deliveryMethod === 'DOMICILIO' ? (parseFloat(company?.costo_envio) || 0) : 0);
        const total = subtotal + fee;
        const html = `
                <html>
                <head>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #000; padding: 10px; width: 75mm; }
                        h2 { text-align: center; margin: 5px 0; font-size: 18px; }
                        p { margin: 2px 0; }
                        .center { text-align: center; }
                        .divider { border-top: 1px dashed #000; margin: 8px 0; }
                        .row { display: flex; justify-content: space-between; margin: 3px 0; }
                        .total-row { font-weight: bold; font-size: 16px; margin-top: 5px; }
                        .footer { font-size: 11px; text-align: center; margin-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="center">
                        <h2>${company?.nomempresa || 'POS TICKET'}</h2>
                        <p>${company?.direccion || ''}</p>
                        <p>${company?.telefono || ''}</p>
                    </div>
                    <div class="divider"></div>
                    <p><b>FECHA:</b> ${new Date().toLocaleString()}</p>
                    <p><b>CLIENTE:</b> ${orderData?.name || 'Mostrador'}</p>
                    <div class="divider"></div>
                    ${items.map(i => `
                        <div class="row">
                            <span>${i.qty}x ${i.name.slice(0, 20)}</span>
                            <span>$${(parseFloat(i.price) * i.qty).toFixed(2)}</span>
                        </div>
                    `).join('')}
                    <div class="divider"></div>
                    <div class="row"><span>SUBTOTAL</span><span>$${subtotal.toFixed(2)}</span></div>
                    ${fee > 0 ? `<div class="row"><span>ENVÍO</span><span>$${fee.toFixed(2)}</span></div>` : ''}
                    <div class="row total-row"><span>TOTAL</span><span>$${total.toFixed(2)}</span></div>
                    <div class="divider"></div>
                    <div class="footer">
                        <p>¡GRACIAS POR SU PREFERENCIA!</p>
                        <p>SuitOrg Cloud v${app.version}</p>
                    </div>
                </body>
                </html>
            `;
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
        // Give it a moment to render then print
        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }, 600);
    },
    renderReport: () => {
        const type = document.getElementById('report-type').value;
        const pDate = document.getElementById('report-date').value;
        const container = document.getElementById('report-content');
        if (!container) return;
        const subtype = app.state.activeReportSubtype || 'general';
        // 1. Data Source (Filtered by Company)
        const myProjects = app.data.Proyectos.filter(p => p.id_empresa === app.state.companyId);
        const myProjectIds = myProjects.map(p => p.id_proyecto);
        let results = (app.data.Proyectos_Pagos || []).filter(p => myProjectIds.includes(p.id_proyecto));
        // 2. Date Filtering
        if (pDate) {
            results = results.filter(p => (p.fecha_pago || "").startsWith(pDate));
        }
        // 3. Sub-Module Logic
        if (subtype === 'general') {
            // Summary logic already in standard render
        } else if (subtype === 'profit') {
            // Sort by amount descending
            results.sort((a, b) => parseFloat(b.monto || 0) - parseFloat(a.monto || 0));
        }
        // 4. Empty State
        if (results.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:50px; color:#999;"><i class="fas fa-search fa-3x" style="opacity:0.2; margin-bottom:15px;"></i><p>Sin transacciones en esta fecha.</p></div>`;
            return;
        }
        const total = results.reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0);
        const count = results.length;
        const avg = count > 0 ? (total / count) : 0;
        // 5. Build Content
        let contentHtml = `
            <div class="report-summary-cards">
                <div class="summary-card">
                    <h4>Venta Total</h4>
                    <div class="value">$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
                <div class="summary-card" style="border-left-color:#3498db">
                    <h4>Transacciones</h4>
                    <div class="value">${count}</div>
                </div>
                <div class="summary-card" style="border-left-color:#f1c40f">
                    <h4>Ticket Promedio</h4>
                    <div class="value">$${avg.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
            </div>
        `;
        if (subtype === 'general' || subtype === 'profit' || subtype === 'payments') {
            contentHtml += `
                <div class="table-responsive" style="margin-top:20px;">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Concepto</th>
                                <th>Método</th>
                                <th>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${results.sort((a, b) => new Date(b.fecha_pago) - new Date(a.fecha_pago)).map(r => `
                                <tr>
                                    <td>${new Date(r.fecha_pago).toLocaleDateString()} <br> <small style="opacity:0.6">${new Date(r.fecha_pago).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></td>
                                    <td><b>${r.concepto}</b><br><small>ID: ${r.id_pago}</small></td>
                                    <td><span class="method-badge">${r.metodo_pago}</span></td>
                                    <td style="font-weight:700">$${parseFloat(r.monto).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        container.innerHTML = contentHtml;
    },
    exportReport: (format) => {
        const type = document.getElementById('report-type').value;
        const date = document.getElementById('report-date').value || "Reporte";
        if (format === 'VTS') {
            const rows = [["Fecha", "Concepto", "Metodo", "Monto"]];
            // Use same logic as renderReport to get current results
            const myProjectIds = app.data.Proyectos.filter(p => p.id_empresa === app.state.companyId).map(p => p.id_proyecto);
            let results = (app.data.Proyectos_Pagos || []).filter(p => myProjectIds.includes(p.id_proyecto));
            if (document.getElementById('report-date').value) {
                results = results.filter(p => p.fecha_pago.startsWith(document.getElementById('report-date').value));
            }
            results.forEach(r => rows.push([new Date(r.fecha_pago).toLocaleString(), r.concepto, r.metodo_pago, r.monto]));
            const content = rows.map(r => r.join("\t")).join("\n");
            const blob = new Blob([content], { type: 'text/tab-separated-values' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_${app.state.companyId}_${date}.vts`;
            a.click();
        } else {
            window.print();
        }
    },
    setReportMode: (mode) => {
        document.querySelectorAll('.report-mode-selector .btn-tab').forEach(b => b.classList.remove('active'));
        const btn = mode === 'fixed' ? document.getElementById('btn-mode-fixed') : document.getElementById('btn-mode-dashboard');
        if (btn) btn.classList.add('active');
        document.getElementById('report-view-fixed').classList.toggle('hidden', mode !== 'fixed');
        document.getElementById('report-view-dashboard').classList.toggle('hidden', mode !== 'dashboard');
        if (mode === 'dashboard') app.ui.renderBusinessDashboard();
        else app.ui.renderReport();
    },
    handleReportTypeChange: () => {
        const type = document.getElementById('report-type').value;
        const dateIn = document.getElementById('report-date');
        const today = new Date().toLocaleDateString('en-CA');
        if (type === 'DIARIO') {
            dateIn.type = 'date';
            dateIn.value = today;
        } else {
            dateIn.type = 'month';
            dateIn.value = today.substring(0, 7);
        }
        app.ui.renderReport();
    },
    selectReportType: (subtype, btn) => {
        app.state.activeReportSubtype = subtype;
        document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        app.ui.renderReport();
    },
    renderBusinessDashboard: () => {
        const sCo = app.state.companyId;
        const projects = (app.data.Proyectos || []).filter(p => p.id_empresa === sCo);
        const pIds = projects.map(p => p.id_proyecto);
        const payments = (app.data.Proyectos_Pagos || []).filter(p => pIds.includes(p.id_proyecto));
        // 1. Daily Sales Chart (Last 7 Days)
        const canvasSales = document.getElementById('chart-sales-daily');
        if (canvasSales) {
            const days = [];
            const values = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dStr = d.toLocaleDateString('en-CA');
                days.push(d.toLocaleDateString([], { weekday: 'short', day: 'numeric' }));
                const daySum = payments.filter(p => p.fecha_pago.startsWith(dStr))
                    .reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0);
                values.push(daySum);
            }
            if (app.state._chartSales) app.state._chartSales.destroy();
            app.state._chartSales = new Chart(canvasSales, {
                type: 'bar',
                data: {
                    labels: days,
                    datasets: [{
                        label: 'Ventas ($)',
                        data: values,
                        backgroundColor: 'rgba(46, 125, 50, 0.6)',
                        borderColor: '#2e7d32',
                        borderWidth: 1,
                        borderRadius: 5
                    }]
                },
                options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }
        // 2. Payment Mix Chart
        const canvasPay = document.getElementById('chart-payment-methods');
        if (canvasPay) {
            const methods = ['Efectivo', 'Terminal', 'Transferencia'];
            const labels = ['Efectivo', 'Tarjeta/Terminal', 'Transferencia'];
            const colors = ['#2ecc71', '#3498db', '#9b59b6'];
            const mData = methods.map(m => {
                return payments.filter(p => (p.metodo_pago || "").toLowerCase().includes(m.toLowerCase()))
                    .reduce((acc, curr) => acc + parseFloat(curr.monto || 0), 0);
            });
            if (app.state._chartPay) app.state._chartPay.destroy();
            app.state._chartPay = new Chart(canvasPay, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{ data: mData, backgroundColor: colors }]
                },
                options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
            });
        }
    },

    // filterPOS logic:
    filterPOS: (status) => {
        app.state.posFilter = status;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.innerText.toUpperCase() === status.replace('-', ' ').toUpperCase() || (status === 'TODOS' && btn.innerText === 'Todos'));
        });
        app.ui.renderPOS();
    },
    renderPOS: () => {
        try {
            const grid = document.getElementById('pos-orders-grid');
            if (!grid) return;
            grid.innerHTML = '';
            // VERIFICACIÓN DE INTEGRIDAD DE DATOS
            if (!app.data.Proyectos || !app.data.Config_Empresas) {
                console.warn("[POS] Data not fully loaded yet or failed.", app.data);
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#f39c12;"><i class="fas fa-sync fa-spin"></i> Sincronizando datos...</div>';
                return;
            }
            const sCo = (app.state.companyId || "").toString().trim().toUpperCase();
            const company = app.data.Config_Empresas.find(c => (c.id_empresa || "").toString().trim().toUpperCase() === sCo);
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const posTitle = document.querySelector('#view-pos h2');
            if (posTitle) {
                posTitle.innerHTML = `<i class="fas fa-desktop"></i> Monitor: ${company?.nomempresa || sCo} <small style="opacity:0.6; font-size:0.8rem; margin-left:10px;">(${today.toLocaleDateString()})</small>`;
            }
            const projects = app.data.Proyectos || [];

            // --- RBAC OPERATIVO ESTRICTO (v4.4.5) ---
            const user = app.state.currentUser;
            const userLevel = parseInt(user?.nivel_acceso) || 0;
            const userRole = (user?.id_rol || user?.rol || "").toString().trim().toUpperCase();

            const isAdmin = userLevel >= 10 || userRole === 'DIOS' || userRole.includes('ADMIN');

            // KEYWORDS AMPLIADAS PARA DETECCIÓN DE REPARTIDOR
            const deliveryKeywords = ['DELIVERY', 'REPARTIDOR', 'CHOFER', 'DRIVER', 'MOTO', 'RIDER'];
            const isDelivery = deliveryKeywords.some(k => userRole.includes(k));

            const isOperator = userLevel >= 5 && !isDelivery;

            // DEBUG VISUAL EN BARRA NEGRA (Temporal)
            const consoleUser = document.getElementById('sb-user');
            if (consoleUser && !consoleUser.innerHTML.includes('(')) consoleUser.innerHTML += ` <span style="font-size:0.7em; color:orange;">(${userRole})</span>`;

            // CONTROL DE FILTROS EN MONITOR
            const filterGroup = document.querySelector('.pos-status-filters');
            if (filterGroup) {
                // v4.5.9 FIX: Repartidores PUEDEN ver todas las pestañas para anticipar trabajo.
                // Eliminado bloqueo de visualización y filtro forzado.
                filterGroup.querySelectorAll('button').forEach(btn => {
                    btn.classList.remove('hidden');
                });
            }

            // Auxiliar para normalización de estado
            const getStatus = (p) => {
                return (p.estatus || p.status || p.estado || "").toString().trim().toUpperCase().replace(/_/g, '-');
            };

            // Filtrar órdenes del día para esta empresa
            const dailyOrders = projects.filter(p => {
                const pCo = (p.id_empresa || p.empresa || p.company || "SuitOrg").toString().trim().toUpperCase();
                const pDate = new Date(p.fecha_inicio);
                const pDateStr = !isNaN(pDate.getTime()) ? `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}-${String(pDate.getDate()).padStart(2, '0')}` : "";
                return pCo === sCo && pDateStr === todayStr;
            });
            const countNew = dailyOrders.filter(p => {
                const s = getStatus(p);
                return s === 'PEDIDO-RECIBIDO' || s === 'RECIBIDO' || s === 'NUEVO';
            }).length;

            const countCook = dailyOrders.filter(p => {
                const s = getStatus(p);
                return s === 'EN-COCINA' || s === 'COCINANDO';
            }).length;

            const countReady = dailyOrders.filter(p => {
                const s = getStatus(p);
                return s === 'LISTO-ENTREGA' || s === 'LISTO' || s === 'EN-CAMINO';
            }).length;

            const countDone = dailyOrders.filter(p => getStatus(p).includes('ENTREGADO')).length;

            if (filterGroup) {
                const btns = filterGroup.querySelectorAll('button');
                const f = app.state.posFilter;
                if (btns[0]) {
                    btns[0].innerHTML = `<i class="fas fa-inbox"></i> Nuevos <b>(${countNew})</b>`;
                    btns[0].classList.toggle('active', f === 'PEDIDO-RECIBIDO');
                }
                if (btns[1]) {
                    btns[1].innerHTML = `En Cocina <b>(${countCook})</b>`;
                    btns[1].classList.toggle('active', f === 'EN-COCINA');
                }
                if (btns[2]) {
                    btns[2].innerHTML = `Listos <b>(${countReady})</b>`;
                    btns[2].classList.toggle('active', f === 'LISTO-ENTREGA');
                }
                if (btns[3]) {
                    btns[3].innerHTML = `Entregados <b>(${countDone})</b>`;
                    btns[3].classList.toggle('active', f === 'ENTREGADO');
                }
            }
            const orders = projects.filter(p => {
                // NORMALIZACIÓN DE ESTADO (Consistente con contadores)
                let currentStatus = getStatus(p);

                // Definición de Grupos de Estado (Robustos)
                const isNew = currentStatus === 'PEDIDO-RECIBIDO' || currentStatus === 'RECIBIDO' || currentStatus === 'NUEVO';
                const isCook = currentStatus === 'EN-COCINA' || currentStatus === 'COCINANDO';
                const isReady = currentStatus === 'LISTO-ENTREGA' || currentStatus === 'LISTO' || currentStatus === 'EN-CAMINO';
                const isFinalized = (currentStatus.includes('ENTREGADO') || currentStatus === 'CANCELADO' || currentStatus === 'FINALIZADO');

                // FILTRO DE FECHA ROBUSTO (Misma zona horaria que los contadores)
                const pDate = new Date(p.fecha_inicio);
                const pDateStr = !isNaN(pDate.getTime()) ? `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}-${String(pDate.getDate()).padStart(2, '0')}` : "";

                if (pDateStr !== todayStr) return false;

                // FILTRADO POR PESTAÑA (Lógica Unificada con Contadores)
                const filter = app.state.posFilter;

                if (filter === 'ENTREGADO') return isFinalized;
                if (isFinalized) return false; // No mostrar finalizados en pestañas operativas

                if (filter === 'PEDIDO-RECIBIDO') return isNew;
                if (filter === 'EN-COCINA') return isCook;
                if (filter === 'LISTO-ENTREGA') return isReady;

                return false;
            });

            // v4.5.1 Ordenamiento Estricto: Los más recientes arriba, sin importar el estado.
            orders.sort((a, b) => {
                // Prioridad: Fecha Creación (ID suele ser cronológico, pero fecha_inicio es mejor)
                const dateA = new Date(a.fecha_inicio || 0);
                const dateB = new Date(b.fecha_inicio || 0);
                return dateB - dateA; // Descendente (Newest first)
            });

            if (orders.length === 0) {
                const activeTable = app.state.posFilter === 'TODOS' ? 'Operación Activa' : app.state.posFilter;
                const totalLoaded = projects.length;
                grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:50px; color:#999; border: 1px dashed #ccc; border-radius:12px; margin:20px;">
                        <i class="fas fa-clipboard-list fa-3x" style="opacity:0.2; margin-bottom:15px;"></i>
                        <p>No hay pedidos en <b>${activeTable}</b>.</p>
                        <hr style="width:50px; margin:15px auto; opacity:0.2;">
                        <small style="display:block; opacity:0.6;">Contexto: <span style="color:var(--primary-color); font-weight:bold;">${sCo}</span></small>
                        <small style="display:block; opacity:0.4; font-size:0.65rem; margin-top:5px;">Proyectos en memoria: ${totalLoaded}</small>
                        <button class="btn-secondary" style="margin-top:20px; font-size:0.7rem;" onclick="app.ui.refreshData('projects')"><i class="fas fa-sync"></i> Forzar Sincronización</button>
                    </div>`;
                return;
            }
            orders.forEach(o => {
                const card = document.createElement('div');
                // NORMALIZACIÓN DE ESTADO (v4.4.0)
                const orderStatus = (o.estatus || o.status || o.estado || "").toString().trim().toUpperCase();

                // --- JOIN LEAD DATA (Robust) ---
                const leadId = o.id_lead || o.id_cliente;
                const lead = (app.data.Leads || []).find(l => (l.id_lead || "").toString() === (leadId || "").toString());
                const address = lead ? (lead.direccion || lead.Direccion || '') : '';
                const phone = lead ? (lead.telefono || lead.Telefono || '') : '';

                // --- JOIN PAYMENT DATA (v4.6.8) ---
                const payment = (app.data.Proyectos_Pagos || []).find(pay => pay.id_proyecto === o.id_proyecto);
                const totalAmount = payment ? parseFloat(payment.monto) || 0 : 0;

                // Color coding based on normalized status (STRICT)
                let statusClass = 'status-default';
                if (orderStatus.includes('RECIBIDO')) statusClass = 'status-recibido';
                if (orderStatus.includes('COCINA')) statusClass = 'status-cocina';
                // LISTO, ENTREGA o CAMINO (Fallback) usan el mismo color de "Listo para salir"
                if (orderStatus.includes('LISTO') || orderStatus.includes('ENTREGA') || orderStatus.includes('CAMINO')) statusClass = 'status-entrega';
                if (orderStatus.includes('ENTREGADO')) statusClass = 'status-entregado';

                card.className = `order-card ${statusClass}`; // Clase CSS pura, sin estilos inline

                const isExternal = (app.data.Proyectos_Pagos || []).some(pay =>
                    pay.id_proyecto === o.id_proyecto && pay.referencia === 'CLIENTE-URL'
                );

                // --- LOGICA DE BOTONES DE ACCIÓN (v4.6.0 - Flujo Delivery 3 Pasos) ---
                let nextAction = '';

                if (orderStatus.includes('RECIBIDO')) {
                    if (isOperator || isAdmin) {
                        nextAction = `<button class="btn-status-next" onclick="app.pos.updateOrderStatus('${o.id_proyecto}', 'EN-COCINA')"><i class="fas fa-fire"></i> COCINAR</button>`;
                    }
                }
                else if (orderStatus.includes('COCINA')) {
                    if (isOperator || isAdmin) {
                        nextAction = `<button class="btn-status-next" onclick="app.pos.updateOrderStatus('${o.id_proyecto}', 'LISTO-ENTREGA')"><i class="fas fa-check"></i> LISTO</button>`;
                    }
                }
                else if ((orderStatus.includes('LISTO') || orderStatus.includes('ENTREGA') || orderStatus.includes('CAMINO')) && !orderStatus.includes('ENTREGADO')) {
                    // ESTADO: LISTO PARA ENTREGA (Incluye fallback para CAMINO)
                    const isHomeDelivery = isExternal || address !== "";

                    if (isHomeDelivery) {
                        // REPARTIDOR (Directo a Entregado)
                        if (isDelivery || isAdmin) {
                            nextAction = `<button class="btn-status-next" style="background:#2e7d32; border: 2px solid #fff;" onclick="app.pos.updateOrderStatus('${o.id_proyecto}', 'ENTREGADO')"><i class="fas fa-truck"></i> VERIFICAR Y ENTREGAR</button>`;
                        } else {
                            nextAction = `<span class="text-small" style="color:#2e7d32; font-style:italic; font-weight:bold;"><i class="fas fa-motorcycle"></i> ESPERANDO REPARTIDOR...</span>`;
                        }
                    } else {
                        // Venta Local
                        if (isOperator || isAdmin) {
                            nextAction = `<button class="btn-status-next" style="background:#2e7d32;" onclick="app.pos.updateOrderStatus('${o.id_proyecto}', 'ENTREGADO')"><i class="fas fa-hand-holding-heart"></i> ENTREGAR CAJA</button>`;
                        }
                    }
                }
                else if (orderStatus.includes('ENTREGADO') || orderStatus.includes('FINALIZADO')) {
                    // ESTADO FINAL
                    nextAction = `<div style="text-align:center; color:#2e7d32; font-weight:bold; padding: 10px; border-top: 1px solid #eee;">
                                     <i class="fas fa-check-circle"></i> PEDIDO FINALIZADO
                                   </div>`;
                }

                const debugInfo = `<div style="font-size:0.55rem; color:#999; margin-top:5px; border-top:1px dashed #eee; padding-top:3px;">[TIPO: ${isExternal ? 'WEB-OTS' : 'LOCAL'}] <b>ST: ${orderStatus}</b></div>`;

                // Format: Folio Corto (v4.4.0)
                const folioDisplay = o.id_proyecto.replace('ORD-', '#');

                // Safe Rendering de Fecha
                let dateStr = "------";
                try {
                    const dObj = new Date(o.fecha_inicio);
                    if (!isNaN(dObj.getTime())) {
                        dateStr = dObj.getHours().toString().padStart(2, '0') + ":" + dObj.getMinutes().toString().padStart(2, '0');
                    }
                } catch (e) { console.warn("Date parse fail", e); }

                // --- OTP PRIVACY LOGIC (v4.6.8) ---
                const otp = o.codigo_otp || o.otp || "";
                let otpDisplay = "";

                if (otp) {
                    // 1. FASE FINAL: YA ENTREGADO (Mostrar para todos)
                    if (orderStatus.includes('ENTREGADO')) {
                        otpDisplay = `<div style="background: #e8f5e9; padding: 5px; border-radius: 4px; margin-top: 5px; border-left: 4px solid #4caf50; font-size: 0.9rem;">
                                        <i class="fas fa-check"></i> <b>ENTREGADO (OTP: ${otp})</b>
                                      </div>`;
                    }
                    // 2. VISTA REPARTIDOR (Riesgo de fuga visual): Mantener Protegido/Borrado
                    else if (isDelivery) {
                        if (orderStatus.includes('LISTO') || orderStatus.includes('ENTREGA') || orderStatus.includes('CAMINO')) {
                            otpDisplay = `<button type="button" 
                                           onclick="event.stopPropagation(); app.pos.updateOrderStatus('${o.id_proyecto}', 'ENTREGADO');" 
                                           style="width:100%; margin-top:8px; background:#fff3e0; border:2px dashed #ff9800; color:#e65100; padding:10px; border-radius:6px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:space-between; text-align:left; font-size:0.85rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                        <span style="display:flex; align-items:center; gap:5px;"><i class="fas fa-key"></i> OTP: <span style="background:#fff; padding:2px 6px; border-radius:4px; filter: blur(4px); user-select: none;">XXXX</span></span>
                                        <div style="background:#ff9800; color:white; padding:4px 8px; border-radius:4px; font-size:0.75rem;">ENTREGAR <i class="fas fa-check"></i></div>
                                      </button>`;
                        } else {
                            otpDisplay = `<div style="font-size:0.75rem; color:#7f8c8d; margin-top:5px; background:#f5f6fa; padding:4px; border-radius:4px; text-align:center;">
                                            <i class="fas fa-lock"></i> Código Protegido
                                          </div>`;
                        }
                    }
                    // 3. VISTA STAFF/ADMIN: Mostrar Código Claro (Operativo)
                    else {
                        otpDisplay = `<div style="background: #fff3e0; padding: 5px; border-radius: 4px; margin-top: 5px; border-left: 4px solid #ff9800; font-size: 0.9rem;">
                                        <i class="fas fa-key"></i> <b>CÓDIGO ENTREGA: ${otp}</b>
                                      </div>`;
                    }
                }
                // (Limpieza de bloque OTP)

                // VISUAL BRANDING ENTREGADOS (v4.5.1)
                if (orderStatus === 'ENTREGADO') {
                    card.style.border = "2px solid #4caf50";
                    card.style.backgroundColor = "#f1f8e9";
                    card.style.opacity = "0.9";
                }


                card.innerHTML = `
                    <div class="order-card-header">
                        <span class="order-id">${folioDisplay}</span>
                        ${isExternal ? '<span class="badge-web"><i class="fas fa-globe"></i> WEB-OTS</span>' : '<span class="badge-local"><i class="fas fa-store"></i> LOCAL</span>'}
                        <span class="order-time"><i class="far fa-clock"></i> ${dateStr}</span>
                    </div>
                    <div class="customer-info" style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                        <h4 style="margin:0; font-size:1.1rem; color: var(--primary-color);">${o.nombre_proyecto.replace('Pedido ', '').replace('Orden PFM - ', '')}</h4>
                        <div class="customer-contact-info" style="margin-top:10px; font-size:1rem; color: #333; line-height:1.4;">
                            ${phone && phone !== 'N/A' ? `<div><b>Teléfono:</b> ${phone}</div>` : ''}
                            ${address && address !== 'Venta Local' ? `<div style="margin-top:5px;"><b>Dirección:</b> ${address}</div>` : ''}
                            <div style="margin-top:10px; padding: 5px 10px; background: #fffde7; border: 1px solid #fbc02d; border-radius: 6px; display:flex; justify-content:space-between; align-items:center;">
                                <b style="color: #f57f17; font-size: 0.8rem;"><i class="fas fa-dollar-sign"></i> TOTAL A COBRAR:</b> 
                                <span style="font-size: 1.1rem; font-weight: 800; color: #d32f2f;">$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            ${otpDisplay}
                        </div>
                    </div>
                    <div class="order-items" style="max-height: 100px; overflow-y: auto; margin-bottom:10px;">
                        ${(() => {
                        try {
                            const items = JSON.parse(o.line_items || '[]');
                            return items.map(item => `
                                    <div class="order-item-row" style="font-size:0.9rem; padding:2px 0;">
                                        <span><b>${item.qty}x</b> ${item.name}</span>
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
        } catch (err) {
            console.error("[POS_CRASH]", err);
            const grid = document.getElementById('pos-orders-grid');
            if (grid) grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px; color:red; border:1px solid red; border-radius:8px; background:rgba(255,0,0,0.05);">
                    <i class="fas fa-bug fa-3x" style="margin-bottom:10px;"></i>
                    <h4>Error de Renderizado</h4>
                    <p style="font-size:0.8rem; margin:10px 0;">${err.message}</p>
                    <button class="btn-primary" onclick="app.ui.renderPOS()">Reintentar</button>
                </div>`;
        }
    },
    updateConsole: (msg, isError = false) => {
        const el = document.getElementById('sb-console');
        const txt = document.getElementById('console-text');
        if (el && txt) {
            txt.innerText = "> " + msg;
            txt.style.color = isError ? "#f44" : "#0f0";
            if (isError) {
                el.classList.add('error');
            } else {
                el.classList.remove('error');
            }
        }
        // Log History (Persistence v4.6.5)
        if (!app.state.logHistory || app.state.logHistory.length === 0) {
            app.state.logHistory = JSON.parse(localStorage.getItem('suit_log_history') || '[]');
        }
        const time = new Date().toLocaleTimeString();
        app.state.logHistory.unshift(`[${time}] ${msg}`);
        if (app.state.logHistory.length > 50) app.state.logHistory.pop();
        localStorage.setItem('suit_log_history', JSON.stringify(app.state.logHistory));

        // Si el panel de logs está abierto, actualizarlo inmediatamente
        const panel = document.getElementById('sys-log-panel');
        if (panel && !panel.classList.contains('hidden')) {
            app.ui.toggleLogs(true); // Refrescar contenido sin cerrar
        }
    },
    toggleLogs: (onlyUpdate = false) => {
        let panel = document.getElementById('sys-log-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'sys-log-panel';
            panel.style.cssText = "position:fixed; top:50px; right:20px; width:450px; height:600px; background:rgba(0,0,0,0.95); color:#0f0; border:2px solid #333; z-index:99999; font-family:monospace; font-size:12px; padding:15px; overflow-y:auto; box-shadow:0 0 30px rgba(0,0,0,0.7); border-radius:12px; backdrop-filter:blur(10px);";
            panel.innerHTML = `
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid #0f0; padding-bottom:8px; margin-bottom:15px; align-items:center;">
                    <span style="color:#0f0; font-weight:bold; letter-spacing:1px;">[ SYSTEM_MONITOR_v4.6.5 ]</span>
                    <div style="display:flex; gap:12px;">
                        <span onclick="app.ui.viewLogs()" style="cursor:pointer; color:#00e676; border:1px solid #00e676; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:bold;">DB_AUDIT</span>
                        <span id="close-log-panel" style="cursor:pointer; color:#f44; font-weight:bold; font-size:16px;">[X]</span>
                    </div>
                </div>
                <div id="log-list" style="display:flex; flex-direction:column; gap:6px;"></div>
            `;
            document.body.appendChild(panel);
            document.getElementById('close-log-panel').onclick = () => panel.classList.add('hidden');
        }

        if (!onlyUpdate) {
            panel.classList.toggle('hidden');
            if (panel.classList.contains('hidden')) return;
        }

        const list = document.getElementById('log-list');
        if (list) {
            const h = app.state.logHistory || [];
            list.innerHTML = h.map(l => {
                const color = l.includes('ERROR') ? '#f44' : (l.includes('SYNC') ? '#00e676' : '#0f0');
                return `<div style="border-bottom:1px solid #222; padding:4px; color:${color}; line-height:1.4;">${l}</div>`;
            }).join('');
        }
    },
    // --- DELIVERY OTP LOGIC (v3.6.1) ---
    showOtpEntry: (id, targetStatus, correctOtp) => {
        app.state._otpContext = { id, targetStatus, correctOtp };
        const modal = document.getElementById('otp-modal');
        const input = document.getElementById('otp-entry-input');
        if (modal && input) {
            input.value = '';
            modal.classList.remove('hidden');
            setTimeout(() => input.focus(), 200);

            // UX FIX: Permitir Enter para validar (Blindado)
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Evita submits o saltos de línea
                    app.ui.verifyStandardOTP();
                }
            };
        }
    },
    closeOtpModal: () => {
        const modal = document.getElementById('otp-modal');
        if (modal) modal.classList.add('hidden');
        app.state._otpContext = null;
    },
    verifyStandardOTP: () => {
        const input = document.getElementById('otp-entry-input');
        const otpEntered = (input?.value || "").trim();
        const ctx = app.state._otpContext;
        if (!ctx) return;
        // Auto-update message in console
        app.ui.updateConsole(`VERIFYING_OTP_${otpEntered}...`);
        if (otpEntered === String(ctx.correctOtp)) {
            app.ui.closeOtpModal();
            app.pos.updateOrderStatus(ctx.id, ctx.targetStatus, true);
            app.ui.updateConsole("OTP_SUCCESS");
        } else {
            input.style.borderColor = 'red';
            app.ui.updateConsole("OTP_ERROR", true);
            alert("❌ Código Incorrecto. Pídele al cliente el código de 4 dígitos que aparece en su ticket de WhatsApp.");
        }
    },
    verifyOtp: function () { this.verifyStandardOTP(); }, // Alias for backward compatibility
    runConsoleSim: () => {
        app.ui.toggleLogs();
    },
    updateEstandarBarraST: () => {
        const updateTime = () => {
            const now = new Date();
            const timeEl = document.getElementById('sb-time');
            const dateEl = document.getElementById('sb-date');
            const aa = now.getFullYear().toString().slice(-2);
            const mm = (now.getMonth() + 1).toString().padStart(2, '0');
            const dd = now.getDate().toString().padStart(2, '0');
            const hh = now.getHours().toString().padStart(2, '0');
            const min = now.getMinutes().toString().padStart(2, '0');
            if (dateEl) dateEl.innerText = `${aa}${mm}${dd}`;
            if (timeEl) timeEl.innerText = `-${hh}${min}`;
        };
        updateTime();
        if (!app.state._statusBarInterval) {
            app.state._statusBarInterval = setInterval(updateTime, 30000); // Per minute is enough for date/time
        }
        if (!app.state._consoleStarted) {
            app.ui.runConsoleSim();
            app.state._consoleStarted = true;
        }

        // 1. Indicator
        const indicator = document.getElementById('sb-indicator');
        if (indicator) {
            indicator.innerHTML = `<i class="fa-solid fa-microchip"></i> BS-T <span onclick="app.ui.toggleLogs()" style="cursor:pointer; background:#00e676; color:#000; padding:0 6px; border-radius:4px; font-size:10px; font-weight:bold; margin-left:6px; box-shadow:0 0 10px rgba(0,230,118,0.3);">[LOGS]</span>:`;
        }

        // 2. User & Level (Numeric only)
        const userSpan = document.getElementById('sb-user');
        const levelSpan = document.getElementById('sb-level');
        if (userSpan) {
            if (app.state.currentUser) {
                userSpan.innerHTML = `<i class="fa-solid fa-user text-accent"></i> ${app.state.currentUser.nombre || 'Personal'}`;
                if (levelSpan) levelSpan.innerText = app.state.currentUser.nivel_acceso || "0";
            } else {
                userSpan.innerHTML = `<i class="fa-solid fa-user-secret"></i> Visitante`;
                if (levelSpan) levelSpan.innerText = "0";
            }
        }

        // 3. Version (Dynamic Sync)
        const versionEl = document.getElementById('gs-version-text');
        if (versionEl) {
            versionEl.innerText = `V: ${app.version}`;
            versionEl.style.opacity = "0.7";
        }

        // 4. Credits / Date Limit
        const coinEl = document.getElementById('sb-credits');
        if (coinEl) {
            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            const modo = (company && company.modo_creditos) || "USUARIO";
            let display = "";
            if (modo === "GLOBAL") {
                display = `<i class="fas fa-coins" style="color: #ffd700;"></i> $ ${company.creditos_totales || 0}`;
            } else if (modo === "DIARIO") {
                const limit = (app.state.currentUser && app.state.currentUser.fecha_limite_acceso) || (company && company.fecha_vencimiento);
                if (limit) {
                    const d = new Date(limit);
                    display = `<i class="fas fa-calendar-alt" style="color: #64b5f6;"></i> ${d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
                } else {
                    display = `<i class="fas fa-coins" style="color: #ffd700;"></i> $ ${app.state.currentUser ? app.state.currentUser.creditos : 0}`;
                }
            } else {
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
        app.ui.updateEstandarBarraST(); // Use the centralized function
        document.getElementById('menu-public').classList.add('hidden');
        document.getElementById('menu-staff').classList.remove('hidden');
        document.getElementById('login-modal-overlay').classList.add('hidden');
        document.getElementById('main-footer')?.classList.add('hidden');
        document.getElementById('whatsapp-float')?.classList.add('hidden');
        // Dynamic Menu Filtering (RBAC) 🚧
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
        let isStaff = parseInt(user.nivel_acceso) >= 2 || userRole === 'DIOS';
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
            let isAllowed = isAdmin || isExplicitlyAllowed || isCorePage;
            if (isDelivery) {
                // REPARTIDOR: Solo Monitor y Salir (v4.4.1)
                isAllowed = (targetBase === "pos");
            } else if (!isAllowed && modulesArray.length === 0) {
                // OTRO STAFF FALLBACK
                isAllowed = isStaff && (targetBase === "pos" || targetBase === "leads" || targetBase === "projects" || targetBase === "catalog");
            }
            if (isAllowed) {
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
        // Dynamic Agents Button - Granular RBAC
        const level = parseInt(user.nivel_acceso) || 0;
        const isGod = user.rol === 'DIOS' || level >= 10;
        const canMaintain = isGod || level >= 9 || modulesArray.includes('mantenimiento');
        const hasAIAccess = isGod || (level >= 5 && (modulesArray.includes('agents') || modulesArray.includes('knowledge')));
        const godTools = document.getElementById('god-tools');
        if (godTools) {
            // The container is visible if ANY tool is allowed
            if (hasAIAccess || canMaintain) {
                godTools.classList.remove('hidden');
                godTools.querySelector('h3').innerText = user.rol === 'DIOS' ? 'GOD MODE' : 'HERRAMIENTAS IA';
                // Controlled buttons inside
                const btnMnt = document.getElementById('btn-dash-maintenance');
                const btnAgt = document.getElementById('btn-dash-agents');
                if (btnMnt) canMaintain ? btnMnt.classList.remove('hidden') : btnMnt.classList.add('hidden');
                if (btnAgt) hasAIAccess ? btnAgt.classList.remove('hidden') : btnAgt.classList.add('hidden');
            } else {
                godTools.classList.add('hidden');
            }
        }
        // GATED ACTION BUTTONS (Granular RBAC)
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
        if (mntTools) {
            if (canMaintain) {
                mntTools.classList.remove('hidden');
                // GATED SUB-TOOLS: Only for Senior Admins (Strict Multi-tenant safety)
                const isSystemAdmin = user.rol === 'DIOS' || parseInt(user.nivel_acceso) >= 10;
                const btnRepair = document.getElementById('admin-tool-repair-db');
                const btnLogs = document.getElementById('admin-tool-logs');
                if (btnRepair) isSystemAdmin ? btnRepair.classList.remove('hidden') : btnRepair.classList.add('hidden');
                if (btnLogs) isSystemAdmin ? btnLogs.classList.remove('hidden') : btnLogs.classList.add('hidden');
            } else {
                mntTools.classList.add('hidden');
            }
        }
        // DELIVERY RESTRICTION: Hide ordering UI if user is delivery
        const isDeliveryRole = userRole === 'DELIVERY' || (user.nombre || "").toUpperCase().includes('REPARTIDOR');
        const cartBar = document.getElementById('cart-float-bar');
        if (cartBar) {
            if (isDeliveryRole) cartBar.classList.add('hidden');
            else cartBar.classList.remove('hidden');
        }
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
        document.getElementById('main-footer')?.classList.remove('hidden');
        document.getElementById('whatsapp-float')?.classList.remove('hidden');
        document.getElementById('cart-float-bar')?.classList.remove('hidden'); // Restaurar para visitantes
    },
    openAgentsModal: () => {
        window.location.hash = '#agents';
    },
    repairDatabase: async () => {
        const idle = document.getElementById('repair-idle');
        const running = document.getElementById('repair-running');
        if (idle) idle.classList.add('hidden');
        if (running) running.classList.remove('hidden');
        app.ui.updateConsole("STARTING_DB_REPAIR...");
        try {
            const res = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: 'initializeRbac', token: app.apiToken })
            });
            const data = await res.json();
            if (data.success) {
                app.ui.updateConsole("REPAIR_SUCCESS");
                alert("ñ¢Åâ¦ Base de datos reparada, columnas OTP verificadas y Agentes IA restaurados.");
                await app.loadData();
                document.getElementById('repair-modal').classList.add('hidden');
            } else {
                app.ui.updateConsole("REPAIR_ERROR", true);
                alert("ñ¢Å Error: " + (data.error || "Desconocido"));
            }
        } catch (e) {
            console.error(e);
            app.ui.updateConsole("REPAIR_CONN_FAIL", true);
            alert("Error de conexiñ³n al reparar.");
        } finally {
            if (idle) idle.classList.remove('hidden');
            if (running) running.classList.add('hidden');
        }
    },
    viewLogs: async () => {
        const modal = document.getElementById('logs-modal');
        if (modal) modal.classList.remove('hidden');
        app.ui.updateConsole("FETCHING_AUDIT_LOGS...");
        // Re-use refreshData for efficiency
        await app.ui.refreshData('Logs');
        app.ui.renderSystemLogs();
    },
    renderSystemLogs: () => {
        const container = document.getElementById('logs-container');
        if (!container) return;
        const searchInput = document.getElementById('log-search');
        const query = (searchInput?.value || '').toLowerCase().trim();
        let logs = (app.data.Logs || []);
        // FILTER
        if (query) {
            logs = logs.filter(l =>
                (l.accion || "").toLowerCase().includes(query) ||
                (l.usuario || "").toLowerCase().includes(query) ||
                (l.detalle || "").toLowerCase().includes(query) ||
                (l.id_log || "").toLowerCase().includes(query)
            );
        }
        // SORT (Newest first)
        logs.sort((a, b) => new Date(b.timestamp || b.fecha_hora) - new Date(a.timestamp || a.fecha_hora));
        if (logs.length === 0) {
            container.innerHTML = `<div style="text-align: center; padding: 40px; opacity: 0.5;">No se encontraron registros ${query ? 'para tu bñºsqueda' : ''}.</div>`;
            return;
        }
        container.innerHTML = logs.map(l => {
            const isError = (l.tipo || "").toUpperCase() === 'ERROR' || (l.accion || "").toUpperCase().includes('FAIL');
            const color = isError ? '#ff5252' : '#00e676';
            const time = new Date(l.timestamp || l.fecha_hora).toLocaleTimeString();
            const date = new Date(l.timestamp || l.fecha_hora).toLocaleDateString();
            return `<div style="margin-bottom: 8px; border-bottom: 1px solid #333; padding-bottom: 5px;">
                    <span style="color: #888;">[${date} ${time}]</span>
                    <span style="color: ${color}; font-weight: bold;">${(l.accion || 'LOG').toUpperCase()}</span>
                    <span style="color: #64b5f6;">@${l.usuario || 'SISTEMA'}</span>:
                    <span>${l.detalle || '-'}</span>
                </div>`;
        }).join('');
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
            // RBAC Checks for Buttons (Estñ¡ndar CRUD)
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
            // RBAC Checks for Buttons (Estñ¡ndar CRUD)
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
                    <button class="btn-small tab-btn" onclick="app.ui.switchProjectTab('logs', this)">Bitñ¡cora (${logs.length})</button>
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
                            <button class="btn-small" onclick="app.ui.addProjectStage('${pId}')" title="Añ±adir Etapa"><i class="fas fa-plus"></i></button>
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
                        <button class="btn-small w-100" style="margin-top:5px; background:var(--primary-color); color:white;" onclick="app.ui.addProjectManualLog('${pId}')" title="Añ±adir Comentario">
                            <i class="fas fa-comment-dots"></i> Añ±adir Registro
                        </button>
                    </div>
                    <div style="max-height: 250px; overflow-y: auto;">
                        ${logs.length ? logs.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora)).map(l => `
                            <div style="padding:8px; border-bottom:1px solid #eee; border-left: 3px solid ${l.tipo_evento === 'AUTO' ? '#2196F3' : '#4CAF50'}; margin-bottom:5px; background: rgba(0,0,0,0.02)">
                                <div class="flex-between">
                                    <span class="text-small"><strong>${l.tipo_evento === 'AUTO' ? 'ñ°Å¸¤â SISTEMA' : 'ñ°Å¸â¤ ' + l.usuario}</strong></span>
                                    <span class="text-small" style="color:#999">${new Date(l.fecha_hora).toLocaleString()}</span>
                                </div>
                                <div style="margin-top:4px; font-size:0.8rem">${l.detalle}</div>
                            </div>`).join('') : '<div class="text-small" style="text-align:center; padding:20px; color:#999">No hay registros en la bitñ¡cora</div>'}
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
                body: JSON.stringify({ action: 'updateProjectStage', stage: stage, token: app.apiToken })
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
                body: JSON.stringify({ action: 'updateProjectStage', stage: s, token: app.apiToken })
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
                body: JSON.stringify({ action: 'addProjectPayment', payment: pay, token: app.apiToken })
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
                body: JSON.stringify({ action: 'addProjectLog', log: log, token: app.apiToken })
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
                    status: newStatus,
                    token: app.apiToken
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
                body: JSON.stringify({ action: 'getFileText', fileId: fileId, token: app.apiToken })
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
                    img: img,
                    token: app.apiToken
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
    updateExternalOrderAlert: () => {
        const container = document.getElementById('pos-alerts-container');
        const countBlueEl = document.getElementById('pos-external-count');
        const countOrangeEl = document.getElementById('pos-delivery-count');
        const countGreenEl = document.getElementById('pos-done-count');

        if (!container || !countBlueEl || !countOrangeEl || !countGreenEl) return;

        if (app.state.isFood) {
            const todayStr = new Date().toLocaleDateString('en-CA');
            const projects = app.data.Proyectos || [];

            let countNewWeb = 0;
            let countPendingDelivery = 0;
            let countDone = 0;

            projects.forEach(p => {
                const isMyCompany = app.utils.getCoId(p) === app.state.companyId.toString().trim().toUpperCase();

                // Filtro de Fecha: Solo hoy
                const pDate = new Date(p.fecha_inicio);
                const isToday = !isNaN(pDate.getTime()) && pDate.toLocaleDateString('en-CA') === todayStr;

                if (!isMyCompany || !isToday) return;

                const status = (p.status || p.estado || "").toString().trim().toUpperCase().replace(/ /g, '-');

                // 1. Contador AZUL (Nuevos Web)
                const isExternal = (app.data.Proyectos_Pagos || []).some(pay =>
                    pay.id_proyecto === p.id_proyecto && pay.referencia === 'CLIENTE-URL'
                ) || (p.nombre_proyecto || "").includes('WEB-OTS');

                if (isExternal && status.includes('RECIBIDO')) {
                    countNewWeb++;
                }

                // 2. Contador NARANJA (Pendientes de Entrega)
                if (status.includes('LISTO') || status.includes('ENTREGA') || status.includes('CAMINO')) {
                    if (!status.includes('ENTREGADO')) {
                        countPendingDelivery++;
                    }
                }

                // 3. Contador VERDE (Entregados)
                if (status.includes('ENTREGADO') || status.includes('FINALIZADO')) {
                    countDone++;
                }
            });

            // Sonido solo si incrementa WEB NUEVOS
            if (countNewWeb > (app.state.lastExternalCount || 0)) {
                app.utils.playNotification();
            }
            app.state.lastExternalCount = countNewWeb;

            countBlueEl.innerText = countNewWeb;
            countOrangeEl.innerText = countPendingDelivery;
            countGreenEl.innerText = countDone;

            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    },

    renderStaffPOS: () => {
        const container = document.getElementById('staff-pos-grid');
        const sideNav = document.getElementById('staff-pos-side-nav');
        if (!container) return;
        container.innerHTML = '';
        if (sideNav) sideNav.innerHTML = '';
        const items = (app.data.Catalogo || []).filter(p => {
            const pCo = (p.id_empresa || "").toString().trim().toUpperCase();
            const sCo = (app.state.companyId || "").toString().trim().toUpperCase();
            const isActive = (p.activo == true || p.activo == 1 || p.activo === "TRUE" || p.activo === "1");
            return pCo === sCo && isActive;
        });
        if (items.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:50px; color:#999; grid-column:1/-1;">No hay productos para vender.</div>';
            return;
        }
        // Group by category
        const categories = {};
        items.forEach(p => {
            const cat = (p.categoria || p.Categoria || "General").toString().trim();
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(p);
        });
        Object.keys(categories).forEach((catName, index) => {
            const catId = `staff-cat-${index}`;
            // Sidebar item
            if (sideNav) {
                const navItem = document.createElement('div');
                navItem.className = 'pos-cat-item' + (index === 0 ? ' active' : '');
                navItem.id = `nav-${catId}`;
                navItem.innerText = catName;
                navItem.onclick = () => {
                    document.querySelectorAll('.pos-cat-item').forEach(el => el.classList.remove('active'));
                    navItem.classList.add('active');
                    document.getElementById(catId).scrollIntoView({ behavior: 'smooth', block: 'start' });
                };
                sideNav.appendChild(navItem);
            }
            // Category Section Header
            const section = document.createElement('div');
            section.id = catId;
            section.className = 'staff-pos-section';
            const title = document.createElement('h3');
            title.className = 'food-category-title';
            title.innerText = catName;
            section.appendChild(title);
            // Slider Container
            const grid = document.createElement('div');
            grid.className = 'food-grid';
            section.appendChild(grid);
            categories[catName].forEach(p => {
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
                            <div style="position:absolute; top:8px; left:8px; background:${stockColor}; color:white; padding:3px 8px; border-radius:4px; font-size:0.65rem; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.2); z-index:5;">
                                ${stock} DISP.
                            </div>
                        </div>
                        <div class="food-info">
                            <div class="food-title-row">
                                <h3>${p.nombre}</h3>
                                <span class="price">$${effectivePrice}</span>
                            </div>
                            <div class="food-actions-container">
                                <div class="food-actions">
                                    <button onclick="app.pos.removeFromCart('${p.id_producto}')"><i class="fas fa-minus"></i></button>
                                    <span id="qty-${p.id_producto}" class="food-qty" data-id="${p.id_producto}">${app.state.cart.find(i => i.id === p.id_producto)?.qty || 0}</span>
                                    <button onclick="app.pos.addToCart('${p.id_producto}')"><i class="fas fa-plus"></i></button>
                                </div>
                            </div>
                        </div>
                    `;
                grid.appendChild(card);
            });
            container.appendChild(section);
        });
        app.pos.updateCartVisuals();
        app.pos.updateLastSaleDisplay();
        app.ui.updateExternalOrderAlert(); // Monitoreo de pedidos externos para supervisores
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
                body: JSON.stringify({ action: 'updateProduct', product: { id_producto: id, stock: newStock }, token: app.apiToken })
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
    openProductModal: (prodId = null) => {
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('form-product');
        const msg = document.getElementById('p-msg');
        form.reset();
        document.getElementById('p-id').value = "";
        msg.classList.add('hidden');
        if (prodId) {
            const prod = app.data.Catalogo.find(p => p.id_producto === prodId);
            if (prod) {
                document.getElementById('p-id').value = prod.id_producto;
                document.getElementById('p-name').value = prod.nombre;
                document.getElementById('p-price').value = prod.precio;
                document.getElementById('p-category').value = prod.categoria || "";
                document.getElementById('p-stock').value = prod.stock || 0;
                document.getElementById('p-desc').value = prod.descripcion || "";
            }
        }
        modal.classList.remove('hidden');
    },
    saveProduct: async (e) => {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const msg = document.getElementById('p-msg');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESANDO...';
        btn.disabled = true;
        const fileInput = document.getElementById('p-file');
        let imageUrl = "";
        // 1. Handle File Upload if exists
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            const folderId = company ? company.drive_folder_id : null;
            if (folderId) {
                try {
                    const base64 = await app.ui.fileToBase64(file);
                    const res = await fetch(app.apiUrl, {
                        method: 'POST',
                        headers: { "Content-Type": "text/plain" },
                        body: JSON.stringify({
                            action: 'uploadFile',
                            folderId: folderId,
                            base64: base64,
                            filename: `PROD_${Date.now()}_${file.name}`,
                            contentType: file.type,
                            token: app.apiToken
                        })
                    });
                    const uploadData = await res.json();
                    if (uploadData.success) {
                        imageUrl = `https://docs.google.com/uc?export=view&id=${uploadData.fileId}`;
                    }
                } catch (err) {
                    console.error("Upload Error:", err);
                }
            }
        }
        // 2. Prepare Product Data (Smart Create/Update)
        const currentId = document.getElementById('p-id').value;
        const isNew = !currentId;
        const finalId = isNew ? `PROD-${Date.now()}` : currentId;

        const prodData = {
            id_producto: finalId,
            id_empresa: app.state.companyId,
            nombre: document.getElementById('p-name').value,
            precio: document.getElementById('p-price').value,
            categoria: document.getElementById('p-category').value,
            stock: document.getElementById('p-stock').value,
            descripcion: document.getElementById('p-desc').value,
            activo: "TRUE"
        };
        if (imageUrl) prodData.imagen_url = imageUrl;

        // 3. Save to Backend
        try {
            const actionType = isNew ? 'createProduct' : 'saveProduct'; // Backend router distinction
            const res = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                    action: actionType,
                    product: prodData,
                    token: app.apiToken
                })
            });
            const result = await res.json();
            if (result.success) {
                msg.innerHTML = '<i class="fas fa-check-circle"></i> Producto guardado correctamente';
                msg.className = "msg-box success";
                msg.classList.remove('hidden');
                await app.loadData();
                app.ui.renderCatalog();
                setTimeout(() => {
                    document.getElementById('product-modal').classList.add('hidden');
                }, 1500);
            } else {
                msg.innerHTML = '<i class="fas fa-times-circle"></i> Error: ' + result.error;
                msg.className = "msg-box error";
                msg.classList.remove('hidden');
            }
        } catch (err) {
            msg.innerHTML = '<i class="fas fa-wifi"></i> Error de conexión';
            msg.className = "msg-box error";
            msg.classList.remove('hidden');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },
    fileToBase64: (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    }),
    exportTable: (tableName, format) => {
        let data = [];
        if (tableName === 'Leads') data = app.data.Leads.filter(l => l.id_empresa === app.state.companyId);
        if (tableName === 'Proyectos') data = app.data.Proyectos.filter(p => p.id_empresa === app.state.companyId);
        if (tableName === 'Catalogo') data = app.data.Catalogo.filter(p => p.id_empresa === app.state.companyId);
        if (data.length === 0) return alert("No hay datos para exportar.");
        if (format === 'VTS') {
            const headers = Object.keys(data[0]);
            const rows = data.map(obj => headers.map(h => obj[h]).join('\t'));
            const content = [headers.join('\t'), ...rows].join('\n');
            const blob = new Blob([content], { type: 'text/tab-separated-values' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${tableName}_${app.state.companyId}_${new Date().toISOString().split('T')[0]}.vts`;
            a.click();
        } else {
            window.print();
        }
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
        if (app.events && app.events.init) {
            app.events.init();
        } else {
            console.error("❌ Error: Módulo app.events no cargado.");
        }
    }, // End bindEvents
    // --- NEW REPORT ENGINE (v3.6.0) ---
    currentReportType: 'general',
    selectReportType: (type, btn) => {
        app.ui.currentReportType = type;
        document.querySelectorAll('.report-tab-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        else {
            const target = document.querySelector(`.report-tab-btn[data-report="${type}"]`);
            if (target) target.classList.add('active');
        }
        app.ui.renderReport();
    },
    handleReportTypeChange: () => {
        app.ui.renderReport();
    },
    renderReport: () => {
        const container = document.getElementById('report-content');
        if (!container) return;
        const type = document.getElementById('report-type').value; // DIARIO / MENSUAL
        const dateVal = document.getElementById('report-date').value;
        const reportCategory = app.ui.currentReportType; // general, payments, profit, products
        container.innerHTML = `<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:10px;">Procesando datos...</p></div>`;
        // Filter data by Company & Date Scope
        const companyId = app.state.companyId;
        const projectIds = app.data.Proyectos.filter(p => {
            const matchCo = p.id_empresa === companyId;
            const isActive = p.activo !== false && p.estado !== 'ELIMINADO';
            return matchCo && isActive;
        }).map(p => p.id_proyecto);
        let payments = (app.data.Pagos || app.data.Proyectos_Pagos || []).filter(p => projectIds.includes(p.id_proyecto));
        // Scope filter
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
        // --- RENDER LOGIC BY CATEGORY ---
        if (reportCategory === 'general') {
            app.ui._renderGeneralReport(container, payments);
        } else if (reportCategory === 'payments') {
            app.ui._renderPaymentsReport(container, payments);
        } else if (reportCategory === 'profit') {
            app.ui._renderProfitReport(container, payments);
        } else if (reportCategory === 'products') {
            app.ui._renderProductsReport(container, payments);
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
                            ${payments.slice(0, 50).map(p => `
                                <tr>
                                    <td><b>${p.id_pago || p.id_proyecto.slice(-6)}</b></td>
                                    <td>${new Date(p.fecha_pago).toLocaleDateString()}</td>
                                    <td>${p.concepto || 'Venta Directa'}</td>
                                    <td><span class="method-badge method-tag-${(p.metodo_pago || 'efectivo').toLowerCase()}">${p.metodo_pago || 'Desconocido'}</span></td>
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
        container.innerHTML = `<div style="text-align:center; padding:40px;"><i class="fas fa-hammer fa-2x"></i><p>Reporte de Rentabilidad en construcción... estará disponible en v3.6.1</p></div>`;
    },
    _renderProductsReport: (container, payments) => {
        container.innerHTML = `<div style="text-align:center; padding:40px;"><i class="fas fa-boxes fa-2x"></i><p>Reporte de Volumen por Producto en construcción... estará disponible en v3.6.1</p></div>`;
    },
    exportReport: (format) => {
        const type = app.ui.currentReportType;
        app.ui.updateConsole(`EXPORTING_${type.toUpperCase()}_TO_${format}...`);
        alert(`Función de exportación a ${format} iniciada. El archivo se generará en la nube y se enviará a tu correo de administrador.`);
    },
    renderQuotas: () => {
        const tbody = document.getElementById('quotas-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        // SEGURIDAD: Solo SUITORG o DIOS pueden ver esto
        const user = app.state.currentUser;
        const companyId = app.state.companyId;
        const isGod = user.rol === 'DIOS' || (user.nivel_acceso && parseInt(user.nivel_acceso) >= 10);
        const isSuitOrg = companyId === 'SUITORG';

        if (!isGod && !isSuitOrg) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;"><i class="fas fa-lock"></i> Módulo restringido a Administración Central.</td></tr>';
            return;
        }

        const quotas = app.data.Cuotas_Pagos || [];
        // DIOS ve todo, SUITORG ve lo suyo (o todo si actúa como admin SaaS)
        const dataToShow = isGod || isSuitOrg ? quotas : [];

        if (dataToShow.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No hay registros de cuotas.</td></tr>';
            return;
        }

        // Ordenar: Más recientes primero
        dataToShow.sort((a, b) => {
            const da = new Date(a.fecha_vencimiento || 0);
            const db = new Date(b.fecha_vencimiento || 0);
            return db - da;
        });

        dataToShow.forEach(q => {
            const tr = document.createElement('tr');

            // Estado Logic
            const status = (q.estado || "PENDIENTE").toUpperCase();
            let statusColor = "#f39c12"; // Pendiente
            let statusIcon = "fa-clock";
            if (status === 'PAGADO') { statusColor = "#27ae60"; statusIcon = "fa-check-circle"; }
            if (status === 'VENCIDO') { statusColor = "#c0392b"; statusIcon = "fa-exclamation-circle"; }

            // Fechas
            const dVenc = q.fecha_vencimiento ? new Date(q.fecha_vencimiento).toLocaleDateString('es-MX') : 'N/A';

            tr.innerHTML = `
                <td>
                    <div style="font-weight:bold;">${q.concepto || 'Cuota Mensual'}</div>
                    <div style="font-size:0.75rem; color:#666;">${q.id_empresa}</div>
                </td>
                <td style="font-weight:bold;">$${q.monto || '0.00'}</td>
                <td>${dVenc}</td>
                <td><span style="color:${statusColor}; font-weight:bold; font-size:0.85rem;"><i class="fas ${statusIcon}"></i> ${status}</span></td>
                <td style="text-align:right;">
                    ${status !== 'PAGADO' ? `<button class="btn-sm js-disabled" style="background:#2e7d32; color:white; opacity:0.5; cursor:not-allowed;" title="Próximamente"><i class="fas fa-dollar-sign"></i> Pagar</button>` : '<span style="color:#999; font-size:0.8rem;">Completado</span>'}
                </td>
            `;
        });
    }
};
