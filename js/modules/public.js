/**
 * EVASOL - PUBLIC MODULE (v4.6.7)
 * Responsabilidad: Vistas públicas, Landing Page, SEO, Menú y Órbita.
 */
app.public = {
    // --- INFO MODALS ---
    showAboutUs: () => {
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const content = document.getElementById('about-content');
        if (content && company) {
            // Social Links HTML
            let socialHtml = '';
            if (company.rsface) socialHtml += `<a href="${company.rsface}" target="_blank" style="color:#1877F2; font-size:1.5rem;"><i class="fab fa-facebook"></i></a>`;
            if (company.rsinsta) socialHtml += `<a href="${company.rsinsta}" target="_blank" style="color:#E4405F; font-size:1.5rem;"><i class="fab fa-instagram"></i></a>`;
            if (company.rstik) socialHtml += `<a href="${company.rstik}" target="_blank" style="color:#000000; font-size:1.5rem;"><i class="fab fa-tiktok"></i></a>`;

            content.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="${company.logo_url ? app.utils.fixDriveUrl(company.logo_url) : ''}" style="max-width: 120px; border-radius: 12px; margin-bottom: 10px;">
                    <h2 style="color: var(--primary-color); margin:0;">${company.nomempresa}</h2>
                    <p style="font-style: italic; color: #666; font-size: 0.9rem;">"${company.eslogan || ''}"</p>
                </div>
                <div style="display: flex; flex-direction: column; gap: 15px; text-align: left;">
                    <div class="about-item">
                        <h4 style="color: var(--primary-color); margin-bottom: 5px;"><i class="fas fa-info-circle"></i> Acerca de</h4>
                        <p style="font-size: 0.9rem; line-height: 1.4;">${company.descripcion || 'Información no disponible.'}</p>
                    </div>
                    <div class="about-item">
                        <h4 style="color: var(--primary-color); margin-bottom: 5px;"><i class="fab fa-whatsapp"></i> WhatsApp</h4>
                        <p><a href="https://wa.me/${company.telefonowhatsapp}" target="_blank" style="color: inherit; text-decoration: none;">+${company.telefonowhatsapp || '-'}</a></p>
                    </div>
                    ${socialHtml ? `
                    <div class="about-item">
                        <h4 style="color: var(--primary-color); margin-bottom: 10px;"><i class="fas fa-share-alt"></i> Redes Sociales</h4>
                        <div style="display: flex; gap: 20px;">${socialHtml}</div>
                    </div>` : ''}
                </div>`;
        }
        const modal = document.getElementById('about-modal-overlay');
        if (modal) modal.classList.remove('hidden');
    },

    showPolicies: () => {
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const content = document.getElementById('policies-content');
        if (content) {
            content.innerHTML = `
                <div style="max-height: 400px; overflow-y: auto; padding-right: 15px;">
                    <section style="margin-bottom: 20px;">
                        <h4 style="color: var(--primary-color); border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; font-size: 0.9rem;">1. PROTECCIÓN DE DATOS</h4>
                        <p style="font-size: 0.85rem; color: #666; line-height: 1.4;">${company?.nomempresa || 'La empresa'} garantiza que sus datos personales son tratados bajo estrictas medidas de seguridad.</p>
                    </section>
                    <section style="margin-bottom: 20px;">
                        <h4 style="color: var(--primary-color); border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; font-size: 0.9rem;">2. TÉRMINOS COMERCIALES</h4>
                        <p style="font-size: 0.85rem; color: #666; line-height: 1.4;">Toda orden genera un compromiso de servicio. Precios incluyen impuestos.</p>
                    </section>
                    <section>
                        <h4 style="color: var(--primary-color); border-bottom: 2px solid #f0f0f0; padding-bottom: 5px; font-size: 0.9rem;">3. POLÍTICAS PERSONALIZADAS</h4>
                        <p style="font-size: 0.85rem; color: #444; line-height: 1.4; white-space: pre-wrap;">${company?.politicas || 'Políticas base del sistema activas.'}</p>
                    </section>
                </div>`;
        }
        const modal = document.getElementById('policies-modal-overlay');
        if (modal) {
            modal.classList.remove('hidden');
            app.public.startInfoInactivityTimer();
        }
    },

    showReviews: () => {
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const content = document.getElementById('reviews-content');
        if (content) {
            content.innerHTML = `
                <div style="text-align:center; padding:20px;">
                    <h2 style="color:var(--primary-color); margin-bottom:5px;">${company?.nomempresa || 'Negocio'}</h2>
                    <div style="color:gold; font-size:1.5rem; margin-bottom:20px;">
                        <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
                        <span style="color:#666; font-size:1rem; margin-left:10px;">4.8/5</span>
                    </div>
                    <div style="text-align:left; display:flex; flex-direction:column; gap:15px;">
                        <div style="background:#f9f9f9; padding:15px; border-radius:10px; border-left:4px solid var(--primary-color);">
                            <p style="margin:0; font-style:italic; font-size:0.9rem;">"Excelente servicio y calidad en los productos. Altamente recomendados."</p>
                            <small style="display:block; margin-top:5px; color:#888;">- Juan Pérez</small>
                        </div>
                    </div>
                </div>`;
        }
        const modal = document.getElementById('reviews-modal-overlay');
        if (modal) {
            modal.classList.remove('hidden');
            app.public.startInfoInactivityTimer();
        }
    },

    showLocation: () => {
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const content = document.getElementById('location-content');
        if (content && company) {
            const address = company.direccion || "Dirección no disponible.";
            content.innerHTML = `
                <div style="text-align: center;">
                    <div style="background:#eee; height:250px; display:flex; align-items:center; justify-content:center; border-radius:12px; margin-bottom:20px; color:#999; flex-direction:column;">
                        <i class="fas fa-map-marked-alt fa-3x" style="margin-bottom:10px;"></i>
                        <p>[ MAPA INTERACTIVO ]</p>
                        <p style="font-size:0.8rem;">${address}</p>
                    </div>
                    <h3 style="color:var(--primary-color); margin-bottom:5px;">Visítanos en:</h3>
                    <p style="font-size:1.1rem; color:#444;">${address}</p>
                </div>`;
        }
        const modal = document.getElementById('location-modal-overlay');
        if (modal) {
            modal.classList.remove('hidden');
            app.public.startInfoInactivityTimer();
        }
    },

    closeInfoModal: (modalId) => {
        const el = document.getElementById(modalId);
        if (el) el.classList.add('hidden');
        app.public.stopInfoInactivityTimer();
    },

    _infoTimer: null,
    startInfoInactivityTimer: () => {
        app.public.stopInfoInactivityTimer();
        let seconds = 30;
        app.public._infoTimer = setInterval(() => {
            seconds--;
            if (seconds <= 0) {
                app.public.stopInfoInactivityTimer();
                document.querySelectorAll('.modal-overlay').forEach(m => {
                    if (['about-modal-overlay', 'policies-modal-overlay', 'reviews-modal-overlay', 'location-modal-overlay'].includes(m.id)) {
                        m.classList.add('hidden');
                    }
                });
                window.location.hash = '#home';
            }
        }, 1000);

        const resetFn = () => { seconds = 30; };
        document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => {
            m.addEventListener('mousemove', resetFn, { once: true });
            m.addEventListener('click', resetFn, { once: true });
        });
    },

    stopInfoInactivityTimer: () => {
        if (app.public._infoTimer) clearInterval(app.public._infoTimer);
        app.public._infoTimer = null;
    },

    // --- RENDERERS ---
    renderHome: (company) => {
        // Autodetectar modo comida si no está definido (v4.6.8)
        const keywords = ['Alimentos', 'Comida', 'Restaurante', 'Snack', 'Food', 'PFM', 'PMP', 'HMP'];
        const bizType = (company?.tipo_negocio || "").toString();
        const bizId = (app.state.companyId || "").toString().toUpperCase();
        const isFood = app.state.isFood || keywords.some(k => bizType.includes(k) || bizId.includes(k));
        app.state.isFood = isFood; // Persistir para otros módulos
        const sloganEl = document.getElementById('hero-slogan');
        const subEl = document.getElementById('hero-sub');
        const heroBanner = document.getElementById('hero-banner-main');
        const actions = document.getElementById('hero-actions-container');
        const standardFeatures = document.getElementById('standard-features-grid');
        const industrialSeo = document.getElementById('industrial-solutions-seo');
        const foodAreaSpec = document.getElementById('food-app-area');
        const foodTitle = document.getElementById('food-menu-title');
        const foodSubtitle = document.getElementById('food-menu-subtitle');

        if (industrialSeo) industrialSeo.classList.add('hidden');

        if (isFood) {
            const foodHeroUrl = company.hero_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80';
            heroBanner.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.75)), url('${app.utils.fixDriveUrl(foodHeroUrl)}')`;
            heroBanner.style.backgroundAttachment = 'scroll';
            heroBanner.style.display = 'block';

            const sloganText = company.eslogan || "Sabor Premium";
            const subText = company.descripcion || "Excelencia en cada platillo.";
            if (sloganEl) sloganEl.innerText = sloganText;
            if (subEl) subEl.innerText = subText;
            if (foodTitle) foodTitle.innerText = sloganText;
            if (foodSubtitle) foodSubtitle.innerText = subText;

            if (actions) {
                actions.innerHTML = `
                    <button class="btn-support" onclick="app.agents.select('AGT-001')"><i class="fas fa-headset"></i> Atención y Soporte</button>
                `;
            }

            const menuPublic = document.getElementById('menu-public');
            if (menuPublic) {
                menuPublic.innerHTML = `
                    <li><a href="#orbit"><i class="fas fa-planet-ring"></i> Hub</a></li>
                    <li><a href="#home">Inicio</a></li>
                    <li>
                        <a href="#food-app-area" style="background: var(--accent-color); color: #000; padding: 5px 15px; border-radius: 50px; font-weight: bold; display: flex; align-items: center; gap: 5px; text-decoration: none;">
                            <i class="fas fa-utensils"></i> PEDIDO EXPRESS
                        </a>
                    </li>
                    <li><a href="#contact">Contacto</a></li>
                    <li><a href="#login" onclick="app.ui.showLogin(); return false;"><i class="fas fa-user-lock"></i> Staff</a></li>
                `;
            }
            if (standardFeatures) standardFeatures.classList.add('hidden');
            app.public.renderFoodMenu();
        } else {
            const menuPublic = document.getElementById('menu-public');
            if (menuPublic) {
                menuPublic.innerHTML = `
                    <li><a href="#orbit"><i class="fas fa-planet-ring"></i> Hub</a></li>
                    <li><a href="#home">Inicio</a></li>
                    <li><a href="#contact">Contacto</a></li>
                    <li><a href="#login" onclick="app.ui.showLogin(); return false;"><i class="fas fa-user-lock"></i> Staff</a></li>
                `;
            }
            const heroUrl = company.hero_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80';
            heroBanner.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('${app.utils.fixDriveUrl(heroUrl)}')`;
            heroBanner.style.backgroundAttachment = 'fixed';
            if (sloganEl) sloganEl.innerText = company.eslogan || "Soluciones Industriales";
            if (subEl) subEl.innerText = company.descripcion || "Eficiencia y Calidad.";
            if (actions) {
                actions.innerHTML = `
                    <button class="btn-primary" onclick="window.location.hash='#contact'">Cotizar Ahora</button>
                    <button class="btn-support" onclick="app.agents.select('AGT-001')"><i class="fas fa-headset"></i> Atención y Soporte</button>
                `;
            }
            if (standardFeatures) standardFeatures.classList.remove('hidden');
        }

        // Hide monitor for non-food
        const monLinks = document.querySelectorAll('.nav-monitor-link');
        monLinks.forEach(link => {
            link.parentElement.style.display = isFood ? 'block' : 'none';
        });
    },

    renderSEO: () => {
        const container = document.getElementById('industrial-solutions-seo');
        if (!container) return;
        const targetId = String(app.state.companyId || "").trim().toUpperCase();
        const company = app.data.Config_Empresas.find(c => c.id_empresa === targetId);
        const seoData = (app.data.Config_SEO || []).filter(item => String(item.id_empresa || "").trim().toUpperCase() === targetId);

        if (seoData.length === 0) {
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');
        container.style.display = "block";

        // Update Title and Description from company or defaults
        const mainTitle = container.querySelector('h2');
        const mainSub = container.querySelector('p');
        if (mainTitle) mainTitle.innerText = company?.seo_titulo || "Soluciones Especializadas";
        if (mainSub) mainSub.innerText = company?.seo_descripcion || "Nuestra matriz de servicios.";

        let grid = container.querySelector('.seo-grid');
        if (!grid) {
            container.innerHTML += `<div class="seo-grid"></div>`;
            grid = container.querySelector('.seo-grid');
        } else {
            grid.innerHTML = '';
        }

        seoData.sort((a, b) => (parseInt(a.orden) || 99) - (parseInt(b.orden) || 99));

        seoData.forEach(item => {
            const card = document.createElement('div');
            card.className = 'feature-card seo-card-premium';

            const hasPhoto = item.foto_url || item.url_foto || item.imagen_url;
            const bgStyle = hasPhoto ? `background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url('${app.utils.fixDriveUrl(hasPhoto)}'); background-size: cover; background-position: center; color: white; border: none;` : '';

            const keywords = (item.keywords_coma || "").split(',').map(k => k.trim()).filter(k => k);
            const keywordHtml = keywords.map(k => `<span class="seo-tag" style="${hasPhoto ? 'background:rgba(255,255,255,0.2); color:white; border-color:rgba(255,255,255,0.3);' : ''}">${k}</span>`).join('');

            card.style.cssText = bgStyle;
            card.innerHTML = `
                <div class="seo-card-inner">
                    <div class="seo-card-header">
                        <div class="seo-icon" style="${hasPhoto ? 'background:rgba(255,255,255,0.2); border:none;' : ''}">
                            <i class="${item.icono || 'fas fa-shield-alt'}"></i>
                        </div>
                        <div class="seo-title-group">
                            <h4 style="${hasPhoto ? 'color:white; text-shadow:0 2px 4px rgba(0,0,0,0.5);' : ''}">${item.titulo}</h4>
                            <small style="${hasPhoto ? 'color:rgba(255,255,255,0.8);' : ''}">${item.division || item.categoria || 'Servicio'}</small>
                        </div>
                    </div>
                    <p class="seo-desc" style="${hasPhoto ? 'color:rgba(255,255,255,0.9); font-size:0.8rem; margin:10px 0;' : 'display:none;'}">${item.descripcion || ''}</p>
                    <div class="seo-tags">${keywordHtml}</div>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    renderFoodMenu: () => {
        const container = document.getElementById('food-menu-grid');
        const tabsContainer = document.getElementById('food-category-tabs');
        const searchInput = document.getElementById('food-search-input');
        if (!container) return;

        const render = (searchTerm = "") => {
            container.innerHTML = '';
            if (tabsContainer) tabsContainer.innerHTML = '';
            let items = (app.data.Catalogo || []).filter(p => {
                const pCo = (p.id_empresa || "").toString().trim().toUpperCase();
                const sCo = (app.state.companyId || "").toString().trim().toUpperCase();
                const isActive = p.activo === true || p.activo === "TRUE" || p.activo === "1" || p.activo === 1;
                const matchesSearch = !searchTerm || p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
                return (pCo === sCo || pCo === "GLOBAL") && isActive && matchesSearch;
            });

            if (items.length === 0) {
                container.innerHTML = `<div class="empty-msg">No hay productos.</div>`;
                return;
            }

            const categories = {};
            items.forEach(p => {
                const cat = (p.categoria || "General").trim();
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(p);
            });

            Object.keys(categories).forEach(catName => {
                if (tabsContainer) {
                    const tab = document.createElement('div');
                    tab.className = 'food-tab';
                    tab.innerText = catName;
                    tab.onclick = () => document.getElementById(`cat-${catName}`).scrollIntoView({ behavior: 'smooth' });
                    tabsContainer.appendChild(tab);
                }
                const section = document.createElement('div');
                section.id = `cat-${catName}`;
                section.className = 'food-category-section';
                section.innerHTML = `<h3 class="food-category-title">${catName}</h3><div class="food-grid"></div>`;
                const grid = section.querySelector('.food-grid');

                categories[catName].forEach(p => {
                    const card = document.createElement('div');
                    card.className = 'food-card';
                    const img = p.imagen_url ? app.utils.fixDriveUrl(p.imagen_url) : 'https://docs.google.com/uc?export=view&id=1t6BmvpGTCR6-OZ3Nnx-yOmpohe5eCKvv';
                    const price = app.utils.getEffectivePrice(p);
                    const stock = parseInt(p.stock) || 0;

                    card.innerHTML = `
                        <div class="food-img-container">
                            <img src="${img}" alt="${p.nombre}" class="food-img">
                            <div class="stock-badge" style="background:${stock <= 5 ? '#f44' : '#27ae60'}">${stock} DISP.</div>
                        </div>
                        <div class="food-info">
                            <div class="food-title-row">
                                <h3>${p.nombre}</h3>
                                <div class="price">$${price}</div>
                            </div>
                            <p class="food-desc">${p.descripcion || ''}</p>
                            <div class="food-actions">
                                <button onclick="app.pos.removeFromCart('${p.id_producto}')"><i class="fas fa-minus"></i></button>
                                <span class="food-qty" id="qty-${p.id_producto}">${app.state.cart.find(i => i.id === p.id_producto)?.qty || 0}</span>
                                <button onclick="app.pos.addToCart('${p.id_producto}')"><i class="fas fa-plus"></i></button>
                            </div>
                        </div>`;
                    grid.appendChild(card);
                });
                container.appendChild(section);
            });
            app.pos.updateCartVisuals();
        };
        render();
        if (searchInput) searchInput.oninput = (e) => render(e.target.value);
    },

    renderOrbit: () => {
        const container = document.getElementById('orbit-bubbles');
        if (!container) return;
        container.innerHTML = '';
        const companies = app.data.Config_Empresas || [];
        const priorityId = app.state.companyId;

        const bubbles = [];
        const width = window.innerWidth;
        const height = window.innerHeight;

        if (app.public._orbitRAF) cancelAnimationFrame(app.public._orbitRAF);

        companies.forEach((co) => {
            const isPriority = co.id_empresa === priorityId;
            const size = isPriority ? 300 : 160;
            const radius = size / 2;

            const bubbleEl = document.createElement('div');
            bubbleEl.className = `enterprise-bubble ${isPriority ? 'priority' : 'shaded'}`;
            // Desactiva animaciones CSS para usar física JS y corregir solapamiento
            bubbleEl.style.cssText = `width:${size}px; height:${size}px; --accent-color:${co.color_tema || '#00d2ff'}; position:absolute; animation:none; transform:none; transition:none;`;

            bubbleEl.innerHTML = `
                <img src="${app.utils.fixDriveUrl(co.logo_url)}" class="bubble-logo">
                <span class="bubble-name" style="font-size:${isPriority ? '1.1rem' : '0.8rem'}">${co.nomempresa}</span>
            `;
            bubbleEl.onclick = () => app.switchCompany(co.id_empresa);
            container.appendChild(bubbleEl);

            bubbles.push({
                el: bubbleEl,
                x: Math.random() * (width - size),
                y: Math.random() * (height - height * 0.2), // Inicia un poco disperso
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: radius,
                size: size
            });
        });

        const update = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            bubbles.forEach((b1, i) => {
                b1.x += b1.vx;
                b1.y += b1.vy;

                // Límites de pantalla (Rebote)
                if (b1.x <= 0) { b1.x = 0; b1.vx *= -1; }
                if (b1.x + b1.size >= w) { b1.x = w - b1.size; b1.vx *= -1; }
                if (b1.y <= 0) { b1.y = 0; b1.vy *= -1; }
                if (b1.y + b1.size >= h) { b1.y = h - b1.size; b1.vy *= -1; }

                // Atracción suave al centro para mantener el efecto "Hub"
                const targetX = w / 2 - b1.radius;
                const targetY = h / 2 - b1.radius;
                b1.vx += (targetX - b1.x) * 0.00003;
                b1.vy += (targetY - b1.y) * 0.00003;

                // Colisión entre burbujas
                for (let j = i + 1; j < bubbles.length; j++) {
                    const b2 = bubbles[j];
                    const dx = (b2.x + b2.radius) - (b1.x + b1.radius);
                    const dy = (b2.y + b2.radius) - (b1.y + b1.radius);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const minDist = b1.radius + b2.radius;

                    if (distance < minDist) {
                        const angle = Math.atan2(dy, dx);
                        const sin = Math.sin(angle);
                        const cos = Math.cos(angle);

                        // Rebote elástico
                        const vx1 = b1.vx * cos + b1.vy * sin;
                        const vy1 = b1.vy * cos - b1.vx * sin;
                        const vx2 = b2.vx * cos + b2.vy * sin;
                        const vy2 = b2.vy * cos - b2.vx * sin;

                        const vx1Final = vx2;
                        const vx2Final = vx1;

                        b1.vx = vx1Final * cos - vy1 * sin;
                        b1.vy = vy1 * cos + vx1Final * sin;
                        b2.vx = vx2Final * cos - vy2 * sin;
                        b2.vy = vy2 * cos + vx2Final * sin;

                        // Separación inmediata para evitar que se peguen
                        const overlap = minDist - distance;
                        b1.x -= cos * overlap / 2;
                        b1.y -= sin * overlap / 2;
                        b2.x += cos * overlap / 2;
                        b2.y += sin * overlap / 2;
                    }
                }

                b1.el.style.left = `${b1.x}px`;
                b1.el.style.top = `${b1.y}px`;
            });

            if (window.location.hash === '#orbit') {
                app.public._orbitRAF = requestAnimationFrame(update);
            }
        };

        app.public._orbitRAF = requestAnimationFrame(update);
    },

    renderFooter: (company) => {
        const container = document.getElementById('footer-links-container');
        if (!container) return;

        // 1. Social Media Logic (Official Colors)
        let socialHtml = '';
        if (company.rsface) socialHtml += `<a href="${company.rsface}" target="_blank" class="social-icon facebook"><i class="fab fa-facebook-f"></i></a>`;
        if (company.rsinsta) socialHtml += `<a href="${company.rsinsta}" target="_blank" class="social-icon instagram"><i class="fab fa-instagram"></i></a>`;
        if (company.rstik) socialHtml += `<a href="${company.rstik}" target="_blank" class="social-icon tiktok"><i class="fab fa-tiktok"></i></a>`;

        container.innerHTML = `
            <!-- Copyright -->
            <div class="footer-copyright" id="footer-copy">
                © 2026 ${company.nomempresa} | ${company.id_empresa}
            </div>

            <!-- Navigation Links -->
            <div class="footer-links">
                <a class="btn-link" onclick="window.location.hash='#contact'">Contáctanos</a>
                <a class="btn-link" onclick="app.public.showReviews()">Opiniones</a>
                <a class="btn-link" onclick="window.location.hash='#pillars'">Pilares</a>
                <a class="btn-link" onclick="app.public.showAboutUs()">Nosotros</a>
                <a class="btn-link" onclick="app.public.showPolicies()">Políticas</a>
                <a class="btn-link" onclick="app.public.showLocation()">Ubicación</a>
            </div>

            <!-- Social Media -->
            <div class="footer-social">
                ${socialHtml}
            </div>
        `;

        // Update WhatsApp Floating
        const btn = document.getElementById('whatsapp-float');
        if (btn && company.telefonowhatsapp) btn.href = `https://wa.me/${company.telefonowhatsapp}`;
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
                <p>${p.text || 'Pendiente.'}</p>
            </div>`).join('');
    },

    renderGallery: () => {
        const grid = document.getElementById('company-gallery-grid');
        if (!grid) return;
        const imgs = (app.data.Config_Galeria || []).filter(img => img.id_empresa === app.state.companyId);
        if (imgs.length === 0) {
            grid.innerHTML = '<p class="empty-msg">Próximamente fotos exclusivas.</p>';
            return;
        }
        grid.innerHTML = imgs.map(img => `
            <div class="gallery-item">
                <img src="${img.url_imagen}" alt="${img.titulo}" class="gallery-img">
                <div class="gallery-info"><h4>${img.titulo || 'Item'}</h4></div>
            </div>`).join('');
    },

    toggleMobileTicket: (show) => {
        const sidebar = document.getElementById('pos-ticket-sidebar');
        if (sidebar) sidebar.classList.toggle('mobile-active', show);
    }
};
