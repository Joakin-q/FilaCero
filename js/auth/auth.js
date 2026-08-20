(function () {
  const SESSION_KEY = 'filacero_session_v2';
  const { auth, db } = window.FC_FIREBASE;

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setSession(session) {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }

    window.FC_SESSION = session;
  }

  function requireAuth(roles = []) {
    const session = getSession();

    if (!session) {
      window.location.href = '../auth/login.html';
      return null;
    }

    if (roles.length && !roles.includes(session.rol)) {
      window.location.href = session.rol === 'admin'
        ? '../admin/dashboard.html'
        : '../paciente/inicio.html';
      return null;
    }

    window.FC_SESSION = session;
    return session;
  }

  const Auth = {
    getSession,
    requireAuth,

    async login(email, password) {
      let credential;

      try {
        credential = await auth.signInWithEmailAndPassword(email, password);
      } catch (error) {
        if (
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-credential'
        ) {
          throw new Error('CREDENCIALES_INVALIDAS');
        }

        throw error;
      }

      const user = credential.user;
      const profile = await db.collection('usuarios').doc(user.uid).get();

      if (!profile.exists) {
        await auth.signOut();
        throw new Error('PERFIL_NO_ENCONTRADO');
      }

      const data = profile.data();

      if (!['admin', 'paciente'].includes(data.rol)) {
        await auth.signOut();
        throw new Error('ROL_INVALIDO');
      }

      const session = {
        userId: user.uid,
        email: user.email,
        rol: data.rol,
        pacienteId: data.rol === 'paciente'
          ? (data.pacienteID || user.uid)
          : null,
        loginAt: Date.now()
      };

      setSession(session);
      return session;
    },

    async logout() {
      await auth.signOut();
      setSession(null);
      window.location.href = '../auth/login.html';
    },

    homePath() {
      const session = getSession();

      if (!session) return '../auth/login.html';

      return session.rol === 'admin'
        ? '../admin/dashboard.html'
        : '../paciente/inicio.html';
    },

    async registerPaciente() {
      throw new Error('Registro deshabilitado en esta versión');
    },

    async recoverPassword() {
      throw new Error('Recuperación deshabilitada en esta versión');
    },

    validateEmail(email) {
      return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    },

    validateDNI(dni) {
      return /^\d{7,9}$/.test(dni);
    }
  };

  window.FC_AUTH = Auth;
  window.FC_SESSION = getSession();
})();