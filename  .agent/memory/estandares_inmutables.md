# 🛡️ Estándares Inmutables del Proyecto (Guardrails)

Este archivo es la **Única Fuente de Verdad** para el orquestador (IA). Estas reglas **NO deben ser modificadas ni ignoradas** bajo ninguna circunstancia, a menos que el usuario lo solicite explícitamente. Antes de cualquier edición de UI o lógica estructural, la IA debe consultar este archivo.

## 1. estandar-landing
- **Descripción**: Estructura integral de la Landing Page que incluye Barra de Estado, Hero/SEO Body y Footer Institucional.
- **Barra de Estado**: Identificador `BS-T`, versión, nivel de acceso y créditos. Solo visible para STAFF.
- **Cuerpo (Body)**: Hero Banner dinámico de alto impacto y Matriz SEO (Long-tail) obligatoria de alta resiliencia.
- **Footer**: Barra única negra (`#0F0F0F`) con enlaces inyectados y logos sociales con colores corporativos al hover.
- **Inactividad**: Modales del footer activan timer de 30-45s para retorno automático a `#home`.

## 2. estandar-crud
- **Descripción**: Estructura base para tablas de gestión (Leads, Proyectos, Catálogo).
- **Exportación**: DEBE incluir botones de exportación a **PDF** y **VTS** (Tab-Separated).
- **Seguridad**: La eliminación de registros está restringida a Nivel 10 (Admin).

## 3. Prioridad de Rendimiento (PFM)
- En temas de comida (isFood), las tarjetas deben ser compactas (132px) y priorizar la navegación por pestañas de categorías sobre el scroll infinito.

## 4. estandar-operacion
- **Descripción**: Lógica de negocio y flujo de datos según el tipo de empresa.
- **Inmutabilidad**: Una vez validada la operación (Alimentos, Logística, Proyectos), no se permiten cambios estructurales en el flujo de guardado.
- **Venta Express/POS**: Debe grabar obligatoriamente en `Leads`, `Proyectos` y descontar stock en `Catalogo`.
- **Interactividad**: En giros de alimentos, los botones `(+)` y `(-)` deben ser accesibles para el usuario público en todo momento.
- **Identidad Visual**: Productos "NUEVO" o en "OFERTA" deben portar una barra de color distintiva en la esquina superior derecha.
- **Notificaciones**: El mensaje de WhatsApp debe seguir estrictamente el formato definido en `.agent/workflows/orden-whatsapp.md`, asegurando que el total y el ID de orden nunca falten. Los supervisores en POS deben recibir alertas visuales de nuevos pedidos externos sincronizados cada 30 segundos.
- **Integridad de Checkout (3 Pasos)**: Cualquier cambio en el POS debe validar el flujo: 1. Compra (Cápsula visible y total operativo) -> 2. Datos y Pagos (Modal obligatorio) -> 3. WhatsApp (Clean up). Queda prohibido ocultar la cápsula de carrito para el usuario público.

## 5. estandar-creditos
- **Descripción**: Control de acceso y consumo de recursos para el personal STAFF.
- **Validación al Login**: El orquestador debe asegurar que el sistema verifique obligatoriamente la vigencia de acceso (`fecha_limite_acceso`) y el saldo de créditos (`creditos_totales` o `creditos_usuario`) antes de permitir el ingreso a módulos protegidos.
- **Bloqueo Preventivo**: Si los créditos son <= 0 o la fecha de vencimiento ha pasado, el acceso debe ser denegado con un mensaje de alerta. No se permiten accesos de staff "en blanco" o sin validación de saldo.

## 6. Orquestación y Mantenimiento
- El orquestador debe validar la existencia de estos elementos tras cada actualización significativa mediante el uso de herramientas de búsqueda (`grep_search`) o inspección visual.
- Queda prohibido dejar "workflows sueltos" o reglas sin documentar en el `roadmap.md`.
- El flujo de operación se rige por el archivo `.agent/workflows/estandar-operacion.md`.

## 7. Regla de Oro: Codificación UTF-8
- **Descripción**: Estándar de comunicación y datos para todo el sistema multi-inquilino.
- **Mandato**: Siempre configura todo (Base de datos, Script y HTML) en UTF-8 para que todos hablen el mismo "alfabeto".
- **Garantía de Integridad**:
    - Forzar la salida de texto exclusivamente en formato UTF-8.
    - Normalizar el texto eliminando caracteres de control invisibles o 'mojibake'.
    - Asegurar que tildes y la letra 'ñ' estén correctamente codificadas.
    - Limpiar datos de entrada extraños antes de procesarlos.
- **Prohibición**: No usar scripts externos (.py) para corregir encoding; la corrección debe ser nativa y preventiva en el flujo de datos.
