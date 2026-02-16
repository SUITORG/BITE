# 🏗️ Backend Schema Documentation (SuitOrg v5.2.4)

## 📌 Resumen Técnico
Este documento define la estructura y el comportamiento del motor de backend de **SuitOrg**, operando sobre **Google Apps Script (GAS)** y utilizando **Google Sheets** como base de datos relacional multi-inquilino.

**Versión Actual:** 5.2.5 (Lead Sync & Timestamps)
<b>Última Actualización:</b> 2026-02-15

---

## 🗃️ Estructura de Datos (Tablas)

### 1. Tablas Globales (`GLOBAL_TABLES`)
Tablas compartidas entre todas las empresas para configuración del Hub y autenticación.
*   **Config_Empresas**: Metadata de inquilinos, colores, temas y políticas de créditos.
*   **Config_Roles**: Definición de permisos RBAC y módulos visibles.
*   **Usuarios**: Credenciales, niveles de acceso y saldos de créditos.
*   **Config_SEO**: Matriz de palabras clave y soluciones para la Landing Page.
*   **Prompts_IA**: Configuración de agentes Gemini.

### 2. Tablas Privadas (`PRIVATE_TABLES`)
Datos aislados por `id_empresa`. El acceso a estas tablas debe filtrarse estrictamente en el servidor.
*   **Leads**: Prospectos comerciales. Utiliza el estándar de folio `LEAD-XXX`.
*   **Proyectos**: Órdenes de trabajo y ventas. Utiliza el estándar de folio `ORD-XXX`.
*   **Catalogo**: Inventario y servicios. Utiliza el prefijo `PROD-XX`.
*   **Logs**: Registro de auditoría y fallos de IA.
*   **Pagos**: Transacciones financieras vinculadas a empresas y proyectos.

---

## 🛠️ Acciones de API (POST Protocol)

El backend responde a las siguientes acciones mediante el orquestador principal:

| Acción | Descripción | Reglas de Negocio |
| :--- | :--- | :--- |
| `createLead` | Crea un prospecto nuevo. | **Inmutable**: Genera folio `LEAD-XXX` secuencial. |
| `updateLead` | Actualiza un prospecto existente. | Busca por `id_lead` y aplica cambios. |
| `createProject` | Inicia una orden/proyecto. | Genera folio `ORD-XXX` y establece `fecha_inicio`. |
| `updateProjectStatus` | Cambia el estado de una orden. | Actualiza `estado`, `estatus` y `fecha_estatus`. |
| `processFullOrder` | Transacción atómica de POS. | Registra Lead, Venta y descuenta Stock en un solo paso. |
| `createProduct` | Añade ítem al catálogo. | Genera ID `PROD-XX` incremental por empresa. |

---

## 🔒 Reglas Inmutables de Integridad
1.  **Aislamiento**: Ninguna petición puede recuperar datos que no pertenezcan al `id_empresa` autenticado (excepto tablas globales).
2.  **Identificadores**: Los IDs técnicos son secuenciales y no aleatorios (LEAD-101, ORD-501).
3.  **Timestamps**: Toda creación o cambio de estado debe llevar sello de tiempo en formato ISO.
4.  **Borrado Lógico**: No se eliminan filas físicamente; se usa una columna `activo` (TRUE/FALSE) para persistencia histórica.

---
*Documento mantenido automáticamente por Antigravity AI.*
