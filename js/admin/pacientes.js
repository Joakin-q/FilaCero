/**
 * pacientes.js — Gestión de pacientes (admin)
 *
 * - Lista pacientes.
 * - Crea nuevas cuentas con contraseña temporal (que se muestra al admin
 *   una sola vez para que se la entregue al paciente).
 */
(async () => {
  const session = window.FC_AUTH.requireAuth(['admin']);
  if (!session) return;

  window.FC_UTIL.mountSidebar({ active: 'pacientes', user: session, rol: 'admin' });
  window.FC_UTIL.mountTopbar({ title: 'Pacientes', user: session });

  let pacientes = [];
  let turnos = [];

  async function cargar() {
    [pacientes, turnos] = await Promise.all([
      window.FC_REPO.listPacientes(),
      window.FC_REPO.listTurnos()
    ]);
    render();
  }

  function contarTurnos(pacienteId) {
    return turnos.filter(t => t.pacienteId === pacienteId).length;
  }

  function render() {
    const search = (document.getElementById('searchInput').value || '').toLowerCase().trim();
    const lista = pacientes.filter(p =>
      !search || `${p.nombre} ${p.apellido} ${p.dni} ${p.email}`.toLowerCase().includes(search)
    );
    const tbody = document.getElementById('pacBody');
    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="admin-empty"><h3>Sin pacientes</h3><p>Creá una cuenta para empezar.</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = lista.map(p => `
      <tr>
        <td>
          <strong>${p.nombre} ${p.apellido}</strong>
          <div style="font-size:11px; color:var(--color-text-muted);">${p.fechaNacimiento ? 'Nac. ' + p.fechaNacimiento : '—'}</div>
        </td>
        <td>${p.dni}</td>
        <td>${p.email}</td>
        <td>${p.telefono || '—'}</td>
        <td>${p.obraSocial || '—'}</td>
        <td>${contarTurnos(p.id)}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" data-action="edit" data-id="${p.id}" title="Editar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
            </button>
            <button class="icon-btn icon-btn--danger" data-action="delete" data-id="${p.id}" title="Eliminar">
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
        if (action === 'edit') openModal(id);
        if (action === 'delete') confirmarEliminar(id);
      });
    });
  }

  function openModal(id = null) {
    const edit = id ? pacientes.find(p => p.id === id) : null;
    const html = `
      <div class="admin-modal">
        <h3>${edit ? 'Editar paciente' : 'Nueva cuenta de paciente'}</h3>
        <p class="subtitle">${edit ? 'Modificá los datos del paciente.' : 'Creá una cuenta nueva. Se generará una contraseña temporal para entregarle.'}</p>
        <form id="pacForm">
          <div class="form-grid">
            <div class="field"><label>Nombre</label>
              <input name="nombre" required value="${edit?.nombre || ''}">
            </div>
            <div class="field"><label>Apellido</label>
              <input name="apellido" required value="${edit?.apellido || ''}">
            </div>
            <div class="field"><label>DNI</label>
              <input name="dni" required pattern="\\d{7,9}" value="${edit?.dni || ''}">
            </div>
            <div class="field"><label>Fecha de nacimiento</label>
              <input type="date" name="fechaNacimiento" value="${edit?.fechaNacimiento || ''}">
            </div>
            <div class="field field--full"><label>Email</label>
              <input type="email" name="email" required value="${edit?.email || ''}">
            </div>
            <div class="field"><label>Teléfono</label>
              <input name="telefono" value="${edit?.telefono || ''}">
            </div>
            <div class="field"><label>Obra social</label>
              <input name="obraSocial" value="${edit?.obraSocial || ''}">
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" data-close>Cancelar</button>
            <button type="submit" class="btn btn-primary">${edit ? 'Guardar cambios' : 'Crear cuenta'}</button>
          </div>
        </form>
      </div>
    `;
    const backdrop = document.getElementById('fc-modal');
    backdrop.innerHTML = html;
    backdrop.classList.add('is-visible');
    backdrop.querySelector('[data-close]').addEventListener('click', closeModal);
    backdrop.querySelector('#pacForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      try {
        if (edit) {
          await window.FC_REPO.updatePaciente(edit.id, fd);
          window.FC_UTIL.adminToast('Paciente actualizado', 'success');
        } else {
          const res = await window.FC_REPO.createPaciente(fd);
          closeModal();
          mostrarPasswordTemporal(res);
          await cargar();
          return;
        }
        closeModal();
        cargar();
      } catch (err) {
        window.FC_UTIL.adminToast(err.message || 'Error al guardar', 'error');
      }
    });
  }

  function mostrarPasswordTemporal(res) {
    const html = `
      <div class="admin-modal">
        <div class="modal-icon modal-icon--success" style="margin: 0 auto 12px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <h3 style="text-align:center;">Cuenta creada</h3>
        <p class="subtitle" style="text-align:center;">${res.paciente.nombre} ${res.paciente.apellido} ya puede iniciar sesión.</p>
        <div style="background:#F5F1E4; border-radius:var(--radius-md); padding:14px; text-align:center; margin-bottom:12px;">
          <div style="font-size:12px; color:var(--color-text-muted); margin-bottom:4px;">Contraseña temporal</div>
          <strong style="font-family:monospace; font-size:18px; letter-spacing:1px;">${res.tempPassword}</strong>
        </div>
        <p style="font-size:12px; color:var(--color-text-muted); text-align:center;">Entregásela al paciente. Podrá cambiarla después desde su perfil.</p>
        <div class="form-actions" style="justify-content:center;">
          <button class="btn btn-primary" data-close>Listo</button>
        </div>
      </div>
    `;
    const backdrop = document.getElementById('fc-modal');
    backdrop.innerHTML = html;
    backdrop.classList.add('is-visible');
    backdrop.querySelector('[data-close]').addEventListener('click', closeModal);
  }

  function closeModal() {
    const backdrop = document.getElementById('fc-modal');
    backdrop.classList.remove('is-visible');
    backdrop.innerHTML = '';
  }

  function confirmarEliminar(id) {
    const p = pacientes.find(x => x.id === id);
    window.FC_UTIL.showModal({
      icon: 'warning',
      title: 'Eliminar paciente',
      message: `¿Eliminar la cuenta de ${p.nombre} ${p.apellido}? Si tiene turnos activos no se podrá.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await window.FC_REPO.deletePaciente(id);
          window.FC_UTIL.adminToast('Paciente eliminado', 'success');
          cargar();
        } catch (err) {
          window.FC_UTIL.adminToast(err.message || 'No se pudo eliminar', 'error');
        }
      }
    });
  }

  document.getElementById('searchInput').addEventListener('input', render);
  document.getElementById('btnNuevo').addEventListener('click', () => openModal());

  await cargar();
})();
