/**
 * configuracion.js — Datos del centro médico
 *
 * Persiste en FC_REPO (localStorage hoy, Firebase mañana).
 * El logo se guarda como base64 para que persista sin storage extra.
 */
(async () => {
  const session = window.FC_AUTH.requireAuth(['admin']);
  if (!session) return;

  window.FC_UTIL.mountSidebar({ active: 'config', user: session, rol: 'admin' });
  window.FC_UTIL.mountTopbar({ title: 'Configuración', user: session });

  let centro = await window.FC_REPO.getCentro();

  function pintarLogo() {
    const img = document.getElementById('logoImg');
    const placeholder = document.getElementById('logoPlaceholder');
    if (centro.logoUrl) {
      img.src = centro.logoUrl;
      img.style.display = 'block';
      placeholder.style.display = 'none';
    } else {
      img.removeAttribute('src');
      img.style.display = 'none';
      placeholder.style.display = 'block';
    }
  }

  function cargarForm() {
    const form = document.getElementById('centroForm');
    form.nombre.value     = centro.nombre    || '';
    form.direccion.value  = centro.direccion || '';
    form.telefono.value   = centro.telefono  || '';
    form.email.value      = centro.email     || '';
    form.horario.value    = centro.horario   || '';
    pintarLogo();
  }
  cargarForm();

  // Logo upload
  document.getElementById('logoInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      window.FC_UTIL.adminToast('La imagen es muy pesada (máx 500KB)', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      centro = { ...centro, logoUrl: ev.target.result };
      pintarLogo();
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('btnQuitarLogo').addEventListener('click', () => {
    centro = { ...centro, logoUrl: '' };
    document.getElementById('logoInput').value = '';
    pintarLogo();
  });

  document.getElementById('centroForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      nombre:    form.nombre.value.trim(),
      direccion: form.direccion.value.trim(),
      telefono:  form.telefono.value.trim(),
      email:     form.email.value.trim(),
      horario:   form.horario.value.trim(),
      logoUrl:   centro.logoUrl || ''
    };
    if (!data.nombre) {
      window.FC_UTIL.adminToast('El nombre del centro es obligatorio', 'error');
      return;
    }
    try {
      centro = await window.FC_REPO.updateCentro(data);
      window.FC_UTIL.adminToast('Configuración guardada', 'success');
    } catch (err) {
      window.FC_UTIL.adminToast(err.message || 'Error al guardar', 'error');
    }
  });

  document.getElementById('btnReset').addEventListener('click', () => {
    window.FC_UTIL.showModal({
      icon: 'warning',
      title: 'Restablecer valores',
      message: 'Se reemplazarán los datos por los valores por defecto. ¿Continuar?',
      confirmText: 'Restablecer',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        centro = { ...(window.FC_CONFIG.centroDefault || {}) };
        await window.FC_REPO.updateCentro(centro);
        cargarForm();
        window.FC_UTIL.adminToast('Valores restablecidos', 'success');
      }
    });
  });
})();
