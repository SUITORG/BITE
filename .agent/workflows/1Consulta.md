---
description: Dame el nuevo mapeo completo de ui.js por clasificación, cantidad de lineas y tablas de datos.
---

# 🕵️ Workflow: 1Consulta (Mapeo de ui.js)

Este workflow realiza un análisis exhaustivo de la estructura del archivo `ui.js`, clasificando sus funciones, contando líneas y vinculándolas con las tablas de datos del backend.

## 📊 Mapeo Maestro de ui.js (v4.6.9)

| Clasificación | Rango de Líneas | Total Líneas | Funciones Clave | Tablas de Datos Vinculadas |
| :--- | :--- | :--- | :--- | :--- |
| **Core & Auth** | 1-79, 1065-1210 | **232** | `applyTheme`, `setLoggedInState`, `showLogin` | `Config_Empresas`, `Config_Roles`, `Usuarios` |
| **Puntales de Public (API)** | 80-91 | **12** | `renderHome`, `renderSEO`, `renderOrbit` | `Config_SEO`, `Config_Empresas` |
| **Monitor POS & Ventas** | 92-144, 559-887, 1831-1990 | **601** | `renderPOS`, `filterPOS`, `renderStaffPOS` | `Proyectos`, `Leads`, `Catalogo` |
| **Motor de Reportes (V2)** | 145-315, 376-557, 2271-2402 | **505** | `renderReport`, `renderDashboard`, `renderBusinessDashboard` | `Proyectos_Pagos`, `Proyectos` |
| **Gestión CRM (Leads/Proyectos)** | 1287-1590, 2023-2055 | **355** | `renderLeads`, `renderProjects`, `openProjectDetails` | `Leads`, `Proyectos`, `Proyectos_Bitacora` |
| **Base de Conocimientos** | 1591-1735, 1767-1775 | **154** | `renderKnowledge`, `syncKnowledge`, `viewDocText` | `Empresa_Documentos` |
| **Catálogo e Inventario** | 1776-1830, 1991-2022, 2056-2173 | **205** | `renderCatalog`, `editProductStock`, `saveProduct` | `Catalogo` |
| **Sistema & Admin** | 888-948, 994-1064, 1211-1286 | **260** | `updateConsole`, `toggleLogs`, `updateEstandarBarraST` | `Logs`, `Config_Empresas` |
| **Seguridad Delivery (OTP)** | 949-989, 1736-1766 | **72** | `showOtpEntry`, `verifyStandardOTP` | `Proyectos` |
| **Gestión de Cuotas SaaS** | 2403-2461 | **59** | `renderQuotas` | `Cuotas_Pagos` |

## 📐 Estadísticas Generales
- **Líneas Totales:** ~2,463 líneas.
- **Clasificaciones:** 10 áreas funcionales.
- **Tablas Mapeadas:** +12 tablas de Google Sheets.

---
*Generado por Suit.Org Orchestrator v4.6.9*
