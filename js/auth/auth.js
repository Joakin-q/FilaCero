/**
 * auth.js — Autenticación SIMPLIFICADA
 *
 * Solo valida dos cuentas hardcodeadas:
 *   - Paciente: juan@demo.com / demo1234
 *   - Admin:    admin@filacero.app / admin123
 *
 * El resto (registro, hash real, recuperación real) está deshabilitado.
 */

(function () {
  const SESSION_KEY = 'filacero_session_v2';

  // Cuentas válidas (comparación directa)
  const USERS = {
    'juan@demo.com':      { password: 'demo1234', rol: 'paciente', userId: 'u-pac-1',   pacienteId: 'p-1' },
    'admin@filacero.app': { password: 'admin123', rol: 'admin',    userId: 'u-admin-1', pacienteId: null  }
  };

  // ===== Sesión =====
  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function setSession(s) {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
    window.FC_SESSION = s;
  }
  function requireAuth(roles = []) {
    const s = getSession();
    if (!s) { window.location.href = '../auth/login.html'; return null; }
    if (roles.length && !roles.includes(s.rol)) {
      window.location.href = s.rol === 'admin' ? '../admin/dashboard.html' : '../paciente/inicio.html';
      return null;
    }
    window.FC_SESSION = s;
    return s;
  }

  // ===== API pública =====
  const Auth = {
    getSession,
    requireAuth,

    logout() {
      setSession(null);
      window.location.href = '../auth/login.html';
    },

    /** Login: solo valida contra las 2 cuentas demo */
    async login(email, password) {
      const user = USERS[email.toLowerCase()];
      if (!user) throw new Error('EMAIL_NO_ENCONTRADO');
      if (user.password !== password) throw new Error('PASSWORD_INCORRECTO');

      const session = {
        userId: user.userId,
        email,
        rol: user.rol,
        pacienteId: user.pacienteId,
        loginAt: Date.now()
      };
      setSession(session);
      return session;
    },

    /** Devuelve la ruta de inicio según el rol del usuario */
    homePath() {
      const s = getSession();
      if (!s) return '../auth/login.html';
      return s.rol === 'admin' ? '../admin/dashboard.html' : '../paciente/inicio.html';
    },

    /** Registro deshabilitado */
    async registerPaciente() {
      throw new Error('Registro deshabilitado en esta versión');
    },

    /** Recuperación deshabilitada */
    async recoverPassword() {
      throw new Error('Recuperación deshabilitada en esta versión');
    },

    /** Validadores (dejados por compatibilidad) */
    validateEmail(email) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email); },
    validateDNI(dni)     { return /^\d{7,9}$/.test(dni); },
  };

  window.FC_AUTH = Auth;
  window.FC_SESSION = getSession();
})();

// Redirección post-login: si la página no pidió redirección explícita,
// dejamos que el caller (login.html) navegue según rol.
