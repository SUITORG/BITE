/**
 * EVASOL - AUTH MODULE
 * Responsabilidad: Gestión de sesiones, login, logout y lógica de créditos.
 */
app.auth = {
    login: (userOrEmail, password) => {
        console.log("🔑 Intentando login para:", userOrEmail);
        const userOrEmailClean = (userOrEmail || "").toString().trim().toLowerCase();
        const getVal = (obj, keys) => {
            const foundKey = Object.keys(obj).find(k => keys.includes(k.toLowerCase().trim()));
            return foundKey ? (obj[foundKey] || "").toString().trim() : "";
        };
        const user = (app.data.Usuarios || []).find(u => {
            const email = getVal(u, ['email', 'correo', 'mail']);
            const username = getVal(u, ['username', 'usuario', 'user', 'login']);
            const nombre = getVal(u, ['nombre', 'name', 'full_name']);
            const coId = getVal(u, ['id_empresa', 'empresa', 'company']);
            const sCo = (app.state.companyId || "").toString().trim().toUpperCase();
            const matchId = (email.toLowerCase() === userOrEmailClean || username.toLowerCase() === userOrEmailClean || nombre.toLowerCase() === userOrEmailClean);
            const matchCo = (coId.toUpperCase() === sCo || coId.toUpperCase() === "GLOBAL");
            return matchId && matchCo;
        });
        if (!user) {
            return { success: false, msg: "Usuario no encontrado en esta empresa" };
        }
        const sheetPass = getVal(user, ['password', 'contraseña', 'pass', 'clave']);
        if (sheetPass !== (password || "").toString().trim()) {
            return { success: false, msg: "Contraseña incorrecta" };
        }
        // Resolución de permisos
        const company = app.data.Config_Empresas.find(c => c.id_empresa === app.state.companyId);
        const origenPoliticas = (company && company.origen_politicas) || "ROL";
        const modoCreditos = (company && company.modo_creditos) || "USUARIO";
        let effectiveLevel = parseInt(getVal(user, ['nivel_acceso', 'nivel', 'access_level'])) || 0;
        let effectiveModules = "";
        let effectiveCredits = parseInt(getVal(user, ['creditos', 'credits'])) || 0;
        if (origenPoliticas === "ROL" && app.data.Config_Roles) {
            const uRoleId = getVal(user, ['id_rol', 'rol', 'role']).toUpperCase();
            const sCoId = (app.state.companyId || "").toString().trim().toUpperCase();
            const roleData = app.data.Config_Roles.find(r => {
                const rRoleId = getVal(r, ['id_rol', 'rol', 'role']).toUpperCase();
                const rCoId = getVal(r, ['id_empresa', 'empresa', 'company']).toUpperCase();
                return rRoleId === uRoleId && (rCoId === sCoId || rCoId === "GLOBAL");
            });
            if (roleData) {
                effectiveLevel = parseInt(getVal(roleData, ['nivel_acceso', 'nivel'])) || effectiveLevel;
                effectiveModules = getVal(roleData, ['modulos_visibles', 'permisos', 'modulos']);
                if (modoCreditos !== "GLOBAL") effectiveCredits = parseInt(getVal(roleData, ['creditos_base', 'creditos'])) || 0;
            }
        }
        user.nivel_acceso = effectiveLevel;
        user.modulos_visibles = effectiveModules;
        // LOGIN EXITOSO
        app.state.currentUser = user;
        if (app.ui && app.ui.setLoggedInState) app.ui.setLoggedInState(user);
        window.location.hash = "#dashboard";
        return { success: true };
    },
    logout: () => {
        console.log("🚪 Cerrando sesión...");
        app.state.currentUser = null;
        if (app.ui && app.ui.setLoggedOutState) app.ui.setLoggedOutState();
        window.location.hash = "#home";
    }
};
