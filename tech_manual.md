
# Manual Técnico y Operativo - SuitOrg
> **Identidad Principal:** SuitOrg (Powered by EVASOL Engine)

## 0. Resumen Ejecutivo (TL;DR) - Para gente con prisa ⚡
1.  **¿Qué es?** Una plataforma "todo en uno" que gestiona múltiples negocios desde un solo lugar.
2.  **¿Cómo entro?** Usa tu `Username` y `Password`. No necesitas email.
3.  **¿Qué controlo?** 
    *   **Ventas:** Leads y prospección.
    *   **Proyectos:** "Temperatura" y avance real (%).
    *   **IA:** Agentes inteligentes que redactan y analizan por ti.
4.  **Seguridad:** Si no tienes nivel 10, no puedes borrar nada. Todo queda registrado.
5.  **Créditos:** Cada entrada consume saldo. Si ves una alerta roja en la consola... ¡Recarga!

## 1. Descripción del Sistema
SuitOrg es un sistema multi-capa diseñado para la hiper-organización empresarial.

## 2. Reglas de Negocio

### A. Niveles de Acceso (Roles)
1.  **DIOS (Nivel 999):** Acceso total a configuraciones, mantenimiento y todos los datos. Inmune a filtros de módulos y restricciones de créditos.
2.  **ADMIN (Nivel 10):** Acceso total a la empresa asignada. Puede gestionar el Catálogo, sincronizar Drive y borrar registros (Leads/Proyectos).
3.  **SUPERVISOR (Nivel 8):** Acceso operativo extendido. Puede añadir log de bitácora y gestionar flujo de proyectos, pero no puede borrar ni editar el Catálogo.
4.  **VENTAS (Nivel 4-6):** Acceso a prospección. Puede crear Leads, consultar Catálogo (solo lectura) y usar Agentes IA si tiene nivel 5+.
5.  **STAFF (Nivel 5):** Acceso operativo base. Consume créditos por login.
6.  **PUBLIC (Nivel 0):** Acceso solo a Landing Page y formularios de contacto.

### B. Sistema de Créditos y Permisos (RBAC)
El sistema soporta dos modos de gestión de políticas configurables en `Config_Empresas`:

1.  **Modo USUARIO:** Las reglas se leen directamente de la fila del usuario en la tabla `Usuarios`.
2.  **Modo ROL:** Las reglas se centralizan en la tabla `Config_Roles`. El sistema busca el `id_rol` del usuario y aplica automáticamente sus permisos, nivel de acceso y módulos visibles.
3.  **Modo DIARIO:** Ideal para suscripciones por día. El sistema descuenta **1 crédito** la primera vez que el usuario accede en el día. Los ingresos subsecuentes durante el mismo día calendario (zona horaria del servidor) no consumen créditos adicionales.
    - **Acceso por Identificador:** Permite login mediante `Email`, `Username` o `Nombre` indiferentemente.

**Prioridad de Restricción:**
- **Fecha de Corte:** Tiene prioridad absoluta. Se calcula sumando `vigencia_dias` (desde la creación del usuario) o usando la fecha fija de la empresa.
- **Créditos:** Se descuenta **1 crédito** (Global o Individual) por acceso exitoso.
- **Módulos Visibles:** El menú de navegación y las tarjetas del Dashboard se filtran dinámicamente según lo definido en la configuración del rol.

**Seguridad de Acción (Granularidad):**
- **Nivel < 10:** Los botones de "Agregar Producto", "Sincronizar Drive" y los botones "Borrar" en tablas están ocultos.
- **Nivel >= 10:** Acceso total a botones de creación y depuración.

**Alertas de Mantenimiento:**
- **Advertencia de Saldo:** Si el saldo de créditos resultante es **<= 5**, se muestra una alerta persistente.
- **Consola de Sistema:** La barra de estado muestra alertas tipo log (`> SYSTEM_OK`, `> ERR: DB_INIT`, etc.) para monitoreo en tiempo real.

**Notas Importantes:**
- Los usuarios con rol **DIOS** tienen créditos infinitos y no descuentan del sistema.
- Si el saldo (individual o global) llega a **0**, el sistema bloquea el acceso.
- Existe una **Fecha de Vencimiento** independiente que puede bloquear el acceso total si se supera.

### C. Seguridad e Interfaz
- **Timeout:** 120 segundos de inactividad redirigen al Landing (Inicio).
- **Consola de Sistema:** Visualiza en tiempo real el estado del backend. Los errores críticos disparan un indicador rojo parpadeante.
- **Identidad:** Los visitantes son identificados con el icono de "Escudo de Seguridad" para reforzar la confianza en la plataforma.

### D. Reglas de Interfaz (UI/UX)
- **Modales Seguros:** Todo modal de captura (Leads, Productos, Proyectos) debe incluir obligatoriamente un botón de **"Cancelar / Volver"** visible, además de la 'X' de cierre.
- **Gestión de Temperatura (Avance):** El progreso de los proyectos se mide por "Fases de Negocio" configuradas en `Config_Flujo_Proyecto`. Cada fase tiene un **Peso Porcentual** que actualiza la barra de progreso de forma automática.
- **Estética:** Uso de bordes redondeados (`border-radius: 50px` en botones), colores corporativos suaves y tipografía legible.

### E. Glosario de Módulos (IDs Técnicos)
Para que el sistema active correctamente el menú y el Dashboard, se deben usar exactamente estos identificadores en la columna `modulos_visibles` de la tabla `Config_Roles` o `Usuarios`:

| ID Técnico | Nombre en Interfaz | Función Principal |
| :--- | :--- | :--- |
| `dashboard` | Panel de Control | Resumen de créditos, accesos directos y estadísticas. |
| `staff-pos` | Venta (POS) / Caja | Interfaz de cobro directo para personal de ventas. |
| `pos` | Monitor de Pedidos | Control de estatus de órdenes (Nuevos, Cocina, Listos). |
| `projects` | Proyectos | Tabla de gestión de avance y temperatura de negocio. |
| `leads` | Gestión de Leads | Registro y seguimiento de clientes potenciales. |
| `BACKEND_MISSING_SEEDS` | Nuevos agentes o roles no se creaban si la tabla ya existía pero estaba incompleta. | Implementar lógica de "Upsert" en la inicialización para verificar registros uno por uno en lugar de solo tablas vacías. | ✅ Resuelto | 20 min |
| `SEED_LOGIC_INDEX_FAIL` | La verificación de seeds fallaba por depender de índices fijos o nombres de tabla incorrectos. | Refactorizar a función `ensureSeed` que busca dinámicamente el encabezado 'id' para insertar con precisión. | ✅ Resuelto | 15 min |
| `catalog` | Catálogo | Gestión de productos, stock y precios de oferta. |
| `agents` | Agentes IA | Panel de Agentes inteligentes (Gemini). |
| `home` | Inicio / Landing | Vista principal pública de la empresa seleccionada. |
| `orbit` | Orbit Hub | Interfaz de navegación entre divisiones (Burbujas). |
| `contact` | Contacto | Formulario público de captura de leads. |

**Reglas de activación:**
1. Los IDs deben escribirse en **minúsculas**.
2. Pueden separarse por comas (`,`) o espacios.
3. No utilizar el símbolo `#` (el sistema lo limpia automáticamente, pero es mejor omitirlo).
4. Si un ID es incorrecto, el módulo permanecerá oculto por seguridad.

## 3. Estructura de Datos (Tablas)

| Tabla | Descripción |
| :--- | :--- |
| **Config_Empresas** | Parámetros generales, políticas, colores, modo de créditos y Feature Toggles (`usa_features_estandar`). |
| **Config_Roles** | Definición de jerarquías, módulos visibles y vigencia por rol. |
| **Config_Flujo_Proyecto** | Definición de etapas comerciales con pesos porcentuales y colores. |
| **Usuarios** | Credenciales, roles, créditos y fechas límite. |
| **Prompts_IA** | Configuración de Agentes (Nombre, Prompt Base, Activo). |
| **Leads** | Prospectos capturados con origen y estado. |
| **Catalogo** | Productos y Servicios con control de stock y precios. |
| **Proyectos** | Control de obras vinculado a Leads. |
| **Logs** | Registro de eventos del sistema y diagnóstico de modelos Gemini. |

## 4. Agentes de Inteligencia Artificial (Gemini)
El sistema utiliza la API de Google Gemini para procesar consultas inteligentes basadas en el contexto corporativo.

### A. Acceso y Uso
- **Nivel Requerido**: Los agentes son accesibles para usuarios con **Nivel 5 (Staff)** en adelante o rol **DIOS**.
- **Ubicación**: Se encuentran en el Dashboard principal bajo la sección **"HERRAMIENTAS IA"**.
- **Funcionamiento**: Selecciona un agente (Escritor, Analista, etc.) y el sistema enviará el contexto de la empresa y los documentos sincronizados para generar una respuesta personalizada.

### B. Conocimiento (RAG)
- Los agentes "leen" los archivos que hayas subido a la carpeta de Google Drive configurada.
- **Acción Crucial**: Para que los agentes trabajen con información actualizada, debes usar el botón **"Sincronizar"** en el módulo de **Conocimiento**. Esto indexa los textos de tus PDFs y documentos para que la IA los use de referencia.

### C. Configuración Técnica
- **Modelos**: `gemini-2.0-flash` y `gemini-flash-latest` (v1beta).
- **Personalización de Comportamiento**: En la tabla `Prompts_IA` de Google Sheets, puedes editar el `prompt_base` de cada agente para cambiar su personalidad o instrucciones específicas (ej. "Escribe siempre en tono formal").
- **Autodiagnóstico y Resiliencia**: El sistema implementa una arquitectura de **Loop de Fallback Multi-modelo**. Si el modelo configurado no está disponible en la región o cuenta, el backend intentará automáticamente una lista de alternativas (`gemini-2.5-flash`, `2.0-flash`, `1.5-flash`, etc.) hasta obtener una respuesta válida.
- **Log de Recuperación**: Cada intento fallido queda registrado en la hoja `Logs` bajo el evento `AI_FALLBACK`, permitiendo al administrador identificar qué modelos están activos realmente para su API Key.

## 5. Guía de Mantenimiento
- **Registro de Errores (Logs):** Si los Agentes IA fallan, revisa la hoja `Logs`. Busca eventos `AI_FAILURE` o `DIAGNOSTIC_MODELS`. Este último muestra la lista exacta de modelos permitidos por Google para tu API Key.
- **Reset de Empresa:** Borra Leads y Proyectos. (Requiere Rol DIOS).
- **Auto-Depuración:** Mantiene solo últimos 2 meses de Logs.

## 6. Estrategias SEO Implementadas
El sistema cuenta con una arquitectura optimizada para buscadores:
- **Metadatos Dinámicos:** Título y descripción configurados para Grupo EVASOL.
- **Micro-Copy de Divisiones:** Cada una de las 8 divisiones tiene atributos `alt` y `title` enriquecidos con palabras clave industriales.
- **Clusters de Cola Larga:** Sección de "Soluciones Especializadas" con 24 frases clave (3 por división).
- **Pilares Estratégicos:** Sección dedicada a Misión, Visión, Impacto y Valores en la Landing Page para fortalecer el Branding Corporativo.

- **v2.7.0:** Implementación de "Temperatura de Negocio" (Flujo Dinámico), Consola de Sistema en tiempo real y UX de Modales mejorada (Botones de escape).
- **v2.6.5:** Unificación de RBAC (Tabla `Config_Roles`) y soporte para acceso por Username/Nombre sin Email.
## 7. Visión de Futuro: Ecosistema SuitOrg
El sistema está preparado para ramificarse en soluciones específicas según el inquilino (Tenant):
*   **Módulo POS:** Para negocios de retail o comida (Burbuja "Pollo").
*   **Módulo Pedidos/Logística:** Para distribución.
*   **Módulo Contable/Seguimiento:** Para consultorías o servicios profesionales.
*   **Interfaz Orbit:** Navegación disruptiva mediante burbujas interactivas según búsqueda del usuario.

---
- **v3.3.7:** Refuerzo del Protocolo de Semillas con función `ensureSeed`. Fix de sincronización AI Agentes.
- **v3.3.6:** Implementación del Protocolo de Verificación de Semillas (Seeds):
    - Asegurar que registros maestros (Agentes IA, Roles Críticos, SEO base) existan en el backend mediante lógica de "Upsert".
    - **NUEVO**: La lógica de Upsert debe verificar por ID y no depender del estado "vacío" de la tabla.
    - Botón de soporte en landing.
- **v3.3.5:** Implementación del módulo de Atención al Cliente (`Atencion_Cliente`). Integración de notificaciones por correo y cierre inteligente de chat IA tras reporteo.
- **v3.3.4:** Optimización de Workflows e implementación del Orquestador inteligente. Unificación de flujos en `/integridad-total` y blindaje `/multi-inquilino` en reparaciones.
- **v3.3.3:** Fix de renderizado HTML en el chat de agentes IA. Actualización de auditoría de líneas.
- **v3.3.1:** Footer Dinámico y Enlaces de Redes Sociales con manejo de "en construcción". Integración de Pilares y Políticas.
- **v3.3.0:** Migración de clústeres de SEO de cola larga a matriz dinámica (`Config_SEO`). Soporte multi-inquilino para palabras clave industriales.
- **v3.2.1:** Fix de persistencia en Barra de Estado y visibilidad global (siempre on).
- **v3.2.0:** Implementación de RBAC Granular. Niveles 7 (Jr) y 8 (Sr) para Leads/Proyectos. Módulo `mantenimiento` habilitado para Nivel 9 o por ID.
- **v3.1.9:** Protección de God Tools mediante contendor oculto por nivel.
- **v3.1.3:** Synchronized Search, Sort, and UI Polish. Audit lines updated to v3.1.3.
- **v3.1.2:** Implementación de búsqueda dinámica, ordenamiento de leads por nombre y pulido estético de tablas CRUD.
- **v2.8.1:** Integración del **Modo DIARIO** de créditos. Gestión de acceso persistente y control de fecha de último ingreso por usuario.
- **v2.8.0:** Implementación de "Temperatura de Negocio" (Flujo Dinámico) por empresa (`id_empresa`) y Consola de Sistema.
- **v2.7.5:** Transición de identidad a **SuitOrg**. Implementación de Resumen Ejecutivo y esquema de módulos especializados.
- **v2.7.0:** Implementación de "Temperatura de Negocio" (Flujo Dinámico) y Consola de Sistema.

## 8. Estadísticas del Proyecto (Auditoría de Código)
*Última actualización: 2026-01-19*

| `app.js` | Lógica central, UI dinámico y Auth. | 3,210 |
| `style.css` | Diseño visual, Glassmorphism y Animaciones. | 1,694 |
| `index.html` | Estructura base y contenedores de vistas. | 1,142 |
| `backend_schema.gs` | API, Seguridad y Gestión de Base de Datos. | 221 |
| `appsscript.json` | Configuración del entorno de Apps Script. | 25 |
| `mock_data.json` | Datos de prueba para simulación local. | 105 |
| `tech_manual.md` | Documentación técnica y reglas de negocio. | 175 |
| `roadmap.md` | Seguimiento de objetivos y tareas. | 78 |
| **TOTAL** | **Volumen total de código fuente** | **6,650** |

---
*Manual generado automáticamente por Antigravity AI.*
