/**
 * turnos.js — Gestión global de turnos (admin)
 *
 * - Lista turnos con filtros.
 * - Permite crear un turno nuevo eligiendo paciente, médico, fecha, hora.
 * - Permite eliminar turnos existentes.
 */
(async () => {
  const session = window.FC_AUTH.requireAuth(['admin']);
  if (!session) return;

  window.FC_UTIL.mountSidebar({ active: 'turnos', user: session, rol: 'admin' });
  window.FC_UTIL.mountTopbar({ title: 'Turnos', user: session });

  let turnos = [];
  let medicos = [];
  let pacientes = [];
  let especialidades = [];

  async function cargar() {
    [turnos, medicos, pacientes, especialidades] = await Promise.all([
      window.FC_REPO.listTurnos(),
      window.FC_REPO.listMedicos(),
      window.FC_REPO.listPacientes(),
      window.FC_REPO.listEspecialidades()
    ]);
    cargarFiltros();
    render();
  }

  function cargarFiltros() {
    const espSel = document.getElementById('filterEsp');
    espSel.innerHTML = `<option value="">Todas las especialidades</option>` +
      especialidades.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('');
  }

  function render() {
    const search = (document.getElementById('searchInput').value || '').toLowerCase().trim();
    const filtroEstado = document.getElementById('filterEstado').value;
    const filtroEsp = document.getElementById('filterEsp').value;
    const desde = document.getElementById('filterDesde').value;
    const hasta = document.getElementById('filterHasta').value;

    const filtrados = turnos.filter(t => {
      if (search && !`${t.paciente} ${t.medico} ${t.pacienteDni}`.toLowerCase().includes(search)) return false;
      if (filtroEstado && t.estado !== filtroEstado) return false;
      if (filtroEsp) {
        const m = medicos.find(x => x.id === t.medicoId);
        if (!m || m.especialidadId !== filtroEsp) return false;
      }
      if (desde && t.fecha < desde) return false;
      if (hasta && t.fecha > hasta) return false;
      return true;
    });

    const tbody = document.getElementById('turnosBody');
    if (filtrados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="admin-empty"><h3>Sin turnos</h3><p>Cambiá los filtros o creá uno nuevo.</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = filtrados.map(t => `
      <tr>
        <td><strong>${window.FC_UTIL.formatFechaCorta(t.fecha)}</strong></td>
        <td>${t.hora}</td>
        <td>${t.paciente}<div style="font-size:11px; color:var(--color-text-muted);">DNI ${t.pacienteDni || '—'}</div></td>
        <td>Dr. ${t.medico}</td>
        <td>${t.especialidad}</td>
        <td>
          <span class="status-pill status-pill--${t.estado}">
            <span class="dot"></span>${ESTADOS_LABEL[t.estado] || t.estado}
          </span>
        </td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" data-action="estado" data-id="${t.id}" title="Cambiar estado">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button class="icon-btn icon-btn--danger" data-action="delete" data-id="${t.id}" title="Eliminar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('button[data-action]').forEach(btn => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      btn.addEventListener('click', () => {
        if (action === 'delete') confirmarEliminar(id);
        if (action === 'estado') cambiarEstado(id);
      });
    });
  }

  const ESTADOS_LABEL = {
    pendiente:  'Pendiente',
    confirmado: 'Confirmado',
    proximo:    'Próximo',
    asistido:   'Asistido',
    cancelado:  'Cancelado'
  };

  function openModal() {
    const opcionesPacientes = pacientes.map(p =>
      `<option value="${p.id}">${p.nombre} ${p.apellido} · DNI ${p.dni}</option>`
    ).join('');
    const opcionesMedicos = medicos.filter(m => m.activo).map(m =>
      `<option value="${m.id}">${m.nombre} ${m.apellido} — ${m.especialidad}</option>`
    ).join('');
    const hoy = new Date().toISOString().slice(0, 10);

    const html = `
      <div class="admin-modal">
        <h3>Nuevo turno</h3>
        <p class="subtitle">Asigná un turno a un paciente existente.</p>
        <form id="turnoForm">
          <div class="form-grid">
            <div class="field field--full"><label>Paciente</label>
              <select name="pacienteId" required>
                <option value="">Elegir paciente…</option>
                ${opcionesPacientes}
              </select>
            </div>
            <div class="field field--full"><label>Médico</label>
              <select name="medicoId" required>
                <option value="">Elegir médico…</option>
                ${opcionesMedicos}
              </select>
            </div>
            <div class="field"><label>Fecha</label>
              <input type="date" name="fecha" required min="${hoy}" value="${hoy}">
            </div>
            <div class="field"><label>Hora</label>
              <input type="time" name="hora" required step="1800">
            </div>
            <div class="field field--full"><label>Estado</label>
              <select name="estado">
                <option value="confirmado" selected>Confirmado</option>
                <option value="pendiente">Pendiente</option>
                <option value="proximo">Próximo</option>
              </select>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" data-close>Cancelar</button>
            <button type="submit" class="btn btn-primary">Crear turno</button>
          </div>
        </form>
      </div>
    `;
    const backdrop = document.getElementById('fc-modal');
    backdrop.innerHTML = html;
    backdrop.classList.add('is-visible');
    backdrop.querySelector('[data-close]').addEventListener('click', closeModal);
    backdrop.querySelector('#turnoForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      try {
        await window.FC_REPO.createTurno(fd);
        window.FC_UTIL.adminToast('Turno creado', 'success');
        closeModal();
        cargar();
      } catch (err) {
        window.FC_UTIL.adminToast(err.message || 'Error al crear turno', 'error');
      }
    });
  }

  function closeModal() {
    const backdrop = document.getElementById('fc-modal');
    backdrop.classList.remove('is-visible');
    backdrop.innerHTML = '';
  }

  function confirmarEliminar(id) {
    const t = turnos.find(x => x.id === id);
    window.FC_UTIL.showModal({
      icon: 'warning',
      title: 'Eliminar turno',
      message: `¿Eliminar el turno de ${t.paciente} con Dr. ${t.medico} del ${window.FC_UTIL.formatFechaCorta(t.fecha)} ${t.hora}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await window.FC_REPO.deleteTurno(id);
          window.FC_UTIL.adminToast('Turno eliminado', 'success');
          cargar();
        } catch (err) {
          window.FC_UTIL.adminToast(err.message || 'No se pudo eliminar', 'error');
        }
      }
    });
  }

  function cambiarEstado(id) {
    const t = turnos.find(x => x.id === id);
    const opciones = ['pendiente', 'confirmado', 'proximo', 'asistido', 'cancelado']
      .map(e => `<option value="${e}" ${t.estado === e ? 'selected' : ''}>${ESTADOS_LABEL[e]}</option>`).join('');
    const html = `
      <div class="admin-modal">
        <h3>Cambiar estado del turno</h3>
        <p class="subtitle">${t.paciente} · Dr. ${t.medico} · ${window.FC_UTIL.formatFechaCorta(t.fecha)} ${t.hora}</p>
        <form id="estadoForm">
          <div class="field"><label>Estado</label><select name="estado">${opciones}</select></div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" data-close>Cancelar</button>
            <button type="submit" class="btn btn-primary">Actualizar</button>
          </div>
        </form>
      </div>
    `;
    const backdrop = document.getElementById('fc-modal');
    backdrop.innerHTML = html;
    backdrop.classList.add('is-visible');
    backdrop.querySelector('[data-close]').addEventListener('click', closeModal);
    backdrop.querySelector('#estadoForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      try {
        await window.FC_REPO.updateTurno(id, { estado: fd.estado });
        window.FC_UTIL.adminToast('Estado actualizado', 'success');
        closeModal();
        cargar();
      } catch (err) {
        window.FC_UTIL.adminToast(err.message || 'Error al actualizar', 'error');
      }
    });
  }

  // filtros
  ['searchInput','filterEstado','filterEsp','filterDesde','filterHasta'].forEach(id => {
    document.getElementById(id).addEventListener('input', render);
    document.getElementById(id).addEventListener('change', render);
  });
  document.getElementById('btnNuevo').addEventListener('click', openModal);

  await cargar();
})();
