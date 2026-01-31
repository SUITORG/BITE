app.pos = {
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
        app.state.deliveryMethod = 'DOMICILIO';
        // Reset Payment & Field Defaults
        app.ui.setPosPaymentMethod('Efectivo');
        const pFolio = document.getElementById('pos-pay-folio');
        if (pFolio) pFolio.value = '';
        // Sync UI buttons (Reset to Delivery)
        document.querySelectorAll('.delivery-opt, .delivery-opt-staff').forEach(btn => {
            if (btn.id === 'staff-delivery-dom' || btn.dataset.method === 'DOMICILIO') btn.classList.add('active');
            else btn.classList.remove('active');
        });
        app.pos.updateCartVisuals();
        app.pos.renderExpressTicket();
    },
    updateCartVisuals: () => {
        let subtotal = 0;
        let count = 0;
        document.querySelectorAll('.food-qty').forEach(el => el.innerText = '0');
        app.state.cart.forEach(item => {
            subtotal += item.price * item.qty;
            count += item.qty;
            const qtyDisplays = document.querySelectorAll(`[id="qty-${item.id}"]`);
            qtyDisplays.forEach(el => el.innerText = item.qty);
        });
        // Delivery Logic
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const deliveryFee = parseFloat(company?.costo_envio || 0);
        const isDelivery = app.state.deliveryMethod === 'DOMICILIO';
        const total = subtotal + (isDelivery ? deliveryFee : 0);
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
        const ticketSubtotalEl = document.getElementById('ticket-subtotal');
        if (ticketSubtotalEl) ticketSubtotalEl.innerText = `$${subtotal.toFixed(2)}`;
        const ticketCountEl = document.getElementById('ticket-count');
        if (ticketCountEl) ticketCountEl.innerText = count;
        const staffDevFeeEl = document.getElementById('staff-delivery-fee');
        if (staffDevFeeEl) staffDevFeeEl.innerText = `$${deliveryFee.toFixed(2)}`;
        const staffDevRow = document.getElementById('staff-delivery-row');
        if (staffDevRow) staffDevRow.classList.toggle('hidden', !isDelivery);
        // Mobile Floating Trigger Visuals (PFM)
        const mobileTrigger = document.getElementById('mobile-ticket-trigger');
        if (mobileTrigger) {
            mobileTrigger.classList.remove('cart-pulse');
            void mobileTrigger.offsetWidth; // Trigger reflow
            mobileTrigger.classList.add('cart-pulse');
        }
        const mobileTotalEl = document.getElementById('mobile-cart-total');
        if (mobileTotalEl) mobileTotalEl.innerText = `$${total.toFixed(2)}`;
        const mobileBadgeEl = document.getElementById('mobile-cart-badge');
        if (mobileBadgeEl) {
            mobileBadgeEl.innerText = count;
            mobileBadgeEl.classList.toggle('hidden', count === 0);
        }
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
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Carrito vacñÂƒÂ­o</p>';
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
        const isPickup = app.state.deliveryMethod === 'PICKUP';
        // Get Express/Customer data from staff sidebar
        const sName = document.getElementById('pos-cust-name').value;
        const sPhone = document.getElementById('pos-cust-phone').value;
        const sAddress = document.getElementById('pos-cust-address').value;
        const sNotes = document.getElementById('pos-cust-notes')?.value || "";
        if (!isPickup && (!sName || !sAddress)) {
            return alert("Para envñÂƒÂ­os es necesario el nombre y direcciñÂƒÂ³n del cliente.");
        }
        const finalName = sName || "Venta en Mostrador";
        const finalPhone = sPhone || "N/A";
        const finalAddress = sAddress || (isPickup ? "Venta Local" : "");
        // Map to main checkout inputs (modal inputs are used as bridge)
        const mainName = document.getElementById('cust-name');
        const mainPhone = document.getElementById('cust-phone');
        const mainAddress = document.getElementById('cust-address');
        const mainNotes = document.getElementById('cust-notes');
        if (mainName) mainName.value = finalName;
        if (mainPhone) mainPhone.value = finalPhone;
        if (mainAddress) mainAddress.value = finalAddress;
        if (mainNotes) mainNotes.value = sNotes;
        const method = document.getElementById('pos-pay-method').value;
        const folio = document.getElementById('pos-pay-folio').value || '';
        document.getElementById('pay-method').value = method;
        document.getElementById('pay-confirm').value = folio;
        const isStaffSale = true; // Hardcoded here because we ARE in checkoutStaff
        const btn = document.getElementById('btn-pos-checkout');
        if (btn) {
            btn.classList.add('blink-confirm');
            setTimeout(() => btn.classList.remove('blink-confirm'), 600);
        }
        await app.pos.checkout(true);
        // Clear sidebar fields after success
        document.getElementById('pos-cust-name').value = '';
        document.getElementById('pos-cust-phone').value = '';
        document.getElementById('pos-cust-address').value = '';
        const nEl = document.getElementById('pos-cust-notes');
        if (nEl) nEl.value = '';
        // Ensure folio is also cleared here just in case
        const pFolio = document.getElementById('pos-pay-folio');
        if (pFolio) pFolio.value = '';
        // Re-sync UI (Reset to Efectivo)
        app.ui.setPosPaymentMethod('Efectivo');
        app.pos.setDeliveryMethod('DOMICILIO');
        // Auto-close staff sidebar after 10s if on mobile
        const sidebar = document.querySelector('.pos-sidebar');
        if (sidebar && sidebar.classList.contains('mobile-active')) {
            setTimeout(() => {
                sidebar.classList.remove('mobile-active');
            }, 5000);
        }
    },
    updateLastSaleDisplay: () => {
        const el = document.getElementById('ticket-last-val');
        if (!el) return;
        // Use the standard table name Proyectos_Pagos
        const myProjectIds = (app.data.Proyectos || [])
            .filter(p => p.id_empresa === app.state.companyId)
            .map(p => p.id_proyecto);
        const payments = (app.data.Proyectos_Pagos || [])
            .filter(pay => myProjectIds.includes(pay.id_proyecto));
        if (payments.length === 0) {
            el.innerText = "$0.00";
            return;
        }
        // Robust Sort: Date first, then index in original array (for same-second sales)
        const sorted = [...payments].sort((a, b) => {
            const dateA = new Date(a.fecha_pago || 0).getTime();
            const dateB = new Date(b.fecha_pago || 0).getTime();
            if (dateB !== dateA) return dateB - dateA;
            return payments.indexOf(b) - payments.indexOf(a);
        });
        const lastOne = sorted[0];
        el.innerText = lastOne ? `$${parseFloat(lastOne.monto).toFixed(2)}` : "$0.00";
    },
    checkout: async (forcedStaff = false) => {
        if (app.state.cart.length === 0) return alert("El carrito estñÂƒ¡ vacñÂƒÂ­o.");
        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;
        const address = document.getElementById('cust-address')?.value || '';
        const notes = document.getElementById('cust-notes')?.value || '';
        const method = document.getElementById('pay-method').value;
        const confirmNum = document.getElementById('pay-confirm')?.value || '';
        // Priority for staff detection: manually forced or via URL hash
        const isStaffSale = forcedStaff || (window.location.hash === '#staff-pos') || (name === "Venta en Mostrador");
        const isPickup = app.state.deliveryMethod === 'PICKUP';
        if (!name || (!isStaffSale && !phone) || (!isStaffSale && !isPickup && !address)) {
            return alert("Por favor completa los campos obligatorios (*).");
        }
        // UI Feedback: Detect which button to animate (Public vs Staff)
        const btnStaff = document.getElementById('btn-pos-checkout');
        const btnPublic = document.getElementById('btn-confirm-order');
        const btn = isStaffSale ? btnStaff : btnPublic;
        const originalText = btn ? btn.innerText : "...";
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
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
        const cartSubtotal = app.state.cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const deliveryFee = isPickup ? 0 : (parseFloat(company?.costo_envio) || 0);
        const cartTotal = cartSubtotal + deliveryFee;
        // NEW TRANSACTIVE FLOW (v3.6.2)
        // One single call for everything: Lead + Project + Payment + Stock
        app.ui.updateConsole("SYNCING_ORDER...");
        const stockUpdates = [];
        app.state.cart.forEach(item => {
            const prod = app.data.Catalogo.find(p => String(p.id_producto) === String(item.id));
            if (prod) {
                const newStock = Math.max(0, (parseInt(prod.stock) || 0) - item.qty);
                prod.stock = newStock; // Update local memory immediately
                stockUpdates.push({ id_producto: String(item.id), id_empresa: app.state.companyId, stock: newStock });
            }
        });
        const keywords = ['Alimentos', 'Comida', 'Restaurante', 'Snack', 'Food', 'PFM', 'PMP', 'HMP'];
        const bizType = (company?.tipo_negocio || "").toString();
        const bizId = (app.state.companyId || "").toString().toUpperCase();
        const isFood = keywords.some(k => bizType.includes(k) || bizId.includes(k));

        const useOtp = company?.usa_otp_entrega === true || company?.usa_otp_entrega === "TRUE" || company?.usa_otp_entrega === "1" || isFood;
        let generatedOtp = "";
        if (useOtp) {
            generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
            app.state._currentOrderOtp = generatedOtp;
        }
        const fullOrderPayload = {
            action: 'processFullOrder',
            token: app.apiToken,
            lead: leadData,
            project: {
                id_empresa: app.state.companyId,
                nombre_proyecto: `Pedido ${company?.nomempresa || "POS"} - ${name}`,
                descripcion: notes,
                line_items: JSON.stringify(app.state.cart),
                codigo_otp: generatedOtp, // REVERTIDO: Para asegurar persistencia en columna 'codigo_otp' de Sheets
                estatus: "PEDIDO-RECIBIDO",
                estado: "PEDIDO-RECIBIDO",
                status: "PEDIDO-RECIBIDO"
            },
            payment: {
                id_empresa: app.state.companyId,
                monto: cartTotal,
                concepto: `Venta POS - ${name}`,
                metodo_pago: method,
                folio: confirmNum || "CAJA",
                referencia: isStaffSale ? "STAFF" : "CLIENTE-URL"
            },
            stockUpdates: stockUpdates
        };
        try {
            const response = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(fullOrderPayload)
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error || "Error en el servidor");
            app.state.lastOrderId = result.newOrderId;
            // 5. Success UI & Cleanup
            if (isStaffSale) {
                const printNow = confirm("¡Pedido registrado exitosamente!\n\n¿Deseas imprimir el ticket físico?");
                if (printNow) {
                    try {
                        app.ui.printTicket({ name: name, costo_envio: deliveryFee }, [...app.state.cart]);
                    } catch (pErr) {
                        console.error("Print error:", pErr);
                    }
                }
                app.pos.clearCart();
                app.pos.closeCheckout();
            } else {
                app.pos.nextStep(3);
            }
            app.ui.updateConsole("ORDER_SUCCESS");
            // Refresh Data in background
            app.loadData().then(() => {
                if (window.location.hash === '#pos') app.ui.renderPOS();
                if (window.location.hash === '#staff-pos') app.ui.renderStaffPOS();
                app.pos.updateLastSaleDisplay();
            });
        } catch (e) {
            console.error("Order Transaction Error:", e);
            app.ui.updateConsole("TRANS_FAIL", true);
            alert("Hubo un error al procesar tu pedido. Por favor intenta de nuevo.");
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
            container.innerHTML = '<p style="text-align:center; color:#999;">Carrito vacñÂƒÂ­o</p>';
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
        // Toggle NñÂ‚Â° ConfirmaciñÂƒÂ³n block
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
        // Reset to Step 1 and defaults
        app.pos.setDeliveryMethod('DOMICILIO');
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
        // Handle Step 3 OTP & OTS display
        if (n === 3) {
            const otsVal = document.getElementById('ots-folio-value');
            if (otsVal && app.state.lastOrderId) {
                otsVal.innerText = "#" + app.state.lastOrderId;
            }

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
        const subtotalEl = document.getElementById('express-ticket-subtotal');
        const deliveryFeeEl = document.getElementById('express-delivery-fee');
        const deliveryRow = document.getElementById('express-delivery-row');
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
        let subtotal = 0;
        container.innerHTML = app.state.cart.map(item => {
            const sub = item.price * item.qty;
            subtotal += sub;
            return `
                    <div class="ticket-item-express">
                        <span class="ticket-item-name">${item.name} x${item.qty}</span>
                        <span class="ticket-item-price">$${sub.toFixed(2)}</span>
                    </div>
                `;
        }).join('');
        const deliveryFee = parseFloat(co?.costo_envio || 0);
        const isDelivery = app.state.deliveryMethod === 'DOMICILIO';
        if (subtotalEl) subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
        if (deliveryFeeEl) deliveryFeeEl.innerText = `$${deliveryFee.toFixed(2)}`;
        if (deliveryRow) deliveryRow.classList.toggle('hidden', !isDelivery);
        const total = subtotal + (isDelivery ? deliveryFee : 0);
        if (totalEl) totalEl.innerText = `$${total.toFixed(2)}`;
    },
    setDeliveryMethod: (method) => {
        app.state.deliveryMethod = method;
        // Update UI buttons (Public & Staff)
        document.querySelectorAll('.delivery-opt, .delivery-opt-staff').forEach(btn => {
            if (btn.id === 'staff-delivery-pickup') btn.classList.toggle('active', method === 'PICKUP');
            else if (btn.id === 'staff-delivery-dom') btn.classList.toggle('active', method === 'DOMICILIO');
            else btn.classList.toggle('active', btn.dataset.method === method);
        });
        // Toggle address field visibility in checkout (Public)
        const addressField = document.getElementById('address-block');
        if (addressField) addressField.classList.toggle('hidden', method === 'PICKUP');
        // Toggle address field visibility in POS (Staff)
        const posAddress = document.getElementById('pos-cust-address');
        if (posAddress) posAddress.classList.toggle('hidden', method === 'PICKUP');
        app.pos.updateCartVisuals();
        app.pos.renderExpressTicket();
    },
    sendWhatsApp: () => {
        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;
        const address = document.getElementById('cust-address').value;
        const notes = document.getElementById('cust-notes')?.value || '';
        const method = document.getElementById('pay-method').value;
        const confirmNum = document.getElementById('pay-confirm')?.value || 'N/A';
        const isDelivery = app.state.deliveryMethod === 'DOMICILIO';
        // Safeguard: use UI total or calculate from cart if UI failed
        let cartTotalText = document.getElementById('express-ticket-total')?.innerText || "$0.00";
        let cartTotal = parseFloat(cartTotalText.replace('$', '')) || 0;
        const itemsText = app.state.cart.map(c => `• *${c.name}* x${c.qty} _(${(c.price * c.qty).toFixed(2)})_`).join('\n');
        const co = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const businessPhone = co?.telefonowhatsapp || "5218120731000";
        const brandName = co?.nomempresa || "Nuestra Tienda";
        let waMsg =
            `🛵 *NUEVA ORDEN: ${brandName}*\n` +
            `🆔 *Folio:* ${app.state.lastOrderId || 'REC-PROCESO'}\n`;

        if (app.state._currentOrderOtp) {
            waMsg += `🔑 *Clave de Entrega:* ${app.state._currentOrderOtp}\n`;
        }

        waMsg += `🗓️ *Fecha:* ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
            `----------------------------\n` +
            `👤 *Cliente:* ${name}\n` +
            `📞 *Tel:* ${phone}\n` +
            `🚚 *Entrega:* ${isDelivery ? 'A DOMICILIO' : 'RECOGER EN LOCAL'}\n`;
        if (isDelivery) {
            waMsg += `📍 *Dir:* ${address}\n`;
        }
        if (notes) {
            waMsg += `📝 *Notas:* ${notes}\n`;
        }
        waMsg += `----------------------------\n` +
            `📦 *PRODUCTOS:*\n${itemsText}\n` +
            `----------------------------\n` +
            `💳 *Método de Pago:* ${method}\n`;
        if (method === 'Transferencia') {
            waMsg += `✅ *Confirmación:* ${confirmNum}\n`;
        }
        waMsg +=
            `💰 *TOTAL A PAGAR: $${cartTotal.toFixed(2)}*\n\n` +
            `_Favor de confirmar mi pedido. Gracias._`;
        const encodedMsg = encodeURIComponent(waMsg);
        window.open(`https://wa.me/${businessPhone}?text=${encodedMsg}`, '_blank');
        // Final cleanup after successful handoff to WhatsApp
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
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[LOG ${timestamp}] Action: UPDATE_STATUS | ID: ${id} | New: ${newStatus} | SkipOTP: ${skipOtp}`);

        // 1. Logs visibles para el usuario (Diagnóstico Solicitado)
        app.ui.updateConsole(`CHANGE_STATUS: ${id.slice(-4)} -> ${newStatus}`);
        console.log(`[POS] Requesting update for ${id} to ${newStatus}`);

        // --- OTP CHECK ---
        if (newStatus === 'ENTREGADO' && !skipOtp) {
            const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
            const order = app.data.Proyectos.find(p => (p.id_proyecto || "").toString().trim().toUpperCase() === id.toString().trim().toUpperCase());
            const useOtp = company?.usa_otp_entrega === true || company?.usa_otp_entrega === "TRUE" || company?.usa_otp_entrega === "1";

            // Si requiere OTP y lo tiene asignado
            if (useOtp && order?.codigo_otp) {
                console.log(`[LOG ${timestamp}] OTP Required: ${order.codigo_otp}`);
                app.ui.showOtpEntry(id, newStatus, String(order.codigo_otp).trim());
                return; // Stop here, wait for OTP modal
            }
        }

        app.state._isUpdatingStatus = true;

        // --- OPTIMISTIC UI UPDATE (Instant Feedback) ---
        // Actualizamos memoria local INMEDIATAMENTE, sin esperar al servidor.
        const orderIndex = app.data.Proyectos.findIndex(p => (p.id_proyecto || "").toString().trim().toUpperCase() === id.toString().trim().toUpperCase());
        let previousStatus = "";

        if (orderIndex > -1) {
            previousStatus = app.data.Proyectos[orderIndex].status || ""; // Guardar para rollback si falla

            app.data.Proyectos[orderIndex].status = newStatus;
            app.data.Proyectos[orderIndex].estado = newStatus;
            app.data.Proyectos[orderIndex].estatus = newStatus; // Normalize just in case

            // Persistent Cache Update (v4.6.5)
            const localCache = JSON.parse(localStorage.getItem('suit_status_cache') || '{}');
            localCache[id] = { status: newStatus, ts: Date.now() };
            localStorage.setItem('suit_status_cache', JSON.stringify(localCache));
            app.state._recentStatusCache = localCache;

            console.log(`[LOG ${timestamp}] Optimistic Update Applied. Rendering POS...`);

            // Renderizado Inmediato
            if (window.location.hash === '#pos') {
                app.ui.renderPOS();
                app.ui.updateExternalOrderAlert();
            }
        }

        try {
            // Background Sync
            const response = await fetch(app.apiUrl, {
                method: 'POST',
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                    action: 'updateProjectStatus',
                    id: id,
                    id_empresa: app.state.companyId,
                    status: newStatus,
                    token: app.apiToken
                })
            });
            const result = await response.json();

            if (!result.success) throw new Error(result.error || "Server failed to update status");

            console.log(`[LOG ${new Date().toLocaleTimeString()}] Server Sync Success.`);
            app.ui.updateConsole(`[${new Date().toLocaleTimeString()}] SERVER_SYNC_OK`);

            setTimeout(() => { app.state._isUpdatingStatus = false; }, 10000); // v4.6.6: Extended cooldown to 10s for slow Sheets sync

        } catch (e) {
            console.error("[POS_ERROR] Status Update Failed:", e);
            app.state._isUpdatingStatus = false;
            app.ui.updateConsole(`ERROR_SYNC_REVERTING...`, true);
            alert("Error de conexión. Se revertirá el cambio.");

            // ROLLBACK if failed
            if (orderIndex > -1 && previousStatus) {
                app.data.Proyectos[orderIndex].status = previousStatus;
                app.data.Proyectos[orderIndex].estado = previousStatus;
                if (window.location.hash === '#pos') app.ui.renderPOS();
            }
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
};
