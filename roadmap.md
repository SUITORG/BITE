# 🗺️ Roadmap & Auditoría de Proyecto

## 📖 Guía de Uso
Este archivo es tu **Centro de Comando**. Úsalo para controlar el avance del proyecto.

*   **Marcar como Hecho:** Cambia `[ ]` por `[x]`.
*   **Pendiente:** Mantén el `[ ]` vacío.
*   **Nueva Tarea:** Añade una línea con guión `- [ ] Nueva función...`
*   **Notas:** Puedes escribir comentarios debajo de cada ítem si algo "está incompleto" o falla.

Este documento rastrea el cumplimiento de las reglas fundamentales y la visión del proyecto.

## 📋 Reglas Fundamentales (Core Constraints)

1.  **Tecnología**
    - [x] **HTML/CSS/JS Puro:** Sin frameworks (React, Angular, etc.). Código ligero y mantenible.
    
2.  **Backend & Persistencia**
    - [x] **Google Sheets:** Base de datos exclusiva.
    - [x] **Apps Script:** API personalizada con protección de concurrencia (`LockService`).

3.  **Arquitectura de Datos**
    - [x] **Multi-Tenant:** Estructura preparada para múltiples empresas (`Config_Empresas`).
    - [x] **IDs Secuenciales:** Algoritmo O(1) para `LEAD-1`, `PROJ-1`, etc.
    - [x] **Integridad:** Validaciones para evitar IDs duplicados.

4.  **Seguridad y Roles**
    - [x] **Control de Acceso:** Login modal para Staff vs Landing pública.
    - [x] **Roles:** Sistema jerárquico (ADMIN, VENTAS, DIOS).
    - [x] **Modo DIOS:** Superusuario con créditos infinitos y acceso total.

5.  **Seguridad Avanzada (v3.3.8)**
    - [x] **Blindaje de API Tokens:** Todas las peticiones al backend requieren firma de token.
    - [x] **Protección de Secretos:** Eliminación de API Keys del código fuente.
    - [x] **Filtrado Multi-Tenant Estricto:** Privacidad absoluta entre empresas.

5.  **Reglas de Negocio**
    - [x] **Sistema de Créditos:** Consumo por acciones (crear lead, etc.).
    - [x ] **Auto-Logoff:** Timeout de seguridad por inactividad.
            hacer el auto-logoff a las 120 segundos de inactividad.
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
    - [x] **Visualización:** Grid de productos/servicios disponibles.
    - [x] **Seguridad:** Creación restringida a Nivel 10+ (Admin).

11. **Core & UX**
    - [x] **RBAC 2.0:** Gestión por Tabla de Roles y permisos granulares.
    - [x] **Consola:** Monitoreo visual de sistema en barra de estado.
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
    - [ ] **Fix de Conexión API (CORS):** Asegurar conexión estable con Google Apps Script desde HTTPS.
    - [ ] **Optimización de Estilos:** Corregir alineación de header y botón WhatsApp en producción.

- [x] **Módulo de Soporte en Landing:** Reactivar y optimizar el botón de "Atención y Soporte" (AGT-001) en la página principal para usuarios públicos. Activado en v3.4.6.
- [x] **Módulo de Atención al Cliente (CRM Quejas):** Generación de tickets automática vía IA, alertas por email al negocio y cierre de chat post-reporte.

- [x] **Consolidación de Inteligencia (v3.5.1):** Amarrado de workflows huérfanos al Orquestador y blindaje de seguridad en todos los endpoints de la API.
---
---
*Última actualización: v3.5.1 (Security & Intelligence Integration)*
