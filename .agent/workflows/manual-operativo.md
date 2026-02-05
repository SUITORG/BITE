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



### A. Giro Alimentos (isFood: PFM/PMP/HMP)
- **Interfaz Principal**: POS (Point of Sale) y Pedido Express.
- **Acciones Permitidas**:
    - Usuarios públicos (Guests) pueden usar botones `(+)` y `(-)` en el catálogo.
    - El staff puede operar el `staff-pos` con ticket físico.
- **Monitor de Cocina**:
    - Cada orden debe mostrar la fecha y hora de creación en formato `AAMMDDhhmm` (ej. 2601231330) en la esquina superior derecha de la tarjeta.
- **Destino de Datos**:
    - Cada venta genera un registro en `Leads` (Prospecto).
    - Cada venta genera un registro en `Proyectos` con estado `PEDIDO-RECIBIDO`.
    - Cada venta descuenta automáticamente el stock en `Catalogo`.
    - Se registra el pago en `Proyectos_Pagos` y `Pagos`.
- **Diseño de Ticket (Caja/POS)**:
    - El encabezado debe ser compacto: Logo a la izquierda, título "TICKET DE VENTA" y fecha/hora a la derecha.
    - El resumen de totales (Items, Subtotal, Envío) no debe tener líneas divisorias entre ellos.
    - Todos los valores numéricos del resumen deben estar estrictamente justificados a la derecha.
- **Marcado Visual (Etiquetas)**:
    - Productos con la etiqueta "NUEVO" u "OFERTA" deben mostrar obligatoriamente un listón o barra de color en la esquina superior derecha de su tarjeta.
    - Colores: Naranja/Rojo para OFERTA, Verde/Azul para NUEVO (o según tema).
- **Alerta de Pedidos Externos (Supervisor)**:
    - En la vista `staff-pos`, los supervisores (Nivel 6 + Todos los módulos) deben ver una caja de notificación discreta a la izquierda.
    - Indica el número de pedidos nuevos (`PEDIDO-RECIBIDO`) de origen web (`CLIENTE-URL`).
    - El conteo se sincroniza automáticamente cada 30 segundos.
    - **Disminución dinámica**: El número disminuye automáticamente cuando el staff marca el pedido como "EN-COCINA".
- **Flujo de Estados Coherente**:
    - `PEDIDO-RECIBIDO` -> `EN-COCINA` -> `LISTO-ENTREGA` -> `ENTREGADO`.
    - **Pedidos Locales**: El staff (Cajero/Cocina) puede completar todo el ciclo hasta `ENTREGADO`.
    - **Pedidos OTS (Web)**: Solo un usuario con rol `REPARTIDOR` o `DELIVERY` (o Admin) puede marcar el pedido como `ENTREGADO`, cumpliendo con el estándar de validación OTP. El staff solo ve el estado "Esperando Repartidor" en este punto.


### B. Giro Proyectos / Servicios (Default)
- **Interfaz Principal**: CRM / Tablas de Gestión.
- **Flujo**: Captura de Lead -> Seguimiento -> Convertir a Proyecto -> Avance por etapas.
- **Destino de Datos**:
    - Avance porcentual basado en `Config_Flujo_Proyecto`.
    - Pagos parciales registrados en `Proyectos_Pagos`.

### C. Giro Logística / Distribución
- **Interfaz Principal**: Monitor de Pedidos.
- **Validación**: Uso obligatorio de OTP para confirmación de entrega.
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

### 2.5. SOP Técnico POS/Express (18 Pasos de Inicio a Fin)

Este documento contiene la copia de seguridad de los pasos técnicos definidos en el manual operativo para el proceso de venta POS y Express.

### A. Preparación y Selección
1.  **`addToCart(id)`**: Valida stock, agrega el producto al arreglo `app.state.cart` y aumenta cantidades.
2.  **`updateCartVisuals()`**: Recalcula subtotales, totales con envío y actualiza los badges de la UI.
3.  **`setDeliveryMethod(method)`**: Define si es "DOMICILIO" o "PICKUP", ajustando costos de envío y visibilidad de dirección.

### B. Configuración de Pago y Cliente
4.  **`openCheckout()`**: Abre el modal de compra y prepara el entorno del ticket express.
5.  **`handlePayMethodChange()`**: Gestiona la visibilidad de datos bancarios y captura de folio para transferencias.
6.  **`renderExpressTicket()`**: Genera el resumen visual de productos y costos para el cliente.

### C. Procesamiento Transaccional y OTP
7.  **`checkout(forcedStaff)`**: Valida datos, prepara el descuento de inventario y genera el código OTP de 4 dígitos.
8.  **`app.apiUrl / processFullOrder`**: Envío síncrono al backend para crear Lead, Pedido (con OTP), Pago y actualizar Stock.
9.  **`nextStep(3)`**: Muestra la confirmación de éxito con el Folio de Orden y el código OTP para el cliente.
10. **`sendWhatsApp()`**: Envía el resumen completo de la orden incluyendo el OTP al número del negocio.

### D. Ciclo de Seguimiento (Monitor POS)
11. **`renderPOS()`**: Pinta las tarjetas de pedidos en el monitor aplicando filtros por estatus.
12. **`filterPOS(status)`**: Clasifica los pedidos en el monitor según su etapa actual (Nuevos, Cocina, Listos, Camino, Entregados).
13. **`updateOrderStatus(id, 'EN-COCINA')`**: Cambia el pedido a preparación; el monitor actualiza la tarjeta visualmente.
14. **`updateOrderStatus(id, 'LISTO')`**: Marca el pedido como terminado en cocina y disponible para entrega o repartidor.
15. **`updateOrderStatus(id, 'EN-CAMINO')`**: Indica que el pedido ha salido de la sucursal (exclusivo para envíos a domicilio).

### E. Validación Final de Entrega
16. **`updateOrderStatus(id, 'ENTREGADO')`**: Dispara la lógica de verificación; si el pedido tiene OTP, detiene el flujo para validación.
17. **`showOtpEntry(id, status, correctOtp)`**: Abre el teclado numérico para que el repartidor ingrese el código que el cliente le entrega.
18. **`verifyOtp()`**: Compara el código; si es correcto, ejecuta el cambio de estatus final en el servidor y cierra la orden.

### F. Protocolos de Integridad y Robustez (v4.7.5)
19. **`Visitor Watchdog`**: Reinicio automático a Hub Orbit tras 5 minutos de inactividad para usuarios visitantes (Public).
20. **`Total Transparency`**: Garantía visual de total a $0.00 al limpiar el carrito, desactivando cargos de envío si no hay productos.
21. **`Contact Shielding`**: Inyección redundante de dirección y teléfono en la descripción de la orden para visualización garantizada en el monitor.
22. **`Omnidirectional Flow`**: Flexibilidad para que el Staff pueda revertir o avanzar estados en el monitor POS según la operación.
---
### 2.6 pasos de Venta POS Staff en la sección 

💼 Flujo Venta POS Staff (15 Pasos)
1 addToCart : Selección en terminal.
2 updateCartVisuals : Actualización sidebar.
3 Captura Cliente: Nombre/Tel (opcional).
4 Pago: Método y folio en terminal.
5 checkoutStaff : Puente de datos.
6 checkout(true) : Transacción forzada Staff.
7 Sincronización: Envío atómico al backend.
8 Confirmación de Impresión: Diálogo nativo.
9 printTicket: Emisión ticket físico.
10 clearCart: Limpieza completa.
11 renderPOS : Aparición con badge LOCAL.
12 updateOrderStatus(EN-COCINA) : Inicio preparación.
13 updateOrderStatus(LISTO) : Preparado para entrega.
14 updateOrderStatus(ENTREGADO) : Cierre directo (Sin OTP).
15 updateLastSaleDisplay: Actualización tablero de caja.

## 3. 🏭 OPERACIÓN INDUSTRIAL & SERVICIOS (Vertical Default)

### 3.1. Flujo CRM Clásico
- **Enfoque:** Gestión de relación a largo plazo, no venta impulsiva.
- **Ciclo:** Captura Lead -> Cotización -> Negociación -> Proyecto -> Instalación.
- **Métrica:** Avance porcentual basado en pesos definidos en `Config_Flujo_Proyecto`.

### 3.2. Finanzas
- Pagos parciales (anticipos) contra un mismo `id_proyecto`.

---
3.  **Orquestador Check (Puntos de Control):**
    1.  **Validación de Entorno**: Verificar que el `id_empresa` actual corresponde estrictamente al flujo de negocio esperado.
    2.  **Integridad Transaccional**: Validar que la deducción de stock esté correctamente implementada en el endpoint de venta o función `processFullOrder`.
    3.  **Lógica Visual**: Asegurar que `app.ui.renderPOS` respecte la lógica de `isFood` para el despliegue de tarjetas.
    4.  **Acceso Público**: Verificar que los botones de operación (`+`, `-`) NO queden ocultos por reglas de "Foco Staff" o roles de personal cuando el usuario es Público.
    5.  **Validación de Acceso Staff (Créditos/Corte)**: Monitorear que el ingreso de personal cumpla estrictamente con la política de créditos y fecha de corte. Si un usuario no tiene saldo o su fecha ha vencido, la sesión se considera **BLOQUEADA** y se debe informar el motivo puntual en la consola.
    6.  **Interactividad Universal**: Los botones [(+)](cci:1://file:///c:/Users/ADMIN/.gemini/antigravity/playground/SUITORGSTORE01/js/modules/pos.js:946:8-946:53) / [(-)](cci:1://file:///c:/Users/ADMIN/.gemini/antigravity/playground/SUITORGSTORE01/js/modules/pos.js:946:8-946:53) en el sitio público siempre deben estar visibles y funcionales para el giro Food, garantizando que el usuario pueda armar su carrito sin fricciones.mbio de estado a `ENTREGADO`.
- **Interfaz:** Monitor de Rutas (Lista compacta de direcciones).

---

## 5. 🛠️ REGLAS TÉCNICAS TRANSVERSALES

1.  **Integridad de Datos:** Las ventas "Express" (Food) POBLAN las tablas `Leads` y `Proyectos`. No existen "ventas fantasmas" que solo muevan dinero sin crear proyecto.
2.  **Persistencia Segura:** Prohibido el `deleteRow`. Las cancelaciones son cambios de estado a `CANCELADO` (Soft Delete).
