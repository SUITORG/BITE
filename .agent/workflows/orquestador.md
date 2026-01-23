---
description: Orquestador inteligente de tareas y flujos del sistema.
// turbo-all
---
# Workflow: Orquestador del Sistema

Este workflow actúa como el cerebro de la interacción, clasificando la entrada del usuario y delegando la ejecución a los workflows especializados.

### 1. Clasificación de Entrada (Triage)
Antes de actuar, el agente debe categorizar la solicitud en uno de los siguientes cubos:

| Categoría | Descripción | Acción / Workflow Destino |
| :--- | :--- | :--- |
| **Pregunta General** | Consultas sobre cómo funciona el sistema o información del negocio. | Consulta `Base de Conocimientos` o `tech_manual.md`. |
| **Solicitud de Nueva Función** | Pedido de creación de módulos, botones, lógica o cambios de UI. | `/estandar-crud`, `/barra-estado`, o `/multi-inquilino`. |
| **Error / No funciona** | Comportamiento inesperado, bugs, etiquetas raras o fallos de conexión. | `/optimizacion-recursos` (Memoria) + `/multi-inquilino`. |
| **Mantenimiento / Sync** | Cambios en el backend o necesidad de actualizar versiones. | `/integridad-total` + `/arquitectura-tablas`. |
| **Limpieza de UI** | Ajustes de visibilidad para staff o reducción de ruido. | `/foco-staff`. |

### 2. Protocolo de Ejecución

#### A. Si es un ERROR (No funciona):
1. **Validación Cruzada**: Activar `/multi-inquilino` para verificar si el fallo es global o específico de una empresa.
2. **Activar `/optimizacion-recursos`**: Buscar si el error tiene una "Huella Digital" en `soluciones.md`.
3. **Reparar**: Aplicar el parche documentado asegurando no romper otras empresas.
4. **Verificar**: Probar la solución en al menos dos contextos de `id_empresa`.
5. **Documentar**: Si es un error nuevo, registrarlo en la memoria.

#### B. Si es una SOLICITUD (Funcionalidad):
1. **Activar `/planeacion` (OBLIGATORIO)**: Antes de tocar el código, realizar el análisis de sesgos, dependencias y adaptación semántica multi-inquilino. Presentar el Plan de Acción al usuario.
2. **Validar Permisos**: Consultar `/niveles-acceso` si la función implica roles (RBAC).
3. **Aislamiento**: Seguir `/multi-inquilino` para que la función sea configurable y no hardcodeada.
4. **Base de Datos**: Consultar `/arquitectura-tablas` para asegurar consistencia en las columnas de Sheets.
5. **Implementar**: Seguir `/estandar-crud` para módulos de datos o `/barra-estado` para el UI header.
6. **Limpieza Automatizada**: Aplicar `/foco-staff` si la función implica estados de login.
5. **Control de Créditos**: Validar disponibilidad con `/politicas-creditos`.

#### C. Si es una PREGUNTA (Saber):
1. **Investigar**: Leer `tech_manual.md` y archivos de configuración.
2. **Responder**: Explicar de forma técnica pero amigable.

### 3. Mantenimiento Preventivo y Limpieza de Memoria
*Este paso es PRIORITARIO y debe ejecutarse al inicio de tareas pesadas o al detectar saturación.*
- **Antigüedad**: Borrar errores/soluciones de >30 días con baja frecuencia en `soluciones.md`.
- **Uso**: Eliminar soluciones obsoletas que no han sido consultadas.
- **Salud del Backend**: Ejecutar purga de logs si el archivo `backend_schema.gs` reporta auditorías elevadas.
- **Duplicados**: Fusionar registros de errores idénticos para optimizar el contexto.

### 4. Cierre de Ciclo de Vida
Una vez completada la acción principal, el Orquestador **siempre** debe verificar si se requiere sincronización:
- **Ejecutar `/integridad-total`**: Para asegurar versiones, manuales y roadmap al unísono.
- **Persistencia de Contenido**: Verificar que las secciones de información críticas (como `Config_SEO`) permanezcan visibles en el landing independientemente del tema aplicado (Industria o Comida).
- **Ejecutar `/checkpoint` (CRÍTICO)**: Registrar la solicitud, actualizar versión de backend si aplica, y solicitar el "Visto Bueno" del usuario para congelar la función.
- **Calibración con `/evaluador`**: Analizar el resultado final para actualizar la memoria de lecciones aprendidas y mejorar la siguiente interacción.
- **Resumen Ejecutivo Final (OBLIGATORIO)**: El agente debe cerrar su respuesta con un bloque de texto que especifique:
    1. **Workflows participantes**: Lista de archivos `.md` en `.agent/workflows/` que se consultaron o ejecutaron.
    2. **Workflows/Agentes NO participantes**: Breve mención de qué lógica se descartó y por qué (ej: "No se usó `/politicas-creditos` porque la función no implica consumo de saldo").
    3. **Resultado del Evaluador**: Resumen de la calificación de la tarea (ej: "Puntaje: 10/10 - Cumple con estética BK-Style y multi-inquilino").
    4. **Sugerencias de Mejora**: 2-3 acciones proactivas para el USER.

---
*Este workflow debe ser consultado al inicio de cada nueva interacción con el agente.*
