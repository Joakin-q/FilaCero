/**
 * especialidades.js — CRUD de especialidades (admin)
 */
(async () => {
  const session = window.FC_AUTH.requireAuth(['admin']);
  if (!session) return;

  window.FC_UTIL.mountSidebar({ active: 'especialidades', user: session, rol: 'admin' });
  window.FC_UTIL.mountTopbar({ title: 'Especialidades', user: session });

  let especialidades = [];
  let conteoPorEsp = {};

  async function cargar() {
    [especialidades, conteoPorEsp] = await Promise.all([
      window.FC_REPO.listEspecialidades(),
      contarMedicos()
    ]);
    render();
  }

  async function contarMedicos() {
    const todos = await window.FC_REPO.listMedicos();
    const map = {};
    todos.forEach(m => { map[m.especialidadId] = (map[m.especialidadId] || 0) + 1; });
    return map;
  }

  const COLORES = [
    { id: 'blue',   label: 'Azul'    },
    { id: 'green',  label: 'Verde'   },
    { id: 'cream',  label: 'Crema'   },
    { id: 'pink',   label: 'Rosa'    },
    { id: 'teal',   label: 'Verde azulado' },
    { id: 'violet', label: 'Violeta' }
  ];

  const ICONOS = ['heart', 'stethoscope', 'baby', 'skin', 'eye', 'bone', 'tooth', 'brain', 'leaf'];

  function render() {
    const tbody = document.getElementById('espBody');
    if (especialidades.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="admin-empty"><h3>Sin especialidades</h3><p>Creá la primera para empezar.</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = especialidades.map(e => `
      <tr>
        <td>
          <div class="avatar avatar--${e.color}" style="width:36px; height:36px;">
            ${e.icono ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[e.icono] || ''}"/></svg>` : ''}
          </div>
        </td>
        <td><strong>${e.nombre}</strong></td>
        <td><span style="text-transform:capitalize;">${e.color}</span></td>
        <td>${e.icono || '—'}</td>
        <td>${conteoPorEsp[e.id] || 0}</td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" data-action="edit" data-id="${e.id}" title="Editar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
            </button>
            <button class="icon-btn icon-btn--danger" data-action="delete" data-id="${e.id}" title="Eliminar">
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

  const ICONS = {
    heart:       'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    stethoscope: 'M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3',
    baby:        'M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5.5 4.5 1.2',
    skin:        'M12 2v6m0 0a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-7 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm14 0a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    eye:         'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    bone:        'M17 10c.7-.7 1-1.6 1-2.5a3.5 3.5 0 0 0-7 0V8c0 .8-.7 1.5-1.5 1.5S8 8.8 8 8v-.5a3.5 3.5 0 0 0-7 0c0 .9.3 1.8 1 2.5l3 3 3-3m5 5 3 3 3-3c.7-.7 1-1.6 1-2.5a3.5 3.5 0 0 0-7 0V15c0-.8-.7-1.5-1.5-1.5S8 14.2 8 15v.5a3.5 3.5 0 0 0-7 0c0 .9.3 1.8 1 2.5',
    tooth:       'M12 5.5c-1.5 0-4 .5-5.5 2C5 9 4.5 11 5 13.5l1 5c.3 1.2 1.2 2 2.2 2 1 0 1.8-.8 2-2l.8-3 .8 3c.2 1.2 1 2 2 2 1 0 1.9-.8 2.2-2l1-5c.5-2.5 0-4.5-1.5-6-1.5-1.5-4-2-5.5-2z',
    brain:       'M9 3a3 3 0 0 1 3 3v1a3 3 0 0 1 3-3 3 3 0 0 1 3 3v.5a3 3 0 0 1 0 6V15a3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1-3 3 3 3 0 0 1-3-3v-1.5a3 3 0 0 1 0-6V6a3 3 0 0 1 3-3z',
    leaf:        'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z M2 21c0-3 1.85-5.36 5.08-6'
  };

  function openModal(id = null) {
    const edit = id ? especialidades.find(e => e.id === id) : null;
    const opcionesColor = COLORES.map(c =>
      `<option value="${c.id}" ${edit && edit.color === c.id ? 'selected' : ''}>${c.label}</option>`
    ).join('');
    const opcionesIcono = ICONOS.map(i =>
      `<option value="${i}" ${edit && edit.icono === i ? 'selected' : ''}>${i}</option>`
    ).join('');

    const html = `
      <div class="admin-modal">
        <h3>${edit ? 'Editar especialidad' : 'Nueva especialidad'}</h3>
        <p class="subtitle">${edit ? 'Modificá los datos de la especialidad.' : 'Sumá un área médica nueva.'}</p>
        <form id="espForm">
          <div class="form-grid">
            <div class="field field--full"><label>Nombre</label>
              <input name="nombre" required value="${edit?.nombre || ''}">
            </div>
            <div class="field"><label>Color</label>
              <select name="color">${opcionesColor}</select>
            </div>
            <div class="field"><label>Icono</label>
              <select name="icono">${opcionesIcono}</select>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-outline" data-close>Cancelar</button>
            <button type="submit" class="btn btn-primary">${edit ? 'Guardar cambios' : 'Crear'}</button>
          </div>
        </form>
      </div>
    `;
    const backdrop = document.getElementById('fc-modal');
    backdrop.innerHTML = html;
    backdrop.classList.add('is-visible');
    backdrop.querySelector('[data-close]').addEventListener('click', closeModal);
    backdrop.querySelector('#espForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      try {
        if (edit) await window.FC_REPO.updateEspecialidad(edit.id, fd);
        else await window.FC_REPO.createEspecialidad(fd);
        window.FC_UTIL.adminToast(edit ? 'Especialidad actualizada' : 'Especialidad creada', 'success');
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

  function confirmarEliminar(id) {
    const e = especialidades.find(x => x.id === id);
    const enUso = conteoPorEsp[id] || 0;
    if (enUso > 0) {
      window.FC_UTIL.adminToast(`No se puede eliminar: ${enUso} médico(s) la usan`, 'error');
      return;
    }
    window.FC_UTIL.showModal({
      icon: 'warning',
      title: 'Eliminar especialidad',
      message: `¿Eliminar ${e.nombre}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          await window.FC_REPO.deleteEspecialidad(id);
          window.FC_UTIL.adminToast('Especialidad eliminada', 'success');
          cargar();
        } catch (err) {
          window.FC_UTIL.adminToast(err.message || 'No se pudo eliminar', 'error');
        }
      }
    });
  }

  document.getElementById('btnNuevo').addEventListener('click', () => openModal());
  await cargar();
})();
