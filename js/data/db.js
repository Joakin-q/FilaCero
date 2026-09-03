/**
 * db.js — Puente hacia la capa de datos real (FC_REPO)
 *
 * Este archivo ya no contiene datos estáticos. Ahora actúa como un puente
 * hacia FC_REPO, permitiendo que todas las pantallas que usan window.FC_DB
 * funcionen con Firebase automáticamente.
 */

(function () {
  // Esperamos a que FC_REPO esté disponible
  const initializeBridge = () => {
    if (window.FC_REPO) {
      window.FC_DB = window.FC_REPO;
      console.log('🚀 FilaCero: Capa de datos conectada a Firebase.');
    } else {
      // Reintentar en 50ms si el repositorio aún no cargó
      setTimeout(initializeBridge, 50);
    }
  };

  initializeBridge();
})();