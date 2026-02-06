---
description: orquestador-modo-seguro
---

# Workflow: Orquestador del Sistema (MODO SEGURO)

Este workflow actúa como el cerebro de la interacción, clasificando la entrada del usuario y delegando la ejecución a los workflows especializados.  
Siempre debe ejecutarse al inicio de cada nueva interacción con el agente.

---

## 0. MODO SEGURO Y LENGUAJE CONTROLADO

### 0.1 Reglas de seguridad (OBLIGATORIO)
- No realices NINGÚN cambio en archivos de código, base de datos o configuración sin antes:
  1) Proponer un **Plan de Trabajo** numerado y específico.
  2) Preguntar explícitamente al usuario:  
     `¿Apruebas este plan? Responde exactamente con APROBADO o RECHAZADO.`
  3) Solo si el usuario responde **APROBADO** puedes ejecutar cambios.
- Si el usuario no responde con `APROBADO`, solo debes:
  - Analizar, explicar, diagnosticar, o proponer alternativas.
  - NO ejecutar modificaciones en el proyecto.

### 0.2 Protocolo de interpretación de mensajes
- Todo lo que el usuario escriba entre `[[` y `]]` es **contexto/comentario**, NO es una instrucción ejecutable.
- Solo se debe tratar como instrucción ejecutable lo que esté en alguno de estos formatos:
  - `ACCION:` …  
  - `TAREA:` …
- Si el mensaje mezcla contexto e instrucciones sin seguir estos formatos:
  - Primero pide al usuario que reescriba su solicitud usando `[[contexto]]` y `ACCION:` / `TAREA:` antes de actuar.
- Nunca interpretes una **pregunta** como autorización para cambiar código.

### 0.3 Regla de Consumo de Créditos (OBLIGATORIA)

No ejecutes búsquedas globales ni análisis masivos del repositorio si el usuario solo pide un ajuste visual o puntual.

Antes de escanear muchos archivos, propón un Plan de Trabajo corto y pregunta:
¿Quieres que haga un análisis global del código? Esto consumirá más créditos. Responde APROBADO o NO.

Si el usuario no responde APROBADO, limita tu análisis a:
- El archivo o bloque de código que el usuario proporcionó.
- A lo sumo 1–2 archivos directamente relacionados (mismo módulo o carpeta).

Supón que conoces el proyecto actual y evita “re-descubrir” todo el código en cada petición.

---

## 1. Clasificación de Entrada (Triage)

Antes de actuar, el agente debe categorizar la solicitud en uno de los siguientes cubos:

| Categoría                 | Descripción                                                          | Acción / Workflow Destino                             |
| :------------------------ | :------------------------------------------------------------------- | :---------------------------------------------------- |
| **Pregunta General**      | Consultas sobre cómo funciona el sistema o información del negocio. | Consulta `Base de Conocimientos` o `tech_manual.md`.  |
| **Solicitud de Nueva Función** | Creación de módulos, botones, lógica o cambios de UI.          | `/estandar-crud`, `/estandar-landing`, o `/backend-core`. |
| **Error / No funciona**   | Bugs, comportamientos raros, fallos de conexión.                    | `/optimizacion-recursos` + `/backend-core`.          |
| **Mantenimiento / Sync**  | Cambios en backend, versiones, sincronización.                      | `/backend-core` (Integridad Total).                  |
| **Limpieza de UI**        | Ajustes de visibilidad, reducción de ruido visual.                  | `/reglas-negocio` (Foco Staff).                      |

Si la categoría no es clara, primero haz preguntas de aclaración antes de tocar código.

---

## 2. Protocolo de Ejecución

### A. Si es un ERROR (No funciona)
1. **Validación Cruzada**: Activar `/backend-core` (Sección Multi-Inquilino) para verificar si el fallo es global o específico de una empresa.
2. **Activar `/optimizacion-recursos`**: Buscar si el error tiene una "Huella Digital" en `soluciones.md`.
3. **Proponer Plan de Trabajo**: 
   - Describir pasos concretos, archivos a tocar, y componentes afectados.
   - Esperar `APROBADO` antes de reparar.
4. **Reparar**: Aplicar el parche documentado asegurando no romper otras empresas.
5. **Verificar**: Probar la solución en al menos dos contextos de `id_empresa`.
6. **Documentar**: Si es un error nuevo, registrarlo en la memoria.

### B. Si es una SOLICITUD (Funcionalidad)
1. **Activar `/planeacion` (OBLIGATORIO)**:
   - Analizar sesgos, dependencias y adaptación multi-inquilino.
   - Generar un **Plan de Acción** con:
     - Archivos a modificar.
     - Componentes/IDs específicos.
     - Tipo de cambio (UI, lógica, datos).
   - Preguntar al usuario si aprueba el plan (requiere `APROBADO`).
2. **Validar Permisos**: Consultar `/reglas-negocio` (Niveles de Acceso) si implica roles (RBAC).
3. **Aislamiento**: Seguir `/backend-core` para que la función sea configurable y no hardcodeada.
4. **Base de Datos**: Consultar `/backend-core` (Arquitectura) para asegurar consistencia en columnas de Sheets.
5. **Implementar** (solo tras `APROBADO`):
   - Usar `/estandar-crud` para módulos de datos.
   - Usar `/estandar-landing` para estructura visual (Header, Body, Footer).
6. **Limpieza Automatizada**: Aplicar `/reglas-negocio` (Foco Staff) si la función implica estados de login.
7. **Control de Créditos**: Validar disponibilidad con `/reglas-negocio` (Políticas de Créditos).
8. **Ventas y Checkout**: Si implica dinero o pedidos, consultar `/flujo-ventas`.
9. **Lógica por Industria**: Para Food vs Industrial, consultar `/manual-operativo`.

---

## 2.1 Límites de Modificación (CRÍTICO)

- No crear ni eliminar rutas/páginas salvo que el usuario use una instrucción explícita:
  - `ACCION: crear nueva página ...`
  - `ACCION: eliminar página ...`
- No eliminar componentes existentes a menos que el usuario lo pida con:
  - `ACCION: eliminar componente ...`
- Si la solicitud menciona “un botón” o “un texto”:
  - Solo está permitido modificar ese botón/texto (estilos, tamaño, copy), sin alterar la estructura de la página.
- No reescribir archivos completos si solo se requiere un cambio parcial:
  - Trabajar con el **diff mínimo** necesario.
- Antes y después de cambios, validar que las secciones críticas sigan presentes (ver Invariantes).

---

## 2.2 Invariantes de UI (Inicio y POS/Express)

Estas reglas NO pueden violarse sin una instrucción explícita del usuario.

- **Inicio (Landing SEO)**:
  - Debe existir el contenedor principal `#seo-matrix-section` (o el ID definido por el proyecto).
  - Este contenedor debe seguir mostrando la matriz SEO y ser responsivo.
- **POS/Express (Pedido Express)**:
  - Debe existir el contenedor principal `#pos-express-section`.
  - Debe seguir leyendo y mostrando productos desde la tabla `Catalogo` (o fuente de datos equivalente).

Si una modificación propuesta pone en riesgo estas secciones:
- El agente debe:
  - Advertir al usuario.
  - Incluir el impacto en el Plan de Trabajo.
  - No ejecutar nada hasta recibir `APROBADO`.

---

## 3. Mantenimiento Preventivo y Limpieza de Memoria

Este paso es PRIORITARIO al inicio de tareas pesadas o al detectar saturación.

- **Antigüedad**: Borrar errores/soluciones de >30 días con baja frecuencia en `soluciones.md`.
- **Uso**: Eliminar soluciones obsoletas que no han sido consultadas.
- **Salud del Backend**: Ejecutar purga de logs si `backend_schema.gs` reporta auditorías elevadas.
- **Duplicados**: Fusionar registros de errores idénticos para optimizar contexto.

---

## 4. Cierre de Ciclo de Vida

Una vez completada la acción principal (y solo después de `APROBADO`):

1. **Ejecutar `/integridad-total`**:
   - Asegurar coherencia de versiones, manuales y roadmap.

2. **Persistencia de Contenido Crítico**:
   - Verificar que:
     - `Inicio` sigue mostrando `#seo-matrix-section` (matriz SEO).
     - `POS/Express` sigue mostrando productos desde `Catalogo` en `#pos-express-section`.

3. **Ejecutar `/checkpoint` (CRÍTICO)**:
   - Registrar la solicitud.
   - Actualizar versión de backend si aplica.
   - Solicitar el "Visto Bueno" final del usuario para congelar la función.

4. **Calibración con `/evaluador`**:
   - Analizar el resultado final para actualizar la memoria y mejorar la siguiente interacción.

5. **Resumen Ejecutivo Final (OBLIGATORIO)**:
   El agente debe cerrar su respuesta con un bloque que incluya:
   - **Workflows participantes**: Archivos `.md` en `.agent/workflows/` consultados o ejecutados.
   - **Workflows/Agentes NO participantes**: Qué lógica se descartó y por qué.
   - **Resultado del Evaluador**: Ejemplo:  
     `Puntaje: 10/10 - Cumple con estética BK-Style y multi-inquilino.`
   - **Alerta de Versión**: Indicar si hubo incremento en versión del sistema (Frontend) o `backend_schema.gs` (Backend).
   - **Estado de secciones críticas**:
     - `Inicio (SEO): [OK/ERROR]`
     - `POS/Express (Catalogo): [OK/ERROR]`
   - **Archivos modificados**: Lista explícita.
   - **Archivos críticos NO modificados**: Resaltar que no fueron tocados.
   - **Sugerencias de Mejora**: 2–3 acciones proactivas para el usuario.

---

*Este workflow debe ser consultado al inicio de cada nueva interacción con el agente y respetado como contrato de operación en MODO SEGURO.*
