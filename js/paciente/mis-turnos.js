/**
 * mis-turnos.js — Pantalla Mis Turnos
 */

(function () {
  const session = window.FC_AUTH ? window.FC_AUTH.getSession() : null;

  if (session) {
    window.FC_UTIL.mountSidebar({ active: 'turnos', user: session });
    window.FC_UTIL.mountTopbar({ title: 'Mis turnos', user: session });
  }

  window.FC_UTIL.mountBottomNav('pedir');

  let currentTurnos = [];
  let unsubscribeTurnos = null;

  const colorMap = {
    'Cardiología': 'blue',
    'Clínica Médica': 'green',
    'Pediatría': 'cream',
    'Dermatología': 'pink',
    'Oftalmología': 'teal',
    'Traumatología': 'violet'
  };

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

      proximos: currentTurnos.filter(t =>
        ['solicitud', 'pendiente', 'confirmado', 'proximo'].includes(t.estado)
      ).length,

      finalizados: currentTurnos.filter(t =>
        ['asistido', 'completado'].includes(t.estado)
      ).length,

      cancelados: currentTurnos.filter(t =>
        t.estado === 'cancelado'
      ).length
    };
  }

  function renderStats() {
    const s = stats();

    const statTotal = document.getElementById('statTotal');
    const statProximos = document.getElementById('statProximos');
    const statFinalizados = document.getElementById('statFinalizados');
    const statCancelados = document.getElementById('statCancelados');

    if (statTotal) statTotal.textContent = s.total;
    if (statProximos) statProximos.textContent = s.proximos;
    if (statFinalizados) statFinalizados.textContent = s.finalizados;
    if (statCancelados) statCancelados.textContent = s.cancelados;
  }

  function statusMatchesFilter(status, filter) {
    if (filter === 'todos') return true;

    if (filter === 'proximos') {
      return ['solicitud', 'pendiente', 'confirmado', 'proximo'].includes(status);
    }

    if (filter === 'confirmados') {
      return status === 'confirmado';
    }

    if (filter === 'finalizados') {
      return ['asistido', 'completado'].includes(status);
    }

    if (filter === 'cancelados') {
      return status === 'cancelado';
    }

    return true;
  }

  function renderList() {
    const list = document.getElementById('turnosList');

    if (!list) return;

    const searchInput = document.getElementById('searchInput');
    const query = searchInput
      ? searchInput.value.trim().toLowerCase()
      : '';

    const filtered = currentTurnos.filter(t => {
      const matchesFilter = statusMatchesFilter(t.estado, activeFilter);

      const text = `
        ${t.especialidad || ''}
        ${t.medico || ''}
        ${t.fecha || ''}
        ${t.hora || ''}
      `.toLowerCase();

      const matchesSearch = !query || text.includes(query);

      return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="icon">
            <svg width="32" height="32" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 7v5l3 3"/>
            </svg>
          </div>

          <h3>No hay turnos</h3>
          <p>Cuando reserves turnos, aparecerán acá.</p>
        </div>
      `;

      return;
    }

    list.innerHTML = filtered.map(t => {
      const s = statusMap[t.estado] || statusMap.pendiente;

      const canCancel = [
        'solicitud',
        'pendiente',
        'confirmado',
        'proximo'
      ].includes(t.estado);

      const fechaFmt = window.FC_UTIL.formatFechaCorta(t.fecha);

      const initials = t.medico
        ? t.medico
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'P';

      return `
        <article class="turno-card" data-status="${t.estado}">

          <div class="turno-card__top">

            <div class="turno-avatar turno-avatar--${colorMap[t.especialidad] || 'blue'}">
              ${initials}
            </div>

            <div class="turno-info">
              <div class="turno-specialty">
                ${t.especialidad || '—'}
              </div>

              <div class="turno-doctor">
                ${t.medico || '—'}
              </div>
            </div>

          </div>

          <div class="turno-meta">

            <span>
              <svg width="13" height="13" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="3"/>
                <path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>

              ${fechaFmt}
            </span>

            <span>
              <svg width="13" height="13" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 7v5l3 3"/>
              </svg>

              ${t.hora || '—'}
            </span>

          </div>

          <div class="turno-bottom">

            <div class="turno-status turno-status--${s.cls}">
              <span class="status-dot status-dot--${s.dot}"></span>
              ${s.label}
            </div>

            ${
              canCancel
                ? `
                  <div class="turno-actions">
                    <button
                      type="button"
                      class="btn-outline btn-outline--danger"
                      data-cancel="${t.id}">
                      Cancelar
                    </button>
                  </div>
                `
                : ''
            }

          </div>

        </article>
      `;
    }).join('');

    list.querySelectorAll('[data-cancel]').forEach(btn => {

      btn.addEventListener('click', () => {

        const id = btn.dataset.cancel;
        const sessionActual = window.FC_AUTH.getSession();

        if (!sessionActual) return;

        window.FC_UTIL.showModal({
          icon: 'danger',
          title: 'Cancelar turno',
          message: '¿Estás seguro de que querés cancelar este turno?',
          confirmText: 'Sí, cancelar',
          cancelText: 'Volver',

          onConfirm: async () => {

            try {

              await window.FC_REPO.updateTurno(id, {
                estado: 'cancelado'
              });

              /*
               * NO hacemos loadAndRender() acá.
               *
               * Firestore va a detectar automáticamente
               * el cambio y onTurnos() va a actualizar
               * la pantalla.
               */

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

  /*
   * ============================================================
   * ACTUALIZACIÓN EN TIEMPO REAL
   * ============================================================
   */

  function loadAndRender() {

    const sessionActual = window.FC_AUTH.getSession();

    if (!sessionActual) return;

    /*
     * Si ya existe una suscripción, la cerramos
     * antes de crear otra.
     */
    if (unsubscribeTurnos) {
      unsubscribeTurnos();
      unsubscribeTurnos = null;
    }

    /*
     * onTurnos escucha directamente Firestore.
     *
     * Cada vez que:
     * - se crea un turno
     * - se modifica un turno
     * - se elimina un turno
     *
     * se ejecuta este callback.
     */
    unsubscribeTurnos = window.FC_REPO.onTurnos(
      {
        pacienteId: sessionActual.userId
      },

      (turnos) => {

        currentTurnos = turnos;

        renderStats();
        renderList();

      }
    );
  }

  /*
   * Filtros
   */
  document
    .querySelectorAll('#filterTabs .filter-tab')
    .forEach(tab => {

      tab.addEventListener('click', () => {

        document
          .querySelectorAll('#filterTabs .filter-tab')
          .forEach(t => {
            t.classList.remove('is-active');
          });

        tab.classList.add('is-active');

        activeFilter = tab.dataset.filter;

        renderList();
      });

    });

  /*
   * Buscador
   */
  const searchInput = document.getElementById('searchInput');

  if (searchInput) {
    searchInput.addEventListener('input', renderList);
  }

})();