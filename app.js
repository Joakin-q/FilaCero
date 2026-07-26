import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ============================
// CONFIG FIREBASE
// ============================

const firebaseConfig = {
    apiKey: "AIzaSyBJFbz-sis-_ucxV6OsIGh4U0cRD9n8wcg",
    authDomain: "filacero-3e291.firebaseapp.com",
    projectId: "filacero-3e291",
    storageBucket: "filacero-3e291.firebasestorage.app",
    messagingSenderId: "605661966094",
    appId: "1:605661966094:web:00c848ed951e24bf8e715f",
    measurementId: "G-QQESPPR2BH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ============================
// TOGGLE LOGIN / REGISTRO
// ============================

const loginBox = document.getElementById("loginBox");
const registerBox = document.getElementById("registerBox");
const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

if (showRegister) {
    showRegister.addEventListener("click", () => {
        loginBox.classList.add("hidden");
        registerBox.classList.remove("hidden");
    });
}

if (showLogin) {
    showLogin.addEventListener("click", () => {
        registerBox.classList.add("hidden");
        loginBox.classList.remove("hidden");
    });
}


// ============================
// MOSTRAR / OCULTAR CONTRASEÑA
// ============================

const eyeLogin = document.getElementById("eyeLogin");
const eyeRegister = document.getElementById("eyeRegister");

if (eyeLogin) {
    eyeLogin.addEventListener("click", () => {
        const input = document.getElementById("loginPassword");
        input.type = input.type === "password" ? "text" : "password";
        eyeLogin.classList.toggle("fa-eye");
        eyeLogin.classList.toggle("fa-eye-slash");
    });
}

if (eyeRegister) {
    eyeRegister.addEventListener("click", () => {
        const input = document.getElementById("registerPassword");
        input.type = input.type === "password" ? "text" : "password";
        eyeRegister.classList.toggle("fa-eye");
        eyeRegister.classList.toggle("fa-eye-slash");
    });
}


// ============================
// REGISTRO
// ============================

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // evita que el formulario recargue la página

        const nombre = document.getElementById("nombre").value.trim();
        const apellido = document.getElementById("apellido").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;

        if (!nombre || !apellido || !email || !password) {
            alert("Completa todos los campos");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            // Guardar datos en Firestore
            await setDoc(doc(db, "usuarios", user.uid), {
                nombre: nombre,
                apellido: apellido,
                email: email,
                createdAt: new Date()
            });

            alert("Cuenta creada correctamente");
            window.location.href = "dashboard.html";

        } catch (error) {
            alert(error.message);
        }
    });
}


// ============================
// LOGIN
// ============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // evita que el formulario recargue la página

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "dashboard.html";

        } catch (error) {
            alert("Correo o contraseña incorrectos");
        }
    });
}


// ============================
// RECUPERAR CONTRASEÑA
// ============================

const forgot = document.getElementById("forgotPassword");

if (forgot) {
    forgot.addEventListener("click", async (e) => {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();

        if (!email) {
            alert("Escribe tu correo primero");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            alert("Correo de recuperación enviado");

        } catch (error) {
            alert(error.message);
        }
    });
}


// ============================
// MOSTRAR DATOS DASHBOARD
// ============================

const nombreUsuario = document.getElementById("nombreUsuario");
const correoUsuario = document.getElementById("correoUsuario");

onAuthStateChanged(auth, async (user) => {
    if (user) {

        if (nombreUsuario) {
            const datos = await getDoc(doc(db, "usuarios", user.uid));

            if (datos.exists()) {
                nombreUsuario.innerHTML =
                    datos.data().nombre + " " + datos.data().apellido;
            }

            if (correoUsuario) {
                correoUsuario.innerHTML = user.email;
            }
        }

    } else {
        // Si no está logueado vuelve al login
        if (location.pathname.includes("dashboard")) {
            window.location.href = "index.html";
        }
    }
});


// ============================
// CERRAR SESIÓN
// ============================

const logout = document.getElementById("logout");

if (logout) {
    logout.addEventListener("click", async () => {
        await signOut(auth);
        window.location.href = "index.html";
    });
}