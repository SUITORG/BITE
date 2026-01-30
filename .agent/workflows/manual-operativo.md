---
description: Maestro de Operaciones por Giro de Negocio (Lógica de Verticales).
---

# ⚙️ MASTER WORKFLOW: Manual Operativo por Vertical

> **⚠️ REGLA DE ORO:** Siempre que se utilice este workflow, se debe reportar su ejecución a `/evaluador` para auditoría de cumplimiento.

Este documento define la **Lógica de Negocio Especializada** por industria (Verticales). Aquí residen las reglas que diferencian una pizzería (Food) de una instaladora solar (Industrial). Actúa como la "Constitución Operativa" de cada giro.

---

## 🔖 ÍNDICE DE CONTENIDOS
1.  **Clasificación de Verticales** (Detección de Giro)
2.  **Operación Food & Bebidas** (PFM/PMP)
3.  **Operación Industrial & Servicios** (Evasol/Default)
4.  **Operación Logística** (Reparto)
5.  **Reglas Técnicas Transversales**

---

## 1. 🔍 CLASIFICACIÓN DE VERTICALES
El sistema identifica el giro mediante el campo `tipo_negocio` y el `id_empresa` en `Config_Empresas`.
- **Food:** `tipo_negocio === 'Alimentos'` OR `id_empresa IN ['PFM', 'PMP', 'HMP']`.
- **Industrial:** `tipo_negocio === 'Servicios'` OR Default.

---

## 2. 🍔 OPERACIÓN FOOD & BEBIDAS (Vertical Food)

### 2.1. Interfaz y Experiencia (UX)
- **Modo Kiosco:** Usuarios públicos (Guests) pueden sumar/restar items con botones `(+)` y `(-)` en el catálogo.
- **Matriz SEO (Opcional):** A diferencia del estándar anterior, si una empresa de alimentos (PMP) configura items en `Config_SEO`, la sección **DEBE** mostrarse bajo el menú de comida. No se debe ocultar por código.
- **Marcado Visual (Etiquetas):**
  - **OFERTA:** Listón Naranja/Rojo en esquina superior derecha de la tarjeta.
  - **NUEVO:** Listón Verde/Azul en esquina superior derecha.
- **Ticket Físico (Staff POS):**
  - **Encabezado Compacto:** Logo izq + Título "TICKET DE VENTA" + Fecha/Hora der.
  - **Resumen Limpio:** Totales (Items, Subt, Envío) SIN líneas divisorias.
  - **Alineación:** Valores numéricos estrictamente justificados a la derecha.

### 2.2. Flujo de Datos & Stock (Backend)
- **Atomicidad de Venta:** Cada venta exitosa dispara 4 acciones simultáneas:
  1.  **Lead:** Crea registro en `Leads` (Cliente).
  2.  **Proyecto:** Crea registro en `Proyectos` con estado `PEDIDO-RECIBIDO`.
  3.  **Stock:** Descuenta cantidad en `Catalogo` (Columna `stock`).
  4.  **Finanzas:** Registra entrada en `Proyectos_Pagos` y `Pagos`.
- **Monitor de Cocina:**
  - Cada tarjeta de orden muestra Fecha/Hora creación formato compacto: `AAMMDDhhmm` (2601231330).

### 2.3. Ciclo de Vida del Pedido (Estados)
El flujo DEBE ser estrictamente secuencial:
1.  `PEDIDO-RECIBIDO` (Entra por Web o Caja).
2.  `EN-COCINA` (Staff toma la orden).
3.  `LISTO-ENTREGA` (Empaquetado).
4.  `ENTREGADO` (Cliente recibe).

### 2.4. Reglas de Roles (Food Specific)
- **Supervisor (Nivel 6+):**
  - Ve una **Alerta de Pedidos Externos** (caja discreta a la izquierda en POS).
  - Contador de pedidos `CLIENTE-URL` en estado `PEDIDO-RECIBIDO`.
  - Sincronización cada 30s. Disminuye al cambiar estado a `EN-COCINA`.
- **Repartidor vs Staff:**
  - **Pedidos Locales:** Staff (Cajero) puede llevar a `ENTREGADO`.
  - **Pedidos Web (OTS):** Solo usuario con rol `REPARTIDOR` o Admin puede marcar `ENTREGADO` (Validación OTP recomendada).

---

## 3. 🏭 OPERACIÓN INDUSTRIAL & SERVICIOS (Vertical Default)

### 3.1. Flujo CRM Clásico
- **Enfoque:** Gestión de relación a largo plazo, no venta impulsiva.
- **Ciclo:** Captura Lead -> Cotización -> Negociación -> Proyecto -> Instalación.
- **Métrica:** Avance porcentual basado en pesos definidos en `Config_Flujo_Proyecto`.

### 3.2. Finanzas
- Pagos parciales (anticipos) contra un mismo `id_proyecto`.

---

## 4. 🚚 OPERACIÓN LOGÍSTICA
- **Validación de Entrega:** Uso obligatorio de tokens (OTP) o firma digital para cambio de estado a `ENTREGADO`.
- **Interfaz:** Monitor de Rutas (Lista compacta de direcciones).

---

## 5. 🛠️ REGLAS TÉCNICAS TRANSVERSALES

1.  **Integridad de Datos:** Las ventas "Express" (Food) POBLAN las tablas `Leads` y `Proyectos`. No existen "ventas fantasmas" que solo muevan dinero sin crear proyecto.
2.  **Persistencia Segura:** Prohibido el `deleteRow`. Las cancelaciones son cambios de estado a `CANCELADO` (Soft Delete).
3.  **Orquestador Check:**
    - Antes de desplegar, validar que `app.ui.renderPOS` respete la lógica de `isFood`.
    - Verificar que los botones de operación (`+`, `-`) no queden ocultos por reglas de "Foco Staff" cuando el usuario es Público.
