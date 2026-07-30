/**
 * lock-ui.js — Bloquea todos los botones de la página EXCEPTO los del
 * sidebar izquierdo (#fc-sidebar) y los del formulario de login.
 *
 * Se ejecuta en DOMContentLoaded. Para cada botón fuera del sidebar,
 * previene el click y muestra un toast pequeño con el mensaje
 * "Función deshabilitada".
 *
 * También bloquea los <a> de la bottom nav móvil (#fc-bottom-nav)
 * por si quedara alguno activo.
 */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // El sidebar queda intacto: nada que bloquear dentro de él.
    // La función de logout (data-action="logout") sigue activa.

    // Toast reutilizable
    ensureToast();

    const isInsideSidebar = (el) => !!el.closest('#fc-sidebar');
    const isInsideBottomNav = (el) => !!el.closest('#fc-bottom-nav');
    const isInsideLoginForm = (el) => !!el.closest('#loginForm, #registerForm, #recoverForm');

    // Bloquear cualquier botón FUERA del sidebar y fuera de los forms de auth
    document.querySelectorAll('button').forEach((btn) => {
      if (isInsideSidebar(btn)) return;             // sidebar: libre (toggle)
      if (isInsideLoginForm(btn)) return;           // forms auth: libres
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showToast('Acción deshabilitada en esta versión');
      }, true); // capture, para ganarles a otros listeners
    });

    // Bloquear <a> de la bottom nav (por si quedó alguno)
    document.querySelectorAll('#fc-bottom-nav a').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        showToast('Usá el menú lateral para navegar');
      }, true);
    });

    // Bloquear inputs de formularios que NO sean el de login
    document.querySelectorAll('form').forEach((form) => {
      if (isInsideLoginForm(form)) return;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        showToast('Formulario deshabilitado en esta versión');
      }, true);
    });

    // ===== Toast =====
    function ensureToast() {
      if (document.getElementById('fc-toast')) return;
      const t = document.createElement('div');
      t.id = 'fc-toast';
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      Object.assign(t.style, {
        position: 'fixed',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%) translateY(20px)',
        background: '#1C2B22',
        color: '#F5F1E4',
        padding: '10px 16px',
        borderRadius: '999px',
        fontSize: '13px',
        fontWeight: '600',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        opacity: '0',
        pointerEvents: 'none',
        transition: 'opacity 220ms ease, transform 220ms ease',
        zIndex: '9999',
        maxWidth: 'calc(100vw - 32px)',
        textAlign: 'center'
      });
      document.body.appendChild(t);
    }

    let _toastTimer;
    function showToast(msg) {
      const t = document.getElementById('fc-toast');
      if (!t) return;
      t.textContent = msg;
      t.style.opacity = '1';
      t.style.transform = 'translateX(-50%) translateY(0)';
      clearTimeout(_toastTimer);
      _toastTimer = setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateX(-50%) translateY(20px)';
      }, 1600);
    }
  });
})();