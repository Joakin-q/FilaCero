/**
 * config.js — Configuración global de FilaCero
 *
 * Firebase aún NO está conectado. Cuando lo esté, cambia `useFirebase: true`
 * y la capa de repository.js se encargará de enrutar las operaciones a la
 * base de datos remota en lugar de localStorage.
 */
window.FC_CONFIG = {
  firebaseConfig: {
    apiKey: "AIzaSyBJFbz-sis-_ucxV6OsIGh4U0cRD9n8wcg",
    authDomain: "filacero-3e291.firebaseapp.com",
    databaseURL: "https://filacero-3e291-default-rtdb.firebaseio.com",
    projectId: "filacero-3e291",
    storageBucket: "filacero-3e291.firebasestorage.app",
    messagingSenderId: "605661966094",
    appId: "1:605661966094:web:00c848ed951e24bf8e715f",
    measurementId: "G-QQESPPR2BH"
  },
  useFirebase: false,        // Cambiá a true cuando tengas credenciales reales
  fallbackToLocal: true,     // Si Firebase falla, usa localStorage como respaldo
  centroDefault: {
    nombre: 'FilaCero Centro Médico',
    direccion: 'Av. Siempre Viva 742, Buenos Aires',
    telefono: '+54 11 4000-0000',
    email: 'contacto@filacero.app',
    horario: 'Lunes a Viernes de 8:00 a 20:00',
    logoUrl: ''
  }
};
