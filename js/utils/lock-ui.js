/**
 * lock-ui.js — Bloqueo condicional de UI
 *
 * Solo bloquea botones/forms si window.FC_CONFIG.lockUI === true.
 * Cuando lockUI es false (modo funcional), no hace nada.
 */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const cfg = window.FC_CONFIG || {};
    if (cfg.lockUI !== true) return;

    ensureToast();

    const isInsideSidebar = (el) => !!el.closest('#fc-sidebar');
    const isInsideLoginForm = (el) => !!el.closest('#loginForm, #registerForm, #recoverForm');

    document.querySelectorAll('button').forEach((btn) => {
      if (isInsideSidebar(btn)) return;
      if (isInsideLoginForm(btn)) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showToast('Acción deshabilitada en esta versión');
      }, true);
    });

    document.querySelectorAll('form').forEach((form) => {
      if (isInsideLoginForm(form)) return;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        showToast('Formulario deshabilitado en esta versión');
      }, true);
    });

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
