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
  await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

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

    async registerPaciente(userData) {
      const { email, password, nombre, apellido, dni, fechaNacimiento, telefono, obraSocial } = userData;

      try {
        // 1. Create user in Firebase Auth
        const credential = await auth.createUserWithEmailAndPassword(email, password);
        const uid = credential.user.uid;

        // 2. Create user profile in Firestore
        await db.collection('usuarios').doc(uid).set({
          email: email.toLowerCase(),
          rol: 'paciente',
          pacienteID: uid,
          createdAt: Date.now()
        });

        // 3. Create patient details in Firestore
        await db.collection('pacientes').doc(uid).set({
          id: uid,
          usuarioId: uid,
          nombre,
          apellido,
          dni,
          fechaNacimiento,
          telefono,
          obraSocial,
          activo: true
        });

        // 4. Create session
        const session = {
          userId: uid,
          email: email.toLowerCase(),
          rol: 'paciente',
          pacienteId: uid,
          loginAt: Date.now()
        };
        setSession(session);
        return session;
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          throw new Error('EMAIL_EN_USO');
        }
        if (error.code === 'auth/weak-password') {
          throw new Error('PASSWORD_DEBIL');
        }
        throw error;
      }
    },

    async recoverPassword(email) {
      try {
        await auth.sendPasswordResetEmail(email);
        return true;
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          throw new Error('USUARIO_NO_ENCONTRADO');
        }
        throw error;
      }
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