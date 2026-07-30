/**
 * utils.js — Utilidades compartidas para todas las pantallas
 */
(function () {

  const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const DIAS_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

  /** Formato fecha "Lun 4 Ago, 2025" */
  function formatFechaCorta(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const diff = Math.round((d - hoy) / (1000*60*60*24));
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    if (diff === -1) return 'Ayer';
    return `${DIAS_SHORT[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()].slice(0,3)}, ${d.getFullYear()}`;
  }

  /** Formato fecha larga "Lunes 4 de agosto de 2025" */
  function formatFechaLarga(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  }

  /** Avatar color por especialidad */
  function avatarClassByEspecialidad(espId) {
    const map = {
      'e-1': 'blue', 'e-2': 'green', 'e-3': 'cream',
      'e-4': 'pink', 'e-5': 'teal', 'e-6': 'violet'
    };
    return map[espId] || 'blue';
  }

  /** Modal helper */
  function showModal({ icon = 'success', title = '', message = '', confirmText = 'Aceptar', cancelText = '', onConfirm, onCancel } = {}) {
    const backdrop = document.getElementById('fc-modal');
    if (!backdrop) return;
    backdrop.innerHTML = `
      <div class="modal">
        <div class="modal-icon modal-icon--${icon}">
          ${icon === 'success'
            ? '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
            : '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>'
          }
        </div>
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="modal-actions">
          ${cancelText ? `<button class="btn btn-outline" data-action="cancel">${cancelText}</button>` : ''}
          <button class="btn btn-primary" data-action="confirm">${confirmText}</button>
        </div>
      </div>
    `;
    backdrop.classList.add('is-visible');
    const close = (action) => {
      backdrop.classList.remove('is-visible');
      backdrop.innerHTML = '';
      if (action === 'confirm' && onConfirm) onConfirm();
      if (action === 'cancel' && onCancel) onCancel();
    };
    backdrop.querySelector('[data-action="confirm"]').addEventListener('click', () => close('confirm'));
    if (cancelText) backdrop.querySelector('[data-action="cancel"]').addEventListener('click', () => close('cancel'));
  }

  /** Inyecta sidebar desktop en cualquier página */
  function mountSidebar({ active = 'inicio', user }) {
    const sidebar = document.getElementById('fc-sidebar');
    if (!sidebar) return;
    const links = [
      { id: 'inicio',     label: 'Inicio',         href: 'inicio.html',       icon: 'home' },
      { id: 'pedir',       label: 'Pedir turno',    href: 'solicitar.html',    icon: 'plus' },
      { id: 'turnos',      label: 'Mis turnos',     href: 'mis-turnos.html',   icon: 'calendar' },
      { id: 'historial',   label: 'Historial',      href: 'mis-turnos.html',   icon: 'clock' },
      { id: 'avisos',      label: 'Notificaciones', href: 'avisos.html',       icon: 'bell' },
      { id: 'perfil',      label: 'Perfil',         href: 'perfil.html',       icon: 'user' },
      { id: 'config',      label: 'Configuración',  href: 'config.html',       icon: 'gear' }
    ];
    sidebar.innerHTML = `
      <button class="sidebar-toggle" id="fc-sidebar-toggle" aria-label="Colapsar menú">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      <div class="sidebar-brand">
        <img src="../../assets/images/logo.jpeg" alt="FilaCero">
        <span class="brand-text">FilaCero</span>
      </div>
      <div class="sidebar-section">Principal</div>
      ${links.slice(0, 5).map(l => _sidebarLink(l, active)).join('')}
      <div class="sidebar-section">Cuenta</div>
      ${links.slice(5).map(l => _sidebarLink(l, active)).join('')}
      <div class="sidebar-footer">
        <a class="sidebar-link" data-action="logout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          <span class="label">Cerrar sesión</span>
        </a>
      </div>
    `;
    // Toggle
    sidebar.querySelector('#fc-sidebar-toggle').addEventListener('click', () => {
      sidebar.classList.toggle('is-collapsed');
      try { localStorage.setItem('fc_sidebar_collapsed', sidebar.classList.contains('is-collapsed') ? '1' : '0'); } catch {}
    });
    if (localStorage.getItem('fc_sidebar_collapsed') === '1') sidebar.classList.add('is-collapsed');
    // Logout
    sidebar.querySelector('[data-action="logout"]').addEventListener('click', (e) => {
      e.preventDefault();
      window.FC_AUTH.logout();
    });
  }

  function _sidebarLink(link, active) {
    const icons = {
      home:    '<path d="m3 11 9-8 9 8M5 10v10h14V10"/>',
      plus:    '<path d="M12 5v14M5 12h14"/>',
      calendar:'<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
      clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
      bell:    '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
      user:    '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>',
      gear:    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
    };
    return `
      <a class="sidebar-link ${link.id === active ? 'is-active' : ''}" href="${link.href}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${icons[link.icon] || ''}
        </svg>
        <span class="label">${link.label}</span>
      </a>
    `;
  }

  /** Inyecta bottom-nav móvil (DESHABILITADO: solo visual, no navega) */
  function mountBottomNav(active = 'turnos') {
    const nav = document.getElementById('fc-bottom-nav');
    if (!nav) return;
    const items = [
      { id: 'inicio',    label: 'Inicio' },
      { id: 'pedir',     label: 'Turnos' },
      { id: 'historial', label: 'Historial' },
      { id: 'avisos',    label: 'Avisos' },
      { id: 'perfil',    label: 'Perfil' }
    ];
    nav.innerHTML = items.map(i => `
      <button type="button" class="nav-item ${i.id === active ? 'is-active' : ''}" disabled aria-disabled="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></svg>
        ${i.label}
      </button>
    `).join('');
    // Reemplazar los SVGs vacíos por los iconos correctos
    nav.querySelectorAll('.nav-item').forEach((el, idx) => {
      const i = items[idx];
      const svg = el.querySelector('svg');
      svg.innerHTML = {
        inicio:    '<path d="m3 11 9-8 9 8M5 10v10h14V10"/>',
        pedir:     '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M12 14v4M10 16h4" stroke-width="1.5"/>',
        historial: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
        avisos:    '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
        perfil:    '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>'
      }[i.id] || '';
    });
    // Bloquear cualquier intento de click
    nav.querySelectorAll('button.nav-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        _flashDisabled(el);
      });
    });
  }

  function _flashDisabled(el) {
    el.classList.add('nav-item--blocked');
    setTimeout(() => el.classList.remove('nav-item--blocked'), 400);
  }

  /** Inyecta topbar desktop */
  function mountTopbar({ title, user }) {
    const bar = document.getElementById('fc-topbar');
    if (!bar) return;
    const initials = (user?.email || '?').slice(0, 2).toUpperCase();
    bar.innerHTML = `
      <h1>${title || ''}</h1>
      <div class="user-chip">
        <span class="avatar">${initials}</span>
        <span>${user?.email || ''}</span>
      </div>
    `;
  }

  window.FC_UTIL = {
    formatFechaCorta, formatFechaLarga,
    avatarClassByEspecialidad,
    showModal,
    mountSidebar, mountBottomNav, mountTopbar
  };
})();