/**
 * medicos.js — CRUD de médicos (admin)
 */
(async () => {
  const session = window.FC_AUTH.requireAuth(['admin']);
  if (!session) return;

  window.FC_UTIL.mountSidebar({ active: 'medicos', user: session, rol: 'admin' });
  window.FC_UTIL.mountTopbar({ title: 'Médicos', user: session });

  let medicos = [];
  let especialidades = [];

  async function cargar() {
    [medicos, especialidades] = await Promise.all([
      window.FC_REPO.listMedicos(),
      window.FC_REPO.listEspecialidades()
    ]);
    render();
  }

  function render() {
    const search = (document.getElementById('searchInput').value || '').toLowerCase().trim();
    const filtroEsp = document.getElementById('filterEsp').value;
    const filtroEstado = document.getElementById('filterEstado').value;

    const filtrados = medicos.filter(m => {
      if (search && !`${m.nombre} ${m.apellido} ${m.matricula}`.toLowerCase().includes(search)) return false;
      if (filtroEsp && m.especialidadId !== filtroEsp) return false;
      if (filtroEstado === 'activo' && !m.activo) return false;
      if (filtroEstado === 'inactivo' && m.activo) return false;
      return true;
    });

    const tbody = document.getElementById('medicosBody');
    if (filtrados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="admin-empty"><h3>Sin médicos</h3><p>Probá cambiar los filtros o agregá un nuevo médico.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = filtrados.map(m => `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="mini-list-item" style="padding:0; background:none;">
              <div class="avatar avatar--${m.especialidadColor}">${m.iniciales}</div>
            </div>
            <div>
              <strong>${m.nombre} ${m.apellido}</strong>
              <div style="font-size:12px; color:var(--color-text-muted);">${m.email || '—'}</div>
            </div>
          </div>
        </td>
        <td>${m.matricula}</td>
        <td>${m.especialidad}</td>
        <td>${m.telefono || '—'}</td>
        <td>
          <span class="status-pill status-pill--${m.activo ? 'activo' : 'inactivo'}">
            <span class="dot"></span>${m.activo ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" data-action="toggle" data-id="${m.id}" title="${m.activo ? 'Desactivar' : 'Activar'}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v10"/><path d="m9 9 3-3 3 3"/><circle cx="12" cy="17" r="5"/></svg>
            </button>
            <button class="icon-btn" data-action="edit" data-id="${m.id}" title="Editar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
            </button>
            <button class="icon-btn icon-btn--danger" data-action="delete" data-id="${m.id}" title="Eliminar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // bind actions
    tbody.querySelectorAll('button[data-action]').forEach(btn => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      btn.addEventListener('click', () => {
        if (action === 'edit') openModal(id);
        if (action === 'delete') confirmarEliminar(id);
        if (action === 'toggle') toggleActivo(id);
      });
    });
  }

  function openModal(id = null) {
    const edit = id ? medicos.find(m => m.id === id) : null;
    const opcionesEsp = especialidades.map(e =>
      `<option value="${e.id}" ${edit && edit.especialidadId === e.id ? 'selected' : ''}>${e.nombre}</option>`
    ).join('');

    const html = `
      <div class="admin-modal">
        <h3>${edit ? 'Editar médico' : 'Nuevo médico'}</h3>
        <p class="subtitle">${edit ? 'Modificá los datos del profesional.' : 'Sumá un profesional al centro.'}</p>
        <form id="medicoForm">
          <div class="form-grid">
            <div class="field"><label>Nombre</label>
              <input name="nombre" required value="${edit?.nombre || ''}">
            </div>
            <div class="field"><label>Apellido</label>
              <input name="apellido" required value="${edit?.apellido || ''}">
            </div>
            <div class="field"><label>Matrícula</label>
              <input name="matricula" required value="${edit?.matricula || ''}">
            </div>
            <div class="field"><label>Especialidad</label>
              <select name="especialidadId" required>
                <option value="">Elegir…</option>
                ${opcionesEsp}
              </select>
            </div>
            <div class="field"><label>Teléfono</label>
              <input name="telefono" value="${edit?.telefono || ''}">
            </div>
            <div class="field"><label>Email</label>
              <input name="email" type="email" value="${edit?.email || ''}">
            </div>
            <div class="field field--full">
              <label style="display:flex; gap:8px; align-items:center;">
                <input type="checkbox" name="activo" ${(edit ? edit.activo : true) ? 'checked' : ''} style="width:auto;">
                Activo (recibe turnos)
              </label>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" data-close>Cancelar</button>
            <button type="submit" class="btn btn-primary">${edit ? 'Guardar cambios' : 'Crear médico'}</button>
          </div>
        </form>
      </div>
    `;

    const backdrop = document.getElementById('fc-modal');
    backdrop.innerHTML = html;
    backdrop.classList.add('is-visible');

    backdrop.querySelector('[data-close]').addEventListener('click', closeModal);
    backdrop.querySelector('#medicoForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      fd.activo = !!e.target.activo.checked;
      try {
        if (edit) await window.FC_REPO.updateMedico(edit.id, fd);
        else await window.FC_REPO.createMedico(fd);
        window.FC_UTIL.adminToast(edit ? 'Médico actualizado' : 'Médico creado', 'success');
        closeModal();
        cargar();
      } catch (err) {
        window.FC_UTIL.adminToast(err.message || 'Error al guardar', 'error');
      }
    });
  }

  function closeModal() {
    const backdrop = document.getElementById('fc-modal');
    backdrop.classList.remove('is-visible');
    backdrop.innerHTML = '';
  }

  async function confirmarEliminar(id) {
    const m = medicos.find(x => x.id === id);
    window.FC_UTIL.showModal({
      icon: 'warning',
      title: 'Eliminar médico',
      message: `¿Eliminar a ${m.nombre} ${m.apellido}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await window.FC_REPO.deleteMedico(id);
          window.FC_UTIL.adminToast('Médico eliminado', 'success');
          cargar();
        } catch (err) {
          window.FC_UTIL.adminToast(err.message || 'No se pudo eliminar', 'error');
        }
      }
    });
  }

  async function toggleActivo(id) {
    const m = medicos.find(x => x.id === id);
    await window.FC_REPO.updateMedico(id, { activo: !m.activo });
    window.FC_UTIL.adminToast(m.activo ? 'Médico desactivado' : 'Médico activado', 'success');
    cargar();
  }

  // ===== Toolbar / filtros =====
  document.getElementById('searchInput').addEventListener('input', render);
  document.getElementById('filterEsp').addEventListener('change', render);
  document.getElementById('filterEstado').addEventListener('change', render);
  document.getElementById('btnNuevo').addEventListener('click', () => openModal());

  // Cargar opciones del filtro de especialidad
  const filterEsp = document.getElementById('filterEsp');
  especialidades.forEach(e => {
    const o = document.createElement('option');
    o.value = e.id;
    o.textContent = e.nombre;
    filterEsp.appendChild(o);
  });

  await cargar();
})();
