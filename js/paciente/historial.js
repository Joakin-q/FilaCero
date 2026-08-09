/**
 * historial.js — Pantalla Historial de Turnos
 *
 * Renderiza turnos históricos del paciente: Asistidos, Cancelados.
 * Permite filtrar por estado y buscar por especialidad/médico.
 */

(function () {
  const session = window.FC_AUTH ? window.FC_AUTH.requireAuth(['paciente']) : null;
  if (!session) return;

  window.FC_UTIL.mountSidebar({ active: 'historial', user: session });
  window.FC_UTIL.mountTopbar({ title: 'Historial', user: session });
  window.FC_UTIL.mountBottomNav('historial');

  let turnos = [];
  let activeFilter = 'todos';

  const statusMap = {
    confirmado:  { cls: 'confirmado', label: 'Confirmado', dot: 'confirmado' },
    pendiente:   { cls: 'proximo',    label: 'Pendiente',  dot: 'proximo' },
    proximo:     { cls: 'proximo',    label: 'Próximo',    dot: 'proximo' },
    asistido:    { cls: 'asistido',   label: 'Asistido',   dot: 'asistido' },
    completado:  { cls: 'asistido',   label: 'Asistido',   dot: 'asistido' },
    cancelado:   { cls: 'cancelado',  label: 'Cancelado',  dot: 'cancelado' }
  };

  function isHistorial(estado) {
    return ['asistido', 'completado', 'cancelado'].includes(estado);
  }

  async function load() {
    const all = await window.FC_DB.listTurnos(session.pacienteId);
    turnos = all.filter(t => isHistorial(t.estado));
    renderStats();
    renderList();
  }

  function renderStats() {
    const total = turnos.length;
    const asistidos = turnos.filter(t => t.estado === 'asistido' || t.estado === 'completado').length;
    const cancelados = turnos.filter(t => t.estado === 'cancelado').length;
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statAsistidos').textContent = asistidos;
    document.getElementById('statCancelados').textContent = cancelados;
  }

  function statusMatchesFilter(status, filter) {
    if (filter === 'todos') return true;
    if (filter === 'asistidos') return status === 'asistido' || status === 'completado';
    if (filter === 'cancelados') return status === 'cancelado';
    return true;
  }

  function renderList() {
    const list = document.getElementById('turnosList');
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const filtered = turnos.filter(t => {
      const matchesFilter = statusMatchesFilter(t.estado, activeFilter);
      const text = `${t.especialidad} ${t.medico} ${t.fecha} ${t.hora}`.toLowerCase();
      const matchesSearch = !query || text.includes(query);
      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
          </div>
          <h3>No hay turnos en el historial</h3>
          <p>Tus turnos pasados aparecerán acá.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = filtered.map(t => {
      const s = statusMap[t.estado];
      const colorClass = window.FC_UTIL.avatarClassByEspecialidad(t.especialidadId);
      const fechaFmt = window.FC_UTIL.formatFechaCorta(t.fecha);
      return `
        <article class="turno-card" data-status="${t.estado}">
          <div class="turno-card__top">
            <div class="turno-avatar turno-avatar--${colorClass}">${t.iniciales}</div>
            <div class="turno-info">
              <div class="turno-specialty">${t.especialidad}</div>
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
          </div>
        </article>
      `;
    }).join('');
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

  load();
})();
