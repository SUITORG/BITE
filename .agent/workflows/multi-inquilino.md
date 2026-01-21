Este workflow asegura que la aplicación funcione correctamente para múltiples empresas (inquilinos) sin que los cambios en una afecten a las demás, manteniendo siempre la integridad de la interfaz pública y el cumplimiento de las políticas de negocio.

### 0. Filosofía: Configuración antes que Personalización
**REGLA DE ORO:** Nunca modifiques código base para resolver una necesidad de una sola empresa. 
- **Malo:** `if (app.state.companyId === 'EMPRESA_X') { showEspecialFeature(); }`
- **Bueno:** `if (app.config.empresa.usa_funcionalidad_especial) { showEspecialFeature(); }` (Donde `usa_funcionalidad_especial` es una columna en `Config_Empresas`).

### 1. Aislamiento de Datos (Data Isolation):
- **Lectura Obligatoria:** Antes de cualquier cambio, se DEBEN consultar las tablas `Config_Empresas`, `Usuarios` y `Config_Roles`.
- **Filtro de Empresa:** Todas las consultas y filtros en `app.js` deben usar `app.state.companyId` para asegurar que un usuario de la "Empresa A" nunca vea datos de la "Empresa B".
- **Estructura Compartida:** Si se agrega una columna nueva en Google Sheets para una empresa, esta debe ser opcional o manejada con valores por defecto para no romper el flujo de las demás empresas.

### 2. Integridad de la Interfaz (UI Persistence):
- **Header y Footer Siempre Visibles:** El encabezado (`#main-header`) y el pie de página (si existe) NUNCA deben ocultarse, incluso si los datos de la empresa no se han cargado.
- **Fallbacks (Valores por Defecto):** Si un dato como el `slogan` o `logourl` está vacío en `Config_Empresas`, se debe mostrar un valor genérico o el nombre de la plataforma (SuitOrg) en lugar de dejar el espacio en blanco o roto.

### 3. Gestión de Contenido Vacío (Modo Remodelación):
Si un módulo o sección (ej. Galería, Catálogo de Productos) no tiene registros para la empresa actual:
- **Validación:** Comprobar si `list.length === 0`.
- **Mensaje de Bloqueo:** En lugar de mostrar una pantalla blanca o un error de consola, se debe inyectar un mensaje amigable:
  - *“🚧 Sección en Remodelación: Estamos preparando contenido increíble para ti. Vuelve pronto.”*
- **Persistencia de Navegación:** El usuario debe poder seguir navegando a otras secciones sin que la aplicación se congele.

### 4. Flujo de Validación de Cambios & Auditoría:
- **Paso A:** Realizar el cambio para la empresa solicitante.
- **Paso B (Cruce):** Cambiar el `app.state.companyId` a una empresa diferente.
- **Paso C:** Verificar que la interfaz de la empresa B no haya cambiado y que no haya errores de "undefined" por falta de columnas o configuraciones nuevas.
- **Paso D (Políticas):** Confirmar que las políticas de `/politicas-creditos` y `/niveles-acceso` se aplican de forma aislada (ej. si una empresa es `GLOBAL` y otra `USUARIO`, el contador de la barra de estado debe cambiar de formato correctamente).

### 5. Coordinación de Workflows:
Cualquier cambio en multi-tenancy debe ser verificado contra:
1.  **`/barra-estado`**: ¿Se muestra el ID de la empresa correcta?
2.  **`/estandar-crud`**: ¿Los datos que se crean/editan tienen el `id_empresa` correcto?
3.  **`/sincronizar-version`**: ¿Se actualizó la versión global sin romper los filtros de empresa?

// turbo
// turbo
6. **Verificación de Seguridad:**
   - Revisa que no existan llamadas a `app.data` sin filtrar por `id_empresa` en funciones de renderizado.
   - Valida que las nuevas columnas en `Config_Empresas` tengan un valor por defecto para empresas existentes.
