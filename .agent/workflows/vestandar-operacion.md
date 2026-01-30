---
description: Estándar de Operación por Giro de Negocio (SuitOrg)
---

# ⚙️ Estándar de Operación (Workflow)

Este workflow define cómo debe comportarse la operación (ventas y flujo de datos) según el giro del negocio. Una vez validado por el usuario, este estándar es **INMUTABLE**.

## 1. Clasificación de Operaciones
El sistema debe identificar el giro del negocio mediante el campo `tipo_negocio` en la tabla `Config_Empresas`.

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

## 2. Reglas Técnicas de Operación
1. **Consistencia de Tablas**: Todas las ventas "Express" deben caer en `Leads` y `Proyectos` invariablemente para mantener la trazabilidad.
2. **Interactividad**: Los botones de incremento/decremento `(+)` / `(-)` en el sitio público deben estar siempre visibles y funcionales para el giro de Alimentos.
3. **Persistencia**: No se permiten borrados físicos de operaciones; solo cambios de estado a `ELIMINADO` o `CANCELADO`.

## 3. Validación de Orquestador
Antes de entregar una modificación de backend o frontend, el orquestador debe:
1. Verificar que el `id_empresa` actual corresponde al flujo esperado.
2. Validar que la deducción de stock está implementada en el endpoint de venta.
3. Asegurar que los botones de operación no están ocultos por roles de personal STAFF cuando el usuario es Público.
4. Monitorear que el ingreso de personal STAFF cumpla estrictamente con la política de créditos y fecha de corte. Si un usuario no tiene saldo o su fecha ha vencido, el orquestador debe considerar la sesión como bloqueada e informar el motivo puntual.
