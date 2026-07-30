/**
 * mis-turnos.js — Pantalla Mis Turnos (MODO VISUAL)
 *
 * Renderiza turnos demo hardcodeados.
 * Tabs y buscador siguen funcionando (es interacción de UI).
 * El botón "Cancelar" abre un modal "Acción deshabilitada".
 */

(function () {
  const session = window.FC_AUTH ? window.FC_AUTH.getSession() : null;

  if (session) {
    window.FC_UTIL.mountSidebar({ active: 'turnos', user: session });
    window.FC_UTIL.mountTopbar({ title: 'Mis turnos', user: session });
  }
  window.FC_UTIL.mountBottomNav('historial');

  const TURNOS = [
    { id: 't-1', esp: 'Cardiología',     iniciales: 'MC', medico: 'Dra. María Castillo',  fecha: '2025-08-04', hora: '09:30', estado: 'confirmado' },
    { id: 't-2', esp: 'Clínica Médica',  iniciales: 'RL', medico: 'Dr. Roberto López',    fecha: '2025-08-06', hora: '11:00', estado: 'proximo' },
    { id: 't-3', esp: 'Pediatría',       iniciales: 'AG', medico: 'Dra. Ana González',    fecha: '2025-07-10', hora: '14:15', estado: 'asistido' },
    { id: 't-4', esp: 'Dermatología',    iniciales: 'FP', medico: 'Dr. Fernando Ponce',   fecha: '2025-07-15', hora: '10:00', estado: 'cancelado' },
    { id: 't-5', esp: 'Oftalmología',    iniciales: 'LM', medico: 'Dra. Laura Medina',    fecha: '2025-08-18', hora: '16:30', estado: 'proximo' }
  ];

  const colorMap = {
    'Cardiología': 'blue', 'Clínica Médica': 'green', 'Pediatría': 'cream',
    'Dermatología': 'pink', 'Oftalmología': 'teal', 'Traumatología': 'violet'
  };
  const statusMap = {
    confirmado: { cls: 'confirmado', label: 'Confirmado', dot: 'confirmado' },
    pendiente:  { cls: 'proximo',    label: 'Pendiente',  dot: 'proximo' },
    proximo:    { cls: 'proximo',    label: 'Próximo',    dot: 'proximo' },
    asistido:   { cls: 'asistido',   label: 'Asistió',    dot: 'asistido' },
    completado: { cls: 'asistido',   label: 'Completado', dot: 'asistido' },
    cancelado:  { cls: 'cancelado',  label: 'Cancelado',  dot: 'cancelado' }
  };

  let activeFilter = 'todos';

  function stats() {
    return {
      total: TURNOS.length,
      proximos: TURNOS.filter(t => ['pendiente','confirmado','proximo'].includes(t.estado)).length,
      finalizados: TURNOS.filter(t => ['asistido','completado'].includes(t.estado)).length,
      cancelados: TURNOS.filter(t => t.estado === 'cancelado').length
    };
  }

  function renderStats() {
    const s = stats();
    document.getElementById('statTotal').textContent = s.total;
    document.getElementById('statProximos').textContent = s.proximos;
    document.getElementById('statFinalizados').textContent = s.finalizados;
    document.getElementById('statCancelados').textContent = s.cancelados;
  }

  function statusMatchesFilter(status, filter) {
    if (filter === 'todos') return true;
    if (filter === 'proximos') return ['pendiente','confirmado','proximo'].includes(status);
    if (filter === 'confirmados') return status === 'confirmado';
    if (filter === 'finalizados') return ['asistido','completado'].includes(status);
    if (filter === 'cancelados') return status === 'cancelado';
    return true;
  }

  function renderList() {
    const list = document.getElementById('turnosList');
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const filtered = TURNOS.filter(t => {
      const matchesFilter = statusMatchesFilter(t.estado, activeFilter);
      const text = `${t.esp} ${t.medico} ${t.fecha} ${t.hora}`.toLowerCase();
      const matchesSearch = !query || text.includes(query);
      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
          </div>
          <h3>No hay turnos</h3>
          <p>Cuando reserves turnos, aparecerán acá.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = filtered.map(t => {
      const s = statusMap[t.estado];
      const canCancel = ['pendiente','confirmado','proximo'].includes(t.estado);
      const fechaFmt = window.FC_UTIL.formatFechaCorta(t.fecha);
      return `
        <article class="turno-card" data-status="${t.estado}">
          <div class="turno-card__top">
            <div class="turno-avatar turno-avatar--${colorMap[t.esp] || 'blue'}">${t.iniciales}</div>
            <div class="turno-info">
              <div class="turno-specialty">${t.esp}</div>
              <div class="turno-doctor">${t.medico}</div>
            </div>
          </div>
          <div class="turno-meta">
            <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> ${fechaFmt}</span>
            <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg> ${t.hora}</span>
          </div>
          <div class="turno-bottom">
            <div class="turno-status turno-status--${s.cls}">
              <span class="status-dot status-dot--${s.dot}"></span>${s.label}
            </div>
            ${canCancel ? `
              <div class="turno-actions">
                <button type="button" class="btn-outline btn-outline--danger" data-cancel="${t.id}">Cancelar</button>
              </div>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');

    // Botón cancelar: muestra modal deshabilitado
    list.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.FC_UTIL.showModal({
          icon: 'danger',
          title: 'Acción deshabilitada',
          message: 'La cancelación de turnos no está activa en esta versión.',
          confirmText: 'Entendido'
        });
      });
    });
  }

  document.querySelectorAll('#filterTabs .filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#filterTabs .filter-tab').forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      activeFilter = tab.dataset.filter;
      renderList();
    });
  });
  document.getElementById('searchInput').addEventListener('input', renderList);

  renderStats();
  renderList();
})();