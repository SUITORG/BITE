# 🗺️ Roadmap & Auditoría de Proyecto

## 📖 Guía de Uso
Este archivo es tu **Centro de Comando**. Úsalo para controlar el avance del proyecto.

*   **Marcar como Hecho:** Cambia `[ ]` por `[x]`.
*   **Pendiente:** Mantén el `[ ]` vacío.
*   **Nueva Tarea:** Añade una línea con guión `- [ ] Nueva función...`
*   **Notas:** Puedes escribir comentarios debajo de cada ítem si algo "está incompleto" o falla.

Este documento rastrea el cumplimiento de las reglas fundamentales y la visión del proyecto.

## 🏗️ Arquitectura de Software (v4.8.7 Responsive+)
- [x] **v4.8.7: Mobile UI Optimization (Glass+)**: Implementation of fixed bottom bar for checkout, glassmorphism mobile menu (75% width), and enhanced touch targets (>48px).
- [x] **v4.8.6: Accounting Integrity Restoration**: Restored dual-writing protocol to Pagos and Proyectos_Pagos. Immutable Rule #18 implemented.
- [x] **v4.8.5: Report Consolidation & Payment Fix**: New report engine that merges Proyectos and Pagos for 100% visibility. Interface selector fix for Card/Transfer payments in POS.
- [x] **v4.7.5: POS Integrity & RBAC Omnidirectional**: Robust contact data rendering, omnidirectional status flow for staff, and optimized UX auditory feedback.
- [x] **v4.7.0: Catalog CRUD & Sequential IDs**: Full product management with sequential IDs (`PROD-XX`), logical delete, and granular RBAC (`catalog_add`, `edit`, `delete`, `stock`).
- [x] **v4.6.9: Premium Branding & UX Guard**: Full implementation of `estandar-landing`, institutional footer, dynamic tenant SEO injection (Suit.Org/Suit.Bite) and **Responsive Mobile Navigation (Burger Menu)**.

- [x] **v4.6.8: Stable Sync**: Re-auditoría completa de líneas (9,035) y consolidación final.
- [x] **v4.6.7: Public Module Consolidation**: Modularización total de la landing page, SEO y menús públicos en `public.js`.
- [x] **v4.6.6: Autoridad Local (Shield 2min)**: Bloqueo de reversión de estatus autoritativo durante 120s para compensar latencia de Google Sheets.
- [x] **v4.6.5: Protocolo de Blindaje por Tablas**: Sincronización atómica basada en timestamps y persistencia total en `localStorage` (Adiós a las reversiones visuales).
- [x] **Modularización del Frontend:** División de `app.js` (>5k líneas) en módulos específicos.
    - [x] `js/modules/core.js`: Núcleo y Estado.
    - [x] `js/modules/auth.js`: Seguridad y Créditos.
    - [x] `js/modules/ui.js`: Renderizado de Interfaz.
    - [x] `js/modules/pos.js`: Motor de Venta y Carrito.
    - [x] `js/modules/agents.js`: Inteligencia Artificial.
    - [x] `js/modules/router.js`: Navegación.

## 📋 Reglas Fundamentales (Core Constraints)

1.  **Tecnología**
    - [x] **HTML/CSS/JS Puro:** Sin frameworks (React, Angular, etc.). Código ligero y mantenible.
    
2.  **Backend & Persistencia**
    - [x] **Google Sheets:** Base de datos exclusiva.
    - [x] **Apps Script:** API personalizada con protección de concurrencia (`LockService`).

3.  **Arquitectura de Datos**
    - [x] **Multi-Tenant:** Estructura preparada para múltiples empresas (`Config_Empresas`).
    - [x] **IDs Secuenciales:** Algoritmo O(1) para `LEAD-1`, `PROJ-1`, y `PROD-01` (v4.7.0).
    - [x] **Integridad:** Validaciones para evitar IDs duplicados.

4.  **Seguridad y Roles**
    - [x] **Control de Acceso:** Login modal para Staff vs Landing pública.
    - [x] **Roles:** Sistema jerárquico (ADMIN, VENTAS, DIOS).
    - [x] **Modo DIOS:** Superusuario con créditos infinitos y acceso total.

5.  **Seguridad Avanzada (v3.3.8)**
    - [x] **Blindaje de API Tokens:** Todas las peticiones al backend requieren firma de token.
    - [x] **Protección de Secretos:** Eliminación de API Keys del código fuente.
    - [x] **Filtrado Multi-Tenant Estricto (v4.2.0):** Privacidad absoluta entre empresas mediante Server-Side Filtering y reglas de negocio obligatorias.
    - [x] **Integridad de Checkout y Caja:** Flujo 100% libre de errores y atómico (v4.2.0).
    - [x] **Modo Hub Nativo (Orbit):** Carga inicial limpia sin forzar empresa default.
    - [x] **Matriz SEO Dinámica:** Renderizado agnóstico (renderSEO) para cualquier inquilino.

5.  **Reglas de Negocio**
    - [x] **Sistema de Créditos:** Consumo por acciones (crear lead, etc.).
    - [x ] **Auto-Logoff:** Timeout de seguridad por inactividad.
            hacer el auto-logoff a las 120 segundos de inactividad.
- [ ] **Protocolo de Salud Operativa (Pendiente):**
    - [ ] **Pulso de Sincronización (Heartbeat):** Implementar refresco automático de datos (cada 30-60s) en monitores críticos (POS/Monitor) para evitar datos obsoletos sin recargar la página.
    - [ ] **Gestión de Sesiones por Rol:** Diferenciar tiempos de inactividad (Staff: Sesión persistente / Clientes: Expira tras 60 min) para proteger integridad de stock y carritos.
    - [ ] **Detección de Datos Caducos (Stale Data):** Validar frescura del cache antes de procesar pagos si el usuario regresa después de un tiempo prolongado de inactividad.
## 🎨 Experiencia de Usuario (UX/UI)

6.  **Diseño Visual**
    - [x] **Tema:** Eco-Friendly / Solar (Paleta de verdes y oscuros).
    - [x] **Estilo:** Glassmorphism, sombras suaves y transiciones.
    - [x] **"Wow Factor":** Animaciones de carga e interacciones fluidas.

7.  **Responsividad**
    - [x] **Móvil:** Tablas adaptables y modales funcionales en pantallas pequeñas.

## 🚀 Módulos Funcionales

8.  **Gestión de Leads**
    - [x] **Creación:** Formulario con datos de contacto y origen.
    - [x] **Gestión:** Listado visual y opción de eliminación (Gated x Nivel 10).

9.  **Gestión de Proyectos**
    - [x] **Flujo:** Creación vinculada a Clientes (Leads).
    - [x] **Temperatura:** Seguimiento dinámico por pesos porcentuales (v2.7.0).
    - [x] **Bitácora:** Registro de eventos y progreso manual.

10. **Catálogo**
    - [x] **Visualización:** Grid de productos/servicios con ribbons de oferta.
    - [x] **Seguridad:** CRUD completo con permisos granulares (RBAC v4.7.0).
    - [ ] **Optimización de Renderizado (v4.7.5):** Implementación de Debouncing, Carga Selectiva y actualización quirúrgica del DOM (Pendiente).

11. **Core & UX**
    - [x] **Estandar CRUD:** Operaciones con soporte exportación PDF/VTS.
    - [x] **estandar-barra-st:** Monitoreo visual técnico del sistema.
    - [x] **Seguridad UX:** Botones de "Volver" obligatorios en modales.
    - [x] **Agentes IA:** Integración estable con Gemini 2.0 Flash.

- [x] **Checkout Express (Público):** Refinar estabilidad del flujo de 3 pasos, integración de WhatsApp y visualización de ticket estilo térmico.
    - [x] **Cargo por Envío Dinámico (v3.4.0):** Implementación de selector de método (Recoger/Domicilio) con cargo configurable desde `Config_Empresas`.
- [ ] **Asistente IA Premium (Voice & Function Calling):**
    - [ ] **Interacción por Voz:** Soporte para dictado (Speech-to-Text) y respuestas habladas (Text-to-Speech) para manos libres en cocina/campo.
    - [ ] **Function Calling Operativo:** Capacidad de ejecutar comandos reales (Consultar stock PFM, Ventas del día, Auditoría de créditos EVASOL).
    - [ ] **Parametrización y Monetización:** Configuración modular por empresa (SaaS Hook) para activarlo como módulo de pago o "Plus".
    - [ ] **Seguridad Integrada (RBAC):** Filtrado inteligente de funciones según el rol del usuario (Cajero vs Admin).
- [ ] **Estandarización con MCP (Model Context Protocol):**
    - [ ] **Servidor de Herramientas:** Crear un servidor MCP independiente para centralizar las habilidades de la IA (Ventas, Stock, CRM).
    - [ ] **Compatibilidad Universal:** Permitir que cualquier interfaz (Web, Desktop, WhatsApp) use el mismo catálogo de funciones de EVASOL.
    - [ ] **Bridge Cloud:** Configurar el enlace seguro entre el protocolo MCP y el Google Apps Script Backend.
- [x] **Respaldo en la Nube (GitHub):** Asegurar privacidad del repositorio (Regresar a modo PRIVADO) para proteger el archivo `backend_schema.gs` y la lógica de seguridad. Confirmado privado por el usuario.
- [ ] **Despliegue Externo (Vercel):** Configurar despliegue seguro desde el repositorio privado hacia Vercel para evitar la exposición del código fuente en la web.
    - [ ] **Fix de Renderizado en Prod:** Corregir rutas de imágenes (C:// drive local -> Drive URL).
    - [x] **Fix de Conexión API (CORS):** Asegurar conexión estable con Google Apps Script desde HTTPS.
    - [x] **Optimización de Estilos:** Corregir alineación de header y botón WhatsApp en producción.
- [ ] **Aseguramiento de Calidad (Playwright):** Configurar el "Avatar" (Browser Subagent) para realizar inspecciones visuales automáticas y validación de flujos críticos (Login, POS, Reportes) tras cada actualización.

- [x] **Módulo de Soporte en Landing:** Reactivar y optimizar el botón de "Atención y Soporte" (AGT-001) en la página principal para usuarios públicos. Activado en v3.4.6.
- [x] **Módulo de Atención al Cliente (CRM Quejas):** Generación de tickets automática vía IA, alertas por email al negocio y cierre de chat post-reporte.

- [ ] **Módulo de Reportes & Analítica (v3.6.0):**
    - [ ] **Aislamiento Multi-Tenant:** Los reportes deben filtrarse estrictamente por `id_empresa`. Ningún negocio podrá ver estadísticas de otro.
    - [ ] **Excepción de Consolidación (SuitOrg):** Solo el usuario DIOS de la empresa `SuitOrg` tendrá acceso a la vista consolidada (Metamétricas) para ver el rendimiento de todos los clientes del SaaS.
    - [ ] **KPIs Iniciales:** Ventas por división, métodos de pago y rendimiento de productos.
- [ ] **Módulo de Gestión de Cuotas (v3.8.0):**
    - [x] **Tabla Backend:** Creada `Cuotas_Pagos` para control de suscripciones.
    - [ ] **Interfaz Admin:** Vista para consultar y actualizar estados de pago por negocio.
    - [ ] **Alertas de Vencimiento:** Notificaciones automáticas cuando una cuota esté próxima a vencer.
---
---
## 13. Pendientes de Validación (Visto Bueno) - Pruebas Mañana
- [x] **Validar Flujo POS/Express Completo:** Proceso de venta y pedido web verificado y blindado (v4.7.5).
- [x] **Validar Visualización OTS:** Monitor POS muestra Dirección y Teléfono mediante inyección redundante resiliente.
- [x] **Validar WhatsApp OTS:** Confirmado envío de folio y OTP.
- [x] **Congelar Lógica POS/OTS:** Módulos marcados como inmutables y documentados en Estándar #17.

---
*Última actualización: 2026-02-06 | Versión: v4.8.6 (STABLE-SYNC)*

## v4.6.0 - Flujo Delivery de 3 Pasos (TESTING)
- [x] **Estado Intermedio**: Implementado estado `EN-CAMINO`.
- [x] **Visibilidad OTP**: Oculto en Tienda, Visible en Ruta.
- [x] **Monitor POS**: Nueva pestaña "En Camino" y Triple-Alerta lateral (Web/Listos/Fin).
- [x] **Botones de Acción**: Transiciones "Iniciar Ruta" y "Finalizar Entrega".

## v4.5.1 - POS Frozen & SaaS Quotas (COMPLETADO)
- [x] **Contador Web Dinámico**: Lógica de resta automática (Pedidos Totales - Entregados) para reflejar cola activa.
- [x] **Filtro Entregados**: Pestaña dedicada de solo lectura con estilo visual distintivo (Verde).
- [x] **Módulo de Cuotas SaaS**: Implementado acceso exclusivo para roles SUITORG/DIOS.
- [x] **Visual Branding**: Tarjetas finalizadas con borde verde y etiqueta 'FINALIZADO'.

## v4.4.9 - Consolidación SaaS & Local Server (COMPLETADO)
- [x] **Tabla Backend**: Creada `Cuotas_Pagos` para control administrativo.
- [x] **Local Server**: Configurado entorno Node.js/Express para desarrollo ágil.
- [x] **Fix CORS**: Optimización de peticiones fetch para evitar bloqueos en GAS.
- [x] **Manual de Reglas**: Documentación centralizada de políticas operativas.

## v4.4.8 - Sincronización Estricta de Roles (COMPLETADO)
- [x] **Regla de HOY**: Eliminada excepción de SLA para Delivery; todos ven únicamente el día actual.
- [x] **OTP para Staff**: Restaurada visibilidad selectiva (Cajero ve OTP / Delivery ve difuminado).
- [x] **Seguridad de Renderizado**: Corregido fallo de referencia en el filtrado de fechas.
- [x] **Cache Busting**: Sincronización total v4.4.8.

## v4.4.7 - Restricción de Fecha & Privacidad OTP Final (COMPLETADO)
- [x] **Regla de Hoy**: El personal de Staff/Caja solo ve pedidos de la fecha actual en el monitor.
- [x] **Blindaje OTP**: Código extraído de tarjetas de Staff; solo visible difuminado para Delivery.
- [x] **Sincronización x3**: Cache busting forzado a v4.4.7 en `index.html`.
- [x] **Estándar Inmutable 13**: Documentado protocolo de foco operativo diario.

## v4.4.6 - Anti-Fraude OTP & Sincronización Forzada (COMPLETADO)
- [x] **Privacidad OTP**: Inyectada lógica en `ui.js` para que el Repartidor vea el código difuminado. 
- [x] **Sincronización x3**: Actualizadas etiquetas en `index.html` con `?v=4.4.6` para romper cache en múltiples navegadores.
- [x] **Estándar Inmutable 12**: Documentado el protocolo de blindaje de códigos de entrega.

## v4.4.5 - Excepción de SLA & Visibilidad Delivery (COMPLETADO)
- [x] **Excepción de SLA**: Repartidores ahora ven pedidos LISTOS sin importar la fecha (Resuelve pedidos perdidos de turnos anteriores).
- [x] **Normalización de Estados**: Unificación de strings de estado (guiones bajos a guiones medios) para evitar fallos de renderizado.
- [x] **Sincronización Atómica**: Implementada regla inmutable de alineación Frontend-Backend en cada turno.
- [x] **Documentación Maestra**: Actualizados `manual-pos-ots.md` y `reglas-negocio.md` con el ciclo OTS detallado.

## v4.4.4 - Estabilidad de Fecha & UI Minimal (COMPLETADO)
- [x] **Fix de Visibilidad**: Implementado filtrado de fecha manual (YYYY-MM-DD) para evitar fallos de locale en diferentes navegadores.
- [x] **UI Minimalista**: Eliminados botones/iconos de contacto; ahora es texto plano puro según solicitud del usuario.
- [x] **Detección de Rol**: Reforzada con busqueda por subcadena para máxima resiliencia.

## v4.4.3 - RBAC Estricto & Estándar Inmutable (COMPLETADO)
- [x] **Eliminación de Parches**: Eliminada detección por nombre; ahora es puramente por Nivel y Rol.
- [x] **Diferenciación Cajero/Repartidor**: Cajero (Lvl >= 5) puede Cocinar/Listar. Repartidor (Rol Delivery) solo puede Entregar.
- [x] **Estándar Inmutable 10**: Consolidado el flujo de permisos en la regla de oro del proyecto.
- [x] **Sincronización v4.4.3**: Código y Backend alineados 100%.

## v4.4.1 - Estabilidad Operativa POS & Seguridad Delivery (COMPLETADO)
- [x] **Visibilidad Repartidor**: Filtros restringidos y acceso exclusivo a pedidos 'LISTO-ENTREGA'.
- [x] **Estructura Leads**: Dirección y Teléfono visibles con enlaces dinámicos (Maps/Llamar).
- [x] **Consecutivos Reales**: Implementados folios cortos incrementales `ORD-1XX`.
- [x] **Saneamiento UTF-8**: Limpieza total de Mojibake en confirmaciones y tickets.
- [x] **Integridad de Inventario**: Descuento de stock real en backend verificado.
- [x] **WhatsApp Ops**: Inclusión de Código OTP y Folio Corto en el mensaje de salida.
- [x] **URGENTE: Restaurar Lógica de Escritura (doPost):** Migrado y blindado con filtrado multi-inquilino.
- [x] **POS Resiliente v4.3.4:** Integración de enlaces dinámicos, badges de canal y trazabilidad OTS.

## 14. Auditoría de Consumo y Optimización
- [ ] **Sugerencia A (Low Code):** Manda estos logs a una hoja de cálculo separada ("Logs_Audit_2026") que se recicle cada mes.
- [ ] **Sugerencia B (Infraestructura QA):** Implementar un script de validación (Node.js) que verifique la integridad de los selectores HTML críticos (Totales, Botones, Inputs) contra las reglas definidas en los workflows para detectar discrepancias antes del despliegue.
