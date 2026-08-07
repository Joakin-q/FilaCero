/**
 * horarios.js — Gestión de franjas horarias por médico
 */
(async () => {
  const session = window.FC_AUTH.requireAuth(['admin']);
  if (!session) return;

  window.FC_UTIL.mountSidebar({ active: 'horarios', user: session, rol: 'admin' });
  window.FC_UTIL.mountTopbar({ title: 'Horarios', user: session });

  const DIAS = [
    { id: 1, label: 'Lunes' },
    { id: 2, label: 'Martes' },
    { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' },
    { id: 5, label: 'Viernes' },
    { id: 6, label: 'Sábado' },
    { id: 0, label: 'Domingo' }
  ];

  const DEFAULT_DIAS = [1, 2, 3, 4, 5];
  const DEFAULT_SLOTS = (() => {
    const arr = [];
    for (let h = 9; h < 17; h++) for (const m of [0, 30]) arr.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    return arr;
  })();

  let medicos = [];
  let medicoActual = null;
  let horarios = []; // [{ id, diaSemana, slots }]

  async function cargar() {
    medicos = await window.FC_REPO.listMedicos();
    const sel = document.getElementById('medicoSelect');
    sel.innerHTML = `<option value="">Seleccioná un médico…</option>` +
      medicos.map(m => `<option value="${m.id}">${m.nombre} ${m.apellido} — ${m.especialidad}</option>`).join('');
  }

  async function cargarHorarios(medicoId) {
    horarios = await window.FC_REPO.listHorariosMedico(medicoId);
    // asegurar que existan los 7 días para edición
    DIAS.forEach(d => {
      if (!horarios.find(h => h.diaSemana === d.id)) {
        horarios.push({ id: null, diaSemana: d.id, slots: [] });
      }
    });
    horarios.sort((a, b) => a.diaSemana - b.diaSemana);
    document.getElementById('btnReset').disabled = false;
    render();
  }

  function render() {
    const wrap = document.getElementById('horariosWrap');
    wrap.innerHTML = `
      <div class="horarios-grid">
        ${horarios.map(h => {
          const dia = DIAS.find(d => d.id === h.diaSemana);
          const slotsHTML = h.slots.map(s => `
            <span class="slot-chip">
              ${s}
              <button data-dia="${h.diaSemana}" data-slot="${s}" title="Quitar">×</button>
            </span>
          `).join('');
          return `
            <div class="horario-card">
              <h4>
                ${dia.label}
                <span style="font-weight:500; color:var(--color-text-muted); font-size:12px;">
                  ${h.slots.length} ${h.slots.length === 1 ? 'slot' : 'slots'}
                </span>
              </h4>
              <div class="slots" id="slots-${h.diaSemana}">
                ${slotsHTML || `<div style="color:var(--color-text-muted); font-size:13px;">Día libre</div>`}
              </div>
              <div style="margin-top:12px; display:flex; gap:6px;">
                <input type="time" id="input-${h.diaSemana}" step="1800" style="flex:1; padding:8px 10px; border-radius:var(--radius-md); border:1px solid rgba(28,43,34,.12); background:white;">
                <button class="btn btn-outline" data-add="${h.diaSemana}">Añadir</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Bind remove
    wrap.querySelectorAll('.slot-chip button').forEach(btn => {
      btn.addEventListener('click', async () => {
        const dia = Number(btn.dataset.dia);
        const slot = btn.dataset.slot;
        const h = horarios.find(x => x.diaSemana === dia);
        h.slots = h.slots.filter(s => s !== slot);
        await persistir(dia);
      });
    });
    // Bind add
    wrap.querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const dia = Number(btn.dataset.add);
        const input = document.getElementById(`input-${dia}`);
        const v = input.value;
        if (!v) return;
        const h = horarios.find(x => x.diaSemana === dia);
        if (!h.slots.includes(v)) {
          h.slots.push(v);
          h.slots.sort();
          await persistir(dia);
        } else {
          window.FC_UTIL.adminToast('Ese horario ya estaba cargado', 'error');
        }
      });
    });
  }

  async function persistir(dia) {
    const h = horarios.find(x => x.diaSemana === dia);
    if (!h) return;
    if (h.slots.length === 0) {
      await window.FC_REPO.deleteHorario(medicoActual, dia);
    } else {
      await window.FC_REPO.upsertHorario({ medicoId: medicoActual, diaSemana: dia, slots: h.slots });
    }
    render();
    window.FC_UTIL.adminToast('Horario actualizado', 'success');
  }

  document.getElementById('medicoSelect').addEventListener('change', (e) => {
    medicoActual = e.target.value || null;
    if (medicoActual) cargarHorarios(medicoActual);
    else {
      document.getElementById('horariosWrap').innerHTML =
        `<div class="admin-empty"><h3>Elegí un profesional</h3><p>Seleccioná un médico de la lista para ver y editar sus horarios.</p></div>`;
      document.getElementById('btnReset').disabled = true;
    }
  });

  document.getElementById('btnReset').addEventListener('click', async () => {
    if (!medicoActual) return;
    window.FC_UTIL.showModal({
      icon: 'warning',
      title: 'Restablecer horario',
      message: 'Esto sobrescribe los horarios del médico con Lunes a Viernes de 09:00 a 17:00 cada 30 min. ¿Continuar?',
      confirmText: 'Restablecer',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        for (const d of DIAS) {
          const slots = DEFAULT_DIAS.includes(d.id) ? [...DEFAULT_SLOTS] : [];
          await window.FC_REPO.upsertHorario({ medicoId: medicoActual, diaSemana: d.id, slots });
        }
        await cargarHorarios(medicoActual);
        window.FC_UTIL.adminToast('Horario restablecido', 'success');
      }
    });
  });

  await cargar();
})();
