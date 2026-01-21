---
description: Guía para configurar y validar niveles de acceso (RBAC) en la aplicación
---

Este workflow asegura que los permisos de usuario estén correctamente configurados entre el Backend (Google Sheets) y el Frontend (app.js).

### Pasos a seguir:

1. **Verificación en Backend (Google Sheets):**
   - **Pestaña `Usuarios`:** 
     - Verifica que el usuario tenga asignado el `id_empresa` correcto (ej. `SuitOrg` o `EVASOL`).
     - Asegúrate de que no haya espacios extra en el `username`, `email` o `password`.
   - **Pestaña `Config_Roles`:**
     - Asegúrate de que el `id_rol` asignado al usuario exista en esta tabla para su empresa.
     - Verifica que el `nivel_acceso` sea el correcto (Admin >= 10, Staff >= 5).
     - La columna `modulos_visibles` define qué puede ver (ej: `#leads, #projects, #pos`).

2. **Resolución de Problemas (Troubleshooting):**
   - **Error "Usuario no encontrado":** 
     - Revisa la consola del navegador (F12). Si aparece `USER_FOUND_BUT_WRONG_COMPANY`, significa que el usuario existe pero estás intentando entrar en la URL de la empresa equivocada. 
     - Usa el parámetro `?co=NOMBRE_EMPRESA` en la URL o selecciona la burbuja correcta en el inicio.
   - **Error de Roles:**
     - Si aparece `ROLE_NOT_FOUND` en la consola, el rol del usuario no está configurado en `Config_Roles`.

3. **Sincronización de Datos:**
   - En la aplicación, haz clic en **"Staff"** -> **"Reparar DB"** para forzar la creación de tablas faltantes y verificar encabezados.

4. **Validación de Lógica:**
   - Revisa la función `app.ui.setLoggedInState` en `app.js` para confirmar que los elementos de UI se ocultan/muestran según el nivel.

// turbo
5. **Verificación Final:**
   - Ejecuta `console.log(app.state.currentUser)` tras loguear para ver los permisos efectivos cargados.
