---
description: Maestro de Lógica de Negocio, Seguridad Operativa y Modelo Económico.
---

# 🚓 MASTER WORKFLOW: Reglas de Negocio & Seguridad

> **⚠️ REGLA DE ORO:** Siempre que se utilice este workflow, se debe reportar su ejecución a `/evaluador` para auditoría de cumplimiento.

Este documento consolida la lógica de negocio fundamental del sistema SuitOrg: **control de acceso (RBAC), economía de créditos y experiencia de usuario operativa (Staff Focus).**

---

## 🔖 ÍNDICE DE CONTENIDOS (Workflows Consolidados)
1.  **Niveles de Acceso** (RBAC y Permisos)
2.  **Políticas de Créditos** (Modelo Económico SaaS)
3.  **Foco Staff** (UX y Reducción de Distracciones)
4.  **Aislamiento Multi-Inquilino** (Seguridad de Datos)
5.  **Integridad de Checkout y Caja** (Operación Crítica)

---

## 1. 🔑 NIVELES DE ACCESO & RBAC (CONSOLIDADO)

Este bloque asegura que los permisos de usuario estén correctamente configurados entre el Backend (Google Sheets) y el Frontend (app.js). Es la base de la seguridad operativa de SuitOrg.

### 1.1. Verificación en Backend (Google Sheets)
1.  **Pestaña `Usuarios`:** 
    - Verifica que el usuario tenga asignado el `id_empresa` correcto (ej. `SuitOrg` o `PFM`).
    - Asegúrate de que no haya espacios extra en el `username`, `email` o `password`.
2.  **Pestaña `Config_Roles`:**
    - Asegúrate de que el `id_rol` asignado al usuario exista en esta tabla para su empresa.
    - Verifica que el `nivel_acceso` sea el correcto (**Admin >= 10**, **Staff/Cajero >= 5**, **Repartidor = 7**).
    - La columna `modulos_visibles` define qué puede ver (ej: `#leads, #projects, #pos`).

### 1.2. RBAC Operativo (Monitor POS - Estándar 09-13)
La visibilidad y capacidad de acción en el Monitor POS se rige estrictamente por niveles:
-   **ADMIN (>= 10)**: Control total. **SOLO VE HOY**. Ve el OTP para soporte.
-   **CAJERO / OPERADOR (>= 5)**: **SOLO VE HOY**. Ve el código OTP para informar al cliente.
-   **REPARTIDOR (Rol DELIVERY)**: **SOLO VE HOY**. Solo pestaña **Listos**. Ve el OTP difuminado.

### 1.3. Resolución de Problemas (Troubleshooting)
- **Error "Usuario no encontrado":** Revisa la consola (F12). Si aparece `USER_FOUND_BUT_WRONG_COMPANY`, el usuario existe pero la URL de la empresa es incorrecta. Usa `?co=ID_EMPRESA`.
- **Error de Roles:** Si aparece `ROLE_NOT_FOUND`, el rol del usuario no está en `Config_Roles` para su empresa.

// turbo
### 1.4. Sincronización y Validación Final
1. En la aplicación, haz clic en **"Staff" -> "Reparar DB"** para forzar la creación de tablas faltantes.
2. Revisa `app.ui.setLoggedInState` para confirmar el ocultamiento de UI.
3. Ejecuta `console.log(app.state.currentUser)` en la consola para ver los permisos cargados.

---

## 2. 💳 POLÍTICAS DE CRÉDITOS (`zpoliticas-creditos.md`)

Gestión y Modos de Consumo de Créditos (Sistema SaaS). Existen 3 modos configurables desde `Config_Empresas`.

### 2.1. Modo USUARIO (Créditos Personales)
Es el modo estándar y más restrictivo. Cada usuario tiene su propia "bolsa" de créditos.
- **Configuración:** `Config_Empresas[modo_creditos] = USUARIO`.
- **Comportamiento:** Cada vez que el usuario inicia sesión o realiza una acción premium, se descuenta 1 crédito de su saldo individual en la tabla `Usuarios`.
- **Uso ideal:** Empresas que quieren controlar el gasto exacto por empleado o vendedor.

### 2.2. Modo DIARIO (Suscripción por Día)
Funciona como un "pase diario". Permite uso ilimitado durante las 24 horas del día natural.
- **Configuración:** `Config_Companies[modo_creditos] = DIARIO`.
- **Comportamiento:** Al detectar el primer login del día, se descuenta **1 solo crédito** del saldo del usuario y se registra en la columna `ultimo_acceso`. Si el usuario entra 100 veces el mismo día, no se descuentan más créditos.
- **Uso ideal:** Equipos de alto volumen que necesitan usar las herramientas todo el día sin preocuparse por el conteo individual de acciones.

### 2.3. Modo GLOBAL (Pool de Empresa)
Utiliza un saldo compartido para toda la organización.
- **Configuración:** `Config_Companies[modo_creditos] = GLOBAL`.
- **Comportamiento:** El sistema ignora los créditos individuales de los usuarios. Cada vez que cualquier miembro de la empresa entra, se descuenta 1 crédito del saldo general de la empresa (columna `creditos_totales` en `Config_Empresas`).
- **Uso ideal:** Empresas pequeñas o familias de empresas (como EVASOL) que compran un paquete de créditos para todos sus departamentos.

### 2.4. Reglas Transversales
- **Fecha de Corte:** Sin importar el modo de créditos, si la `fecha_vencimiento` ha pasado, el acceso se bloquea totalmente.
- **Alertas de Saldo:** El sistema lanza una alerta visual cuando quedan **5 créditos o menos** disponibles para incentivar la recarga.
- **Persistencia:** Todos los descuentos se sincronizan en tiempo real con Google Sheets mediante la acción `updateUser` o `updateCompany`.

### 2.5. Verificación Técnica
- Revisa la lógica exacta en `app.js` -> `app.auth.login` (líneas 300-345) para confirmar el flujo de condiciones.

---

## 3. 🎯 FOCO STAFF (`zfoco-staff.md`)

Estándar para la limpieza de la interfaz operativa del Staff y reducción de distracciones.

### 3.1. Elementos a Ocultar (Auto-Hide)
Al detectar un inicio de sesión exitoso (`setLoggedInState`), los siguientes elementos deben agregarse a la clase `.hidden` de forma obligatoria:
- **Botones Flotantes de Contacto:** Específicamente el botón de WhatsApp (`#whatsapp-float`).
- **Footer Principal:** El pie de página corporativo (`#main-footer`) que contiene enlaces de redes sociales y navegación pública.
- **Banners Promocionales:** Cualquier carrusel o aviso de ofertas que no sea relevante para la gestión de datos.

### 3.2. Elementos a Mostrar (Auto-Show)
Al cerrar sesión (`setLoggedOutState`), estos mismos elementos deben volver a ser visibles eliminando la clase `.hidden`:
- **Restauración Total:** Garantizar que el visitante público siempre tenga acceso a los medios de contacto y navegación legal (Políticas).

### 3.3. Implementación Ética
- **No invasivo:** El ocultamiento debe ser puramente visual mediante CSS/JS. Los elementos deben permanecer en el DOM para propósitos de SEO y accesibilidad.
- **Resiliencia:** El código de ocultamiento debe usar el operador opcional (`?.`) para evitar errores en caso de que un elemento específico no exista en esa empresa en particular.
  ```javascript
  document.getElementById('whatsapp-float')?.classList.add('hidden');
  ```

### 3.4. Cobertura Multi-Inquilino
- Esta regla aplica para **todas** las empresas del ecosistema SuitOrg (PFM, Evasol, etc.), independientemente de si son de giro alimenticio o industrial.
- El "Foco Staff" es un estándar de UX para mejorar la productividad del equipo operativo.

### 3.5. Verificación de Cumplimiento
- ¿El footer desaparece al loguearse con un usuario de nivel 5?
- ¿El botón de WhatsApp desaparece al entrar al POS (Staff)?
- ¿Ambos elementos reaparecen al dar clic en "Salir"?

---

## 4. 🎨 ESTRUCTURA VISUAL OBLIGATORIA (LANDING PAGE)

La identidad pública de cada inquilino se rige por un formato preestablecido estricto para garantizar consistencia y calidad.

### 4.1. Mandato de Estandarización
- **Fuente de Verdad:** La estructura visual **SIEMPRE** debe cumplir con `estandar-landing.md`. No se permiten layouts "custom" que violen este esquema base.
- **Activación por Datos:** Los componentes (Hero, Slogans, Matriz SEO) se muestran u ocultan **EXCLUSIVAMENTE** basados en si existe información en las tablas `Config_Empresas` y `Config_SEO`.
    - *Ejemplo:* Si `Config_SEO` tiene filas para la empresa "PFM", la Matriz SEO **DEBE** renderizarse obligatoriamente, sin importar si el giro es Alimentos o Industrial.
- **Prohibición de Hardcoding:** Queda prohibido ocultar secciones estructurales mediante código CSS/JS fijo (ej. `if (isFood) hideSEO()`). La UI debe ser reactiva a los datos.

---

## 5. 🏗️ AISLAMIENTO MULTI-INQUILINO (`ymulti-inquilino.md`)

Garantía de privacidad en un entorno de datos compartidos.

### 5.1. Regla de Oro de Privacidad
- Aunque todas las empresas comparten las mismas tablas de Google Sheets, **el aislamiento debe ser total**.
- Queda terminantemente prohibido que una empresa pueda ver, filtrar o acceder a:
    - Información de clientes/leads de otra empresa.
    - Reportes de ventas o inventarios ajenos.
    - Configuraciones de permisos o roles de inquilinos distintos.

### 5.2. Filtrado Obligatorio
- Cada petición al backend (especialmente `read` y `query`) debe incluir y validar el `id_empresa`.
- En el frontend, `app.state.currentCompany` debe ser el único filtro para renderizar cualquier dato o reporte.

---

## 6. 🛒 INTEGRIDAD DE CHECKOUT Y CAJA (`wproceso-checkout.md`)

La operación de cierre de venta es el corazón del sistema y debe ser infalible.

### 6.1. Flujo de Checkout 100%
- El proceso de checkout debe ejecutarse con **CERO ERRORES**. Se deben implementar validaciones redundantes antes de permitir el envío al backend.
- La operación es atómica: o se guarda todo (Orden, Lead, Descuento de Stock) o no se guarda nada (Rollback visual).

### 6.2. Claridad Operativa en Caja
- La interfaz de Caja y POS debe ser clara, sin ambigüedades en precios, totales o métodos de pago.
- Cada movimiento de caja debe estar respaldado por un folio o referencia única para auditoría.
