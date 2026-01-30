# Bitácora de Checkpoints y Versiones Backend

Este archivo registra el historial de solicitudes, aprobaciones y versiones del sistema SuitOrg.
**Estado: ❄️ (Congelado/Aprobado), ✅ (Verificado), ⏳ (Pendiente)**

| Fecha | Solicitud / Cambio | Backend | Estado | Nota del Arquitecto |
| :--- | :--- | :--- | :--- | :--- |
| 2026-01-23 10:25 | **Fix: Font Awesome 6 & Social Logos** | v3.5.0 | ✅ | Restauración de iconos ausentes mediante inyección de FA6 y actualización de clases `fa-brands`. |
| 2026-01-23 10:15 | **Standard: Estandar Body (Hero & SEO)** | v3.5.0 | ❄️ | Creación del flujo de diseño para el cuerpo de las landing pages y registro en inmutables. |
| 2026-01-23 10:00 | **Standard: Footer Barra Única** | v3.5.0 | ❄️ | Rediseño minimalista del footer consolidado en una sola franja oscura. |
| 2026-01-23 09:30 | **Calibración: Memorias con Tiempo** | v3.5.0 | ✅ | Inclusión de columnas de Fecha/Hora en Soluciones y Lecciones para trazabilidad exacta. |
| 2026-01-22 21:45 | **Core: Workflows Integration** | v3.5.0 | ❄️ | Se amarraron los workflows huérfanos (Staff Focus, DB Arch) al Orquestador central. |
| 2026-01-22 20:55 | **UX: Total Staff Clean Up** | v3.5.0 | ❄️ | El botón de WhatsApp y el Footer se ocultan al loguearse para maximizar el foco. |
| 2026-01-22 20:45 | **UX: Staff Footer Auto-Hide** | v3.4.9 | ❄️ | El footer se oculta al loguearse para evitar ruidos visuales en el panel operativo. |
| 2026-01-22 20:30 | **UX: AI Chat Auto-Close** | v3.4.8 | ❄️ | Cierre automático tras despedida o 45s de inactividad. Sincronizado. |
| 2026-01-22 19:48 | **Fix: Ai Payload & SEO Refine** | v3.4.7 | ❄️ | Cambiado a v1beta para Gemini y ocultamiento quirúrgico del título de SEO. |
| 2026-01-22 19:30 | **Feature: Soporte Premium & Chat Modal** | v3.4.6 | ❄️ | Activación de AGT-001 con seed, modal global de IA y limpieza de SEO en Landing. |
| 2026-01-22 14:40 | **RBAC: Dashboard Granular** | v3.4.5 | ❄️ | Control estricto de visibilidad para 'Mantenimiento' y 'Agentes IA' por Nivel/Modulo. |
| 2026-01-22 14:23 | **Fix: Login Multi-inquilino** | v3.4.4 | ❄️ | Persistencia de eventos en Staff al cambiar de empresa via `onclick` dinámico. |
| 2026-01-22 14:15 | **Lógica: Mapeo de Cabeceras Robusto** | v3.4.3 | ❄️ | El backend ahora mapea datos por nombre de columna, no por índice. Inmune a cambios en Sheets. |
| 2026-01-22 14:05 | **Fix: Sincronización de Pagos** | v3.4.2 | ❄️ | Doble escritura en `Pagos` y `Proyectos_Pagos` para evitar pérdida de datos. |
| 2026-01-22 13:45 | **Fix: Motor de Stock Turbo (Batch)** | v3.4.1 | ❄️ | Consolidación de peticiones de stock en un solo bloque. Verificado. |
| 2026-01-22 13:30 | **UX: Reset de Pago y Auto-Cierre** | v3.4.0 | ❄️ | Al vender: foco -> Local, pago -> Efectivo, folio -> vacío. Auto-cierre de ticket en 10s (Mobile). |
| 2026-01-22 13:15 | **Bug: Fix Descuento Stock** | v3.4.0 | ❄️ | Implementada espera asíncrona (Promise.all) y tipado string para matching exacto de IDs. |
| 2026-01-22 13:00 | **UX: Compactación Ticket 2da Etapa** | v3.4.0 | ❄️ | Segunda reducción de 10% en ticket y datos de cliente para ajuste vertical. |
| 2026-01-22 12:45 | **UX: Foco en Botón Local (Default)** | v3.4.0 | ❄️ | El botón de entrega local ahora es el foco predeterminado en POS. |
| 2026-01-22 12:30 | **Bug: Fix Limpieza Carrito POS** | v3.4.0 | ❄️ | Corregido scope de variables y orden de ejecución para asegurar limpieza tras éxito. |
| 2026-01-22 12:15 | **Workflow: Checkpoint** | v3.4.0 | ❄️ | Creación de bitácora y protocolo de visto bueno. |
| 2026-01-22 12:00 | **Workflow: Planeación** | v3.4.0 | ❄️ | Análisis de sesgos y reuso obligatorio. |
| 2026-01-22 11:45 | **Fix: Restauración Hub Orbital** | v3.4.0 | ❄️ | Corrección de visibilidad de tablas para el Hub. |
| 2026-01-22 11:30 | **UX: Botones de Cancelación Total** | v3.4.0 | ❄️ | Botones rojos en POS y Checkout público. |
| 2026-01-22 11:15 | **UX: Animación Blink** | v3.4.0 | ❄️ | Feedback visual al confirmar venta. |
| 2026-01-22 11:00 | **UX: Compactación Ticket POS** | v3.4.0 | ❄️ | Reducción de 10% para evitar encimamiento. |
| 2026-01-22 10:45 | **Lógica: Reset a Cero Post-Venta** | v3.4.0 | ❄️ | Limpieza automática de carrito y estados. |
| 2026-01-22 10:30 | **Feature: Selector de Entrega Staff** | v3.4.0 | ❄️ | Botones Local/Envío en Caja POS. |
| 2026-01-22 10:15 | **Seguridad: Repo Privado** | N/A | 🔒 | Migración exitosa de repositorio público a PRIVADO en GitHub. |
| 2026-01-21 18:00 | **Feature: Costo de Envío Dinámico** | v3.4.0 | ❄️ | Implementación de cargo configurable en Sheets. |
| 2026-01-21 17:30 | **Backend: v3.4.0 Stable** | v3.4.0 | ❄️ | Motor de envíos y aislamiento multi-tenant. |
| 2026-01-21 16:00 | **Backend: v3.3.9** | v3.3.9 | ❄️ | Modo Turbo y Automatización NPM. |

---
*Fin del Historial*
