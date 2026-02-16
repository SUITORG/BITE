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
                    <p style="font-style: italic; color: #666; font-size: 0.9rem;">"${company.slogan || ''}"</p>
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
            const mapUrl = company.ubicacion_url || "";

            let mapIframe = `<div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); height:250px; display:flex; align-items:center; justify-content:center; border-radius:12px; margin-bottom:20px; color:#adb5bd; flex-direction:column; border: 1px solid #dee2e6;">
                                <i class="fas fa-map-marked-alt fa-3x" style="margin-bottom:15px; color: var(--accent-color);"></i>
                                <p style="font-weight:700; color:#495057;">Mapa Interactivo</p>
                                <p style="font-size:0.8rem; padding: 0 40px; text-align: center; line-height: 1.4;">Para ver el mapa interactivo aquí, usa el enlace de "Insertar Mapa" (Embed) de Google Maps.</p>
                             </div>`;

            if (mapUrl.includes('google.com/maps/embed') || mapUrl.includes('https://www.google.com/maps/embed')) {
                mapIframe = `<iframe 
                    src="${mapUrl}" 
                    width="100%" height="350" style="border:0; border-radius:12px; margin-bottom:20px;" 
                    allowfullscreen="" loading="lazy"></iframe>`;
            }

            content.innerHTML = `
                <div style="text-align: center;">
                    ${mapIframe}
                    <h3 style="color:var(--primary-color); margin-bottom:5px;">Visítanos en:</h3>
                    <p style="font-size:1.1rem; color:#444; margin-bottom:20px; line-height: 1.5;">${address}</p>
                    <a href="${mapUrl}" target="_blank" class="btn-primary" style="display:inline-block; text-decoration:none; padding:12px 25px; font-size:1rem; border-radius: 50px;">
                        <i class="fas fa-map-marker-alt"></i> Abrir en Google Maps
                    </a>
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
    renderHome: (companyData) => {
        const urlId = (app.state.companyId || "").toString().trim().toUpperCase();
        const company = companyData || app.data.Config_Empresas.find(c => c.id_empresa === urlId);

        if (!company) return console.error("[RENDER_HOME] No company data found for ID:", urlId);

        // Autodetectar modo comida (v5.0.3 Fix: UI restoration)
        const keywords = ['Alimentos', 'Comida', 'Restaurante', 'Snack', 'Food', 'PFM', 'PMP', 'HMP'];
        const bizType = (company.tipo_negocio || "").toString();
        const bizId = urlId;
        const isFood = keywords.some(k => bizType.includes(k) || bizId.includes(k));
        app.state.isFood = isFood;

        const sloganEl = document.getElementById('hero-slogan');
        const subEl = document.getElementById('hero-sub');
        const heroBanner = document.getElementById('hero-banner-main');
        const actions = document.getElementById('hero-actions-container');
        const standardFeatures = document.getElementById('standard-features-grid');
        const industrialSeo = document.getElementById('seo-matrix-section');
        const foodAreaSpec = document.getElementById('food-app-area');
        const foodTitle = document.getElementById('food-menu-title');
        const foodSubtitle = document.getElementById('food-menu-subtitle');
        const menuPublic = document.getElementById('menu-public');
        if (menuPublic) {
            menuPublic.classList.remove('hub-active');
        }

        // Forzar visibilidad y reset de clases (v5.0.3 Security Fix)
        if (heroBanner) {
            heroBanner.classList.remove('hidden');
            heroBanner.style.display = 'block';
        }

        const showForm = company.formulario === 'TRUE' || company.formulario === true;

        if (isFood) {
            // Prioridad: foto_agente reemplaza al fondo (Hero) si existe, según solicitud del usuario.
            const bgUrl = company.foto_agente || company.hero_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80';

            // Ajustamos el gradiente para asegurar legibilidad del texto sobre cualquier foto
            heroBanner.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.85)), url('${app.utils.fixDriveUrl(bgUrl)}')`;
            heroBanner.style.backgroundAttachment = 'scroll';
            heroBanner.style.backgroundPosition = 'center center';
            heroBanner.style.backgroundSize = 'cover';
            heroBanner.style.backgroundRepeat = 'no-repeat';
            heroBanner.style.display = 'block';

            const sloganText = company.slogan || "Sabor Premium";
            const subText = company.mensaje1 || company.descripcion || "Excelencia en cada platillo.";
            const extraText = company.mensaje2 || "";
            const extraEl = document.getElementById('hero-extra-msg');

            if (sloganEl) sloganEl.innerText = sloganText;
            if (subEl) subEl.innerText = subText;
            if (extraEl) {
                extraEl.innerText = extraText;
                extraEl.classList.toggle('hidden', !extraText);
            }
            if (heroBanner) heroBanner.classList.add('reduced');

            if (foodTitle) foodTitle.innerText = sloganText;
            if (foodSubtitle) foodSubtitle.innerText = subText;

            if (actions) {
                const showSupport = company.usa_soporte_ia === 'TRUE' || company.usa_soporte_ia === true;
                actions.innerHTML = showSupport ? `
                    <button class="btn-support" onclick="app.agents.select('AGT-001')">
                        <i class="fas fa-headset"></i> Atención y Soporte
                    </button>
                ` : '';
            }

            if (menuPublic) {
                menuPublic.innerHTML = `
                    <li><a href="#orbit"><i class="fas fa-planet-ring"></i> Hub</a></li>
                    <li><a href="#home">Inicio</a></li>
                    <li>
                        <a href="#food-app-area" class="btn-express-nav-special" style="background: var(--accent-color); color: #000; padding: 5px 15px; border-radius: 50px; font-weight: bold; display: flex; align-items: center; gap: 5px; text-decoration: none;">
                            <i class="fas fa-utensils"></i> Pedido Express
                        </a>
                    </li>
                    ${showForm ? `<li><a href="#contact">Contacto</a></li>` : ''}
                    <li><a class="nav-login-btn" href="#login"><i class="fas fa-user-lock"></i> Staff</a></li>
                `;
            }

            // v5.0.3: No ocultar la landing (standardFeatures) para food businesses si el usuario quiere mantenerla.
            if (standardFeatures) standardFeatures.classList.remove('hidden');
            app.public.renderFoodMenu();
        } else {
            if (menuPublic) {
                menuPublic.innerHTML = `
                    <li><a href="#orbit"><i class="fas fa-planet-ring"></i> Hub</a></li>
                    <li><a href="#home">Inicio</a></li>
                    ${showForm ? `<li><a href="#contact">Contacto</a></li>` : ''}
                    <li><a class="nav-login-btn" href="#login"><i class="fas fa-user-lock"></i> Staff</a></li>
                `;
            }

            const heroUrl = company.hero_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80';
            heroBanner.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('${app.utils.fixDriveUrl(heroUrl)}')`;
            heroBanner.style.backgroundAttachment = 'fixed';
            if (heroBanner) heroBanner.classList.remove('reduced');
            const extraEl = document.getElementById('hero-extra-msg');
            if (extraEl) extraEl.classList.add('hidden');
            if (sloganEl) sloganEl.innerText = company.slogan || "Soluciones Industriales";
            if (subEl) subEl.innerText = company.mensaje1 || company.descripcion || "Eficiencia y Calidad.";
            if (actions) {
                const showSupport = company.usa_soporte_ia === 'TRUE' || company.usa_soporte_ia === true;
                actions.innerHTML = `
                    <button class="btn-primary" onclick="window.location.hash='#contact'">Cotizar Ahora</button>
                    ${showSupport ? `<button class="btn-support" onclick="app.agents.select('AGT-001')"><i class="fas fa-headset"></i> Atención y Soporte</button>` : ''}
                `;
            }
            if (standardFeatures) standardFeatures.classList.remove('hidden');
        }

        // Asegurar visibilidad de secciones críticas (v5.0.3)
        if (industrialSeo) {
            industrialSeo.classList.remove('hidden');
            industrialSeo.style.display = 'block';
        }

        // Forzar visibilidad de la sección Home en el router si el hash es correcto
        const homeSection = document.getElementById('view-home');
        if (homeSection && window.location.hash === '#home') {
            homeSection.classList.remove('hidden');
        }

        // Hide monitor for non-food
        const monLinks = document.querySelectorAll('.nav-monitor-link');
        monLinks.forEach(link => {
            link.parentElement.style.display = isFood ? 'block' : 'none';
        });
    },

    renderSEO: () => {
        const container = document.getElementById('seo-matrix-section');
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

        const mainTitle = container.querySelector('h2');
        const mainSub = container.querySelector('p');
        if (mainTitle) mainTitle.style.display = 'none';
        if (mainSub) mainSub.style.display = 'none';


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
                    const promo = (p.etiqueta_promo || "").toString().trim();

                    card.innerHTML = `
                        <div class="food-img-container">
                            ${promo ? `<div class="promo-ribbon" style="position:absolute; top:10px; left:-5px; background:#f39c12; color:white; padding:2px 10px; font-size:0.6rem; font-weight:bold; z-index:2; border-radius:0 10px 10px 0; box-shadow: 2px 2px 4px rgba(0,0,0,0.2);">${promo}</div>` : ''}
                            <img src="${img}" alt="${p.nombre}" class="food-img">
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
            const size = isPriority ? 250 : 136;
            const radius = size / 2;

            const bubbleEl = document.createElement('div');
            bubbleEl.className = `enterprise-bubble ${isPriority ? 'priority' : 'shaded'}`;
            const themeColor = co.color_tema || '#00d2ff';
            const gradient = `radial-gradient(circle at 30% 30%, ${themeColor}, #000)`;

            bubbleEl.style.cssText = `width:${size}px; height:${size}px; --accent-color:${themeColor}; background:${gradient}; position:absolute; animation:none; transform:none; transition:none; box-shadow: 0 10px 30px rgba(0,0,0,0.5);`;


            const bubbleImg = co.logo_url || co.url_logo || co.foto_agente || '';
            bubbleEl.innerHTML = `
                <img src="${bubbleImg ? app.utils.fixDriveUrl(bubbleImg) : ''}" class="bubble-logo" 
                     onerror="this.src='https://docs.google.com/uc?export=view&id=1t6BmvpGTCR6-OZ3Nnx-yOmpohe5eCKvv'">
                <span class="bubble-name" style="font-size:${isPriority ? '0.95rem' : '0.75rem'}">${co.nomempresa}</span>
            `;

            bubbleEl.onclick = () => app.switchCompany(co.id_empresa);
            container.appendChild(bubbleEl);

            bubbles.push({
                el: bubbleEl,
                x: Math.random() * (width - size),
                y: Math.random() * (height - height * 0.2),
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                radius: radius,
                size: size
            });
        });

        // --- ACTUALIZACIÓN MENÚ HUB (Inyectar Inquilinos) ---
        const menuPublic = document.getElementById('menu-public');
        if (menuPublic) {
            menuPublic.classList.add('hub-active');
            menuPublic.innerHTML = `
                <li style="padding: 10px 15px; font-weight: 800; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.2); margin-bottom: 10px; font-size: 0.8rem; letter-spacing: 1px;">
                    <i class="fas fa-planet-ring"></i> DIRECTORIO HUB
                </li>
            ` + companies.map(co => `
                <li>
                    <a href="javascript:void(0)" onclick="app.switchCompany('${co.id_empresa}')">
                        <i class="fas fa-chevron-right" style="font-size: 0.7rem; opacity: 0.5;"></i> ${co.nomempresa}
                    </a>
                </li>
            `).join('') + `
                <li style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <a href="#login" onclick="app.ui.showLogin(); return false;">
                        <i class="fas fa-user-lock"></i> Staff Login
                    </a>
                </li>
            `;
        }

        const update = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;

            bubbles.forEach((b1, i) => {
                b1.x += b1.vx;
                b1.y += b1.vy;

                if (b1.x <= 0) { b1.x = 0; b1.vx *= -1; }
                if (b1.x + b1.size >= w) { b1.x = w - b1.size; b1.vx *= -1; }
                if (b1.y <= 0) { b1.y = 0; b1.vy *= -1; }
                if (b1.y + b1.size >= h) { b1.y = h - b1.size; b1.vy *= -1; }

                const targetX = w / 2 - b1.radius;
                const targetY = h / 2 - b1.radius;
                b1.vx += (targetX - b1.x) * 0.00003;
                b1.vy += (targetY - b1.y) * 0.00003;

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
        const footerCopy = document.getElementById('footer-copy');
        if (footerCopy) {
            footerCopy.innerHTML = `&copy; ${new Date().getFullYear()} ${company.nomempresa}. Todos los derechos reservados. | ${company.id_empresa}`;
        }

        const container = document.getElementById('footer-links-container');
        if (!container) return;

        let socialHtml = '';
        if (company.rsface) socialHtml += `<a href="${company.rsface}" target="_blank" class="social-icon facebook" title="Facebook"><i class="fab fa-facebook-f"></i></a>`;
        if (company.rsinsta) socialHtml += `<a href="${company.rsinsta}" target="_blank" class="social-icon instagram" title="Instagram"><i class="fab fa-instagram"></i></a>`;
        if (company.rstik) socialHtml += `<a href="${company.rstik}" target="_blank" class="social-icon tiktok" title="TikTok"><i class="fab fa-tiktok"></i></a>`;

        const showForm = company.formulario === 'TRUE' || company.formulario === true;

        container.innerHTML = `
            <div class="footer-links-sub">
                <a class="btn-link" onclick="app.public.showLocation()">Ubicación</a>
                <a class="btn-link" onclick="app.public.showReviews()">Opiniones</a>
                <a class="btn-link" onclick="window.location.hash='#pillars'">Pilares</a>
                <a class="btn-link" onclick="app.public.showAboutUs()">Nosotros</a>
                <a class="btn-link" onclick="app.public.showPolicies()">Políticas</a>
                ${showForm ? `<a class="btn-link" onclick="window.location.hash='#contact'">Contáctanos</a>` : ''}
            </div>

            <div class="footer-social">
                ${socialHtml}
            </div>
        `;

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
                <img src="${app.utils.fixDriveUrl(img.url_imagen || img.imagen_url)}" alt="${img.titulo}" class="gallery-img">
                <div class="gallery-info"><h4>${img.titulo || 'Item'}</h4></div>
            </div>`).join('');
    },

    toggleMobileTicket: (show) => {
        const sidebar = document.getElementById('pos-ticket-sidebar');
        if (sidebar) sidebar.classList.toggle('mobile-active', show);
    },

    renderContact: () => {
        const container = document.getElementById('view-contact');
        if (!container) return;

        const urlId = (app.state.companyId || "").toString().trim().toUpperCase();
        const company = app.data.Config_Empresas.find(c => c.id_empresa === urlId);
        if (!company) return;

        const showForm = (company.formulario || "").toString().toUpperCase() === 'TRUE';
        const needsBilling = (company.Facturacion || "").toString().toUpperCase() === 'TRUE';
        const needsInvoice = (company.factura || "").toString().toUpperCase() === 'TRUE';
        const finalBilling = needsBilling || needsInvoice;

        if (!showForm) {
            container.innerHTML = `<div class="form-container" style="text-align:center; padding:50px;">
                <i class="fas fa-comment-slash fa-3x" style="color:#ccc; margin-bottom:20px;"></i>
                <h2>Contacto Desactivado</h2>
                <p>Por el momento este negocio no recibe solicitudes vía formulario.</p>
                <button class="btn-primary" onclick="window.location.hash='#home'">Volver al Inicio</button>
            </div>`;
            return;
        }

        container.innerHTML = `
            <div class="form-container">
                <h2>Contáctanos</h2>
                <p>Déjanos tus datos y un asesor se comunicará contigo.</p>
                <form id="public-lead-form">
                    <div class="form-group">
                        <label>Teléfono / WhatsApp *</label>
                        <input type="tel" id="lead-phone" required placeholder="Ej: 521...">
                    </div>
                    <div class="form-group">
                        <label>Nombre Completo *</label>
                        <input type="text" id="lead-name" required>
                    </div>
                    <div class="form-group">
                        <label>Correo Electrónico</label>
                        <input type="email" id="lead-email">
                    </div>
                    <div class="form-group">
                        <label>Dirección *</label>
                        <input type="text" id="lead-address" required placeholder="Calle, Número, Colonia..." autocomplete="off">
                    </div>
                    
                    ${finalBilling ? `
                    <div id="billing-fields" style="background: rgba(0, 210, 255, 0.05); padding: 15px; border-radius: 12px; border: 1px dashed var(--primary-color); margin: 20px 0;">
                        <h4 style="margin-top:0; color:var(--primary-color); font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; margin-bottom:15px;">
                            <i class="fas fa-file-invoice"></i> Datos de Facturación (Opcional)
                        </h4>
                        <div class="form-group">
                            <label>RFC / Tax ID</label>
                            <input type="text" id="lead-rfc" placeholder="RFC123456789">
                        </div>
                        <div class="form-group">
                            <label>Nombre del Negocio</label>
                            <input type="text" id="lead-business" placeholder="Nombre Comercial o Fiscal">
                        </div>
                        <div class="form-group">
                            <label>Dirección Comercial</label>
                            <input type="text" id="lead-billing-address" placeholder="Calle, Número, CP, Ciudad">
                        </div>
                    </div>
                    ` : ''}

                    <div id="contact-msg" class="success-msg hidden" style="margin-bottom:15px; text-align:center; color:var(--primary-color); font-weight:bold;"></div>
                    <button type="submit" class="btn-primary w-100" id="btn-submit-contact">
                        Enviar Información <i class="fas fa-paper-plane" style="margin-left:8px;"></i>
                    </button>
                </form>
            </div>
        `;

        // --- Lógica de Auto-rellenado (v5.2.4) ---
        const elPhone = document.getElementById('lead-phone');
        if (elPhone) {
            elPhone.addEventListener('blur', () => {
                const phone = elPhone.value.trim();
                if (phone.length < 8) return;

                const existing = (app.data.Leads || []).find(l =>
                    (l.telefono || "").toString().includes(phone) &&
                    (l.id_empresa || "").toString().toUpperCase() === urlId
                );

                if (existing) {
                    console.log("[CRM] Cliente existente encontrado, auto-rellenando...");
                    const elName = document.getElementById('lead-name');
                    const elEmail = document.getElementById('lead-email');
                    const elAddr = document.getElementById('lead-address');
                    const elRfc = document.getElementById('lead-rfc');
                    const elBiz = document.getElementById('lead-business');
                    const elBillDir = document.getElementById('lead-billing-address');

                    if (elName) elName.value = existing.nombre || '';
                    if (elEmail) elEmail.value = existing.email || '';
                    if (elAddr) elAddr.value = existing.direccion || '';
                    if (elRfc) elRfc.value = existing.rfc || '';
                    if (elBiz) elBiz.value = existing.negocio || '';
                    if (elBillDir) elBillDir.value = existing.direccion_comercial || '';

                    // Notificar visualmente
                    const msg = document.getElementById('contact-msg');
                    if (msg) {
                        msg.innerText = "¡Bienvenido de nuevo! Hemos cargado tus datos.";
                        msg.classList.remove('hidden');
                        setTimeout(() => msg.classList.add('hidden'), 3000);
                    }
                }
            });
        }

        // Re-bind el evento ya que el DOM del form cambió
        const publicLeadForm = document.getElementById('public-lead-form');
        if (publicLeadForm) {
            publicLeadForm.onsubmit = async (e) => {
                e.preventDefault();
                if (app.events && app.events._handlePublicLead) app.events._handlePublicLead(e);
            };
        }
    }
};
