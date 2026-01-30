---
description: Definición del Flujo de Delivery de 3 Pasos (v4.6.0)
---

# Flujo de Delivery V2 (3 Etapas)

Este documento define la lógica operativa para la entrega de pedidos a domicilio, introduciendo el estado intermedio `EN-CAMINO`.

## 1. Estados y Transiciones

| Estado Actual | Acción del Actor | Nuevo Estado | Rol Responsable | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `PEDIDO-RECIBIDO` | "Aceptar / Cocinar" | `EN-COCINA` | Cajero / Cocina | Pedido entra a producción. |
| `EN-COCINA` | "Terminar / Empaquetar" | `LISTO-ENTREGA` | Cocina / Cajero | Pedido empaquetado y esperando en mostrador. |
| `LISTO-ENTREGA` | **"Recoger / Iniciar Ruta"** | `EN-CAMINO` | Repartidor | El repartidor toma el paquete. **Aquí desaparece del mostrador.** |
| `EN-CAMINO` | **"Finalizar (OTP)"** | `ENTREGADO` | Repartidor | Entrega física al cliente y validación de código. |

## 2. Visibilidad en Monitor (Pestañas)

### A. Cajero (Staff)
1.  **Nuevos:** `PEDIDO-RECIBIDO`.
2.  **En Cocina:** `EN-COCINA`.
3.  **Listos:** `LISTO-ENTREGA`. (Aquí ve los paquetes que estorban en su mostrador).
4.  **En Camino:** `EN-CAMINO`. (Sabe que ya salieron).
5.  **Entregados:** Historial final.

### B. Repartidor (Delivery)
*   **Enfoque Principal:** Pestaña `Listos` (Para recoger) y `En Camino` (Su carga actual).
*   **OTP:**
    *   En `LISTO-ENTREGA`: OTP **Oculto** (No puede entregar algo que no ha recogido).
    *   En `EN-CAMINO`: OTP **Visible/Activo** (Ya puede validar con cliente).

## 3. Indicadores (Botones de Alerta Cajero)
Para el cajero, el panel de alertas lateral se divide en 3 semáforos compactos:
1.  **🔵 NUEVOS:** Pedidos Web pendientes de aceptar.
2.  **🟠 POR RECOGER:** Pedidos en `LISTO-ENTREGA` (Esperando que llegue el repartidor).
3.  **🟢 ENTREGADOS (HOY):** Conteo de éxito del día.

## 4. Reglas de Negocio
*   Un pedido no puede pasar de `LISTO-ENTREGA` a `ENTREGADO` directamente sin pasar por `EN-CAMINO` (salvo override de Admin).
*   El OTP solo se solicita en el paso final.
