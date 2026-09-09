/**
 * mis-turnos.js — Pantalla Mis Turnos
 */

(function () {
  const session = window.FC_AUTH.requireAuth(['paciente']);
  if (!session) return;

  window.FC_UTIL.mountSidebar({ active: 'turnos', user: session });
  window.FC_UTIL.mountTopbar({ title: 'Mis turnos', user: session });
  window.FC_UTIL.mountBottomNav('historial');

  let currentTurnos = [];

  const statusMap = {
    solicitud:  { cls: 'proximo',    label: 'Solicitado',  dot: 'proximo' },
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
      total: currentTurnos.length,
      proximos: currentTurnos.filter(t => ['pendiente','confirmado','proximo'].includes(t.estado)).length,
      finalizados: currentTurnos.filter(t => ['asistido','completado'].includes(t.estado)).length,
      cancelados: currentTurnos.filter(t => t.estado === 'cancelado').length
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
    if (filter === 'proximos') return ['solicitud','pendiente','confirmado','proximo'].includes(status);
    if (filter === 'confirmados') return status === 'confirmado';
    if (filter === 'finalizados') return ['asistido','completado'].includes(status);
    if (filter === 'cancelados') return status === 'cancelado';
    return true;
  }

  function renderList() {
    const list = document.getElementById('turnosList');
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    const filtered = currentTurnos.filter(t => {
      const matchesFilter = statusMatchesFilter(t.estado, activeFilter);
      const text = `${t.especialidad || ''} ${t.medico || ''} ${t.fecha || ''} ${t.hora || ''}`.toLowerCase();
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
      const s = statusMap[t.estado] || statusMap.pendiente;
      const canCancel = ['pendiente','confirmado','proximo'].includes(t.estado);
      const fechaFmt = window.FC_UTIL.formatFechaCorta(t.fecha);
      const initials = t.medico ? t.medico.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : 'P';

      return `
        <article class="turno-card" data-status="${t.estado}">
          <div class="turno-card__top">
            <div class="turno-avatar turno-avatar--${t.especialidadColor || 'blue'}">${initials}</div>
            <div class="turno-info">
              <div class="turno-specialty">${t.especialidad || '—'}</div>
              <div class="turno-doctor">${t.medico || '—'}</div>
            </div>
          </div>
          <div class="turno-meta">
            <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> ${fechaFmt}</span>
            <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg> ${t.hora || '—'}</span>
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

    list.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.cancel;
        const session = window.FC_AUTH.getSession();
        if (!session) return;

        window.FC_UTIL.showModal({
          icon: 'danger',
          title: 'Cancelar turno',
          message: '¿Estás seguro de que querés cancelar este turno?',
          confirmText: 'Sí, cancelar',
          cancelText: 'Volver',
          onConfirm: async () => {
            try {
              await window.FC_REPO.updateTurno(id, { estado: 'cancelado' });
              await loadAndRender();
              window.FC_UTIL.showModal({
                icon: 'success',
                title: 'Turno cancelado',
                message: 'El turno ha sido cancelado correctamente.',
                confirmText: 'Aceptar'
              });
            } catch (error) {
              window.FC_UTIL.showModal({
                icon: 'danger',
                title: 'Error',
                message: error.message || 'No se pudo cancelar el turno.',
                confirmText: 'Cerrar'
              });
            }
          }
        });
      });
    });
  }

  async function loadAndRender() {
    const session = window.FC_AUTH.getSession();
    if (!session) return;

    const list = document.getElementById('turnosList');
    list.innerHTML = '<p class="loading">Cargando tus turnos...</p>';

    try {
      currentTurnos = await window.FC_REPO.listTurnos({ pacienteId: session.pacienteId });
      renderStats();
      renderList();
    } catch (error) {
      console.error('Error loading turnos:', error);
      list.innerHTML = `
        <div class="empty-state">
          <div class="icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3>Error de carga</h3>
          <p>No pudimos cargar tus turnos. Por favor, intenta recargar la página.</p>
        </div>
      `;
    }
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

  loadAndRender();
})();