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

- [ ] **Respaldo en la Nube (GitHub):** Crear repositorio oficial y realizar el primer push.
- [ ] **Despliegue Externo:** Opcional (Netlify/GitHub Pages).

---
*Última actualización: v2.7.0 (Temperatura de Negocio & RBAC Avanzado)*
