/**
 * solicitar.js — Wizard 5 pasos para pedir turno
 *
 * Permite elegir especialidad, médico, fecha y horario, y confirmar el turno.
 * Al confirmar guarda el turno en FC_DB y redirige a Mis Turnos.
 */
(function () {
  const session = window.FC_AUTH ? window.FC_AUTH.requireAuth(['paciente']) : null;
  if (!session) return;

  window.FC_UTIL.mountSidebar({ active: 'pedir', user: session });
  window.FC_UTIL.mountTopbar({ title: 'Pedir turno', user: session });
  window.FC_UTIL.mountBottomNav('pedir');

  const state = { step: 1, especialidadId: null, medicoId: null, fecha: null, hora: null };
  const mesActual = { año: new Date().getFullYear(), mes: new Date().getMonth() };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  function renderSteps() {
    $$('.step').forEach((el) => {
      const n = Number(el.dataset.step);
      el.classList.toggle('is-active', n === state.step);
      el.classList.toggle('is-done', n < state.step);
    });
    $$('.wizard-step').forEach((s) => {
      s.style.display = Number(s.dataset.stepSection) === state.step ? '' : 'none';
    });
    $('#btnBack').style.display = state.step === 1 ? 'none' : '';
    $('#btnNext').textContent = state.step === 5 ? 'Confirmar turno' : 'Siguiente';
    validateNext();
  }

  function validateNext() {
    const btn = $('#btnNext');
    let ok = false;
    if (state.step === 1) ok = !!state.especialidadId;
    else if (state.step === 2) ok = !!state.medicoId;
    else if (state.step === 3) ok = !!state.fecha;
    else if (state.step === 4) ok = !!state.hora;
    else if (state.step === 5) ok = true;
    btn.disabled = !ok;
  }

  // ===== Paso 1: Especialidades =====
  async function renderEspecialidades() {
    const list = $('#especialidadesList');
    const data = await window.FC_DB.listEspecialidades();
    list.innerHTML = data.map(e => `
      <div class="option-card" data-esp="${e.id}">
        <div class="option-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        </div>
        <div class="option-text">
          <div class="option-title">${e.nombre}</div>
          <div class="option-sub">Médicos disponibles en esta especialidad</div>
        </div>
      </div>
    `).join('');
    list.querySelectorAll('.option-card').forEach((el) => {
      if (el.dataset.esp === state.especialidadId) el.classList.add('is-selected');
      el.addEventListener('click', () => {
        list.querySelectorAll('.option-card').forEach(c => c.classList.remove('is-selected'));
        el.classList.add('is-selected');
        state.especialidadId = el.dataset.esp;
        state.medicoId = null;
        validateNext();
      });
    });
  }

  // ===== Paso 2: Médicos =====
  async function renderMedicos() {
    const list = $('#medicosList');
    const data = await window.FC_DB.listMedicos({ especialidadId: state.especialidadId, activo: true });
    if (data.length === 0) {
      list.innerHTML = `<p class="subtitle">No hay médicos disponibles para esta especialidad.</p>`;
      return;
    }
    list.innerHTML = data.map(m => {
      const ini = `${m.nombre[0]}${m.apellido[0]}`.toUpperCase();
      const colorClass = window.FC_UTIL.avatarClassByEspecialidad(m.especialidadId);
      return `
        <div class="option-card" data-med="${m.id}">
          <div class="turno-avatar turno-avatar--${colorClass}" style="width:44px;height:44px;border-radius:12px;">${ini}</div>
          <div class="option-text">
            <div class="option-title">${m.nombre} ${m.apellido}</div>
            <div class="option-sub">${m.especialidad} · Matrícula ${m.matricula}</div>
          </div>
        </div>
      `;
    }).join('');
    list.querySelectorAll('.option-card').forEach((el) => {
      if (el.dataset.med === state.medicoId) el.classList.add('is-selected');
      el.addEventListener('click', () => {
        list.querySelectorAll('.option-card').forEach(c => c.classList.remove('is-selected'));
        el.classList.add('is-selected');
        state.medicoId = el.dataset.med;
        validateNext();
      });
    });
  }

  // ===== Paso 3: Calendario =====
  function renderCalendario() {
    const cal = $('#calendar');
    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const draw = () => {
      const first = new Date(mesActual.año, mesActual.mes, 1);
      const last  = new Date(mesActual.año, mesActual.mes + 1, 0);
      const today = new Date(); today.setHours(0,0,0,0);
      const firstDow = first.getDay();
      const days = [];
      for (let i = 0; i < firstDow; i++) days.push(null);
      for (let d = 1; d <= last.getDate(); d++) days.push(d);

      cal.innerHTML = `
        <div class="calendar-header">
          <button id="calPrev"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
          <div class="month-name">${MESES[mesActual.mes]} ${mesActual.año}</div>
          <button id="calNext"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
        </div>
        <div class="calendar-grid">
          ${['D','L','M','M','J','V','S'].map(d => `<div class="day-name">${d}</div>`).join('')}
          ${days.map(d => {
            if (!d) return '<div></div>';
            const date = new Date(mesActual.año, mesActual.mes, d);
            const iso = date.toISOString().slice(0,10);
            const isPast = date < today;
            const isSelected = state.fecha === iso;
            return `<div class="day ${isPast ? 'is-disabled' : ''} ${isSelected ? 'is-selected' : ''}" data-iso="${iso}">${d}</div>`;
          }).join('')}
        </div>
      `;
      $('#calPrev').addEventListener('click', () => {
        if (mesActual.mes === 0) { mesActual.mes = 11; mesActual.año--; } else mesActual.mes--;
        draw();
      });
      $('#calNext').addEventListener('click', () => {
        if (mesActual.mes === 11) { mesActual.mes = 0; mesActual.año++; } else mesActual.mes++;
        draw();
      });
      cal.querySelectorAll('.day:not(.is-disabled)').forEach((el) => {
        el.addEventListener('click', () => {
          state.fecha = el.dataset.iso;
          state.hora = null;
          cal.querySelectorAll('.day').forEach(d => d.classList.remove('is-selected'));
          el.classList.add('is-selected');
          validateNext();
        });
      });
    };
    draw();
  }

  // ===== Paso 4: Horarios =====
  async function renderHorarios() {
    const grid = $('#timesGrid');
    grid.innerHTML = `<div class="subtitle" style="grid-column: 1 / -1;">Cargando horarios...</div>`;
    const slots = await window.FC_DB.listHorariosDisponibles(state.medicoId, state.fecha);
    if (slots.length === 0) {
      grid.innerHTML = `<div class="subtitle" style="grid-column: 1 / -1;">No hay horarios disponibles para este día.</div>`;
      return;
    }
    grid.innerHTML = slots.map(h => `
      <div class="time-slot ${state.hora === h.hora ? 'is-selected' : ''}" data-hora="${h.hora}">${h.hora}</div>
    `).join('');
    grid.querySelectorAll('.time-slot').forEach((el) => {
      el.addEventListener('click', () => {
        grid.querySelectorAll('.time-slot').forEach(s => s.classList.remove('is-selected'));
        el.classList.add('is-selected');
        state.hora = el.dataset.hora;
        validateNext();
      });
    });
  }

  // ===== Paso 5: Confirmar =====
  async function renderConfirm() {
    const card = $('#confirmCard');
    const esp = (await window.FC_DB.listEspecialidades()).find(e => e.id === state.especialidadId);
    const med = await window.FC_DB.findMedico(state.medicoId);
    card.innerHTML = `
      <h3>Resumen de tu turno</h3>
      <div class="confirm-row"><span class="label">Especialidad</span><span class="value">${esp ? esp.nombre : '—'}</span></div>
      <div class="confirm-row"><span class="label">Médico</span><span class="value">${med ? `${med.nombre} ${med.apellido}` : '—'}</span></div>
      <div class="confirm-row"><span class="label">Fecha</span><span class="value">${state.fecha ? window.FC_UTIL.formatFechaLarga(state.fecha) : '—'}</span></div>
      <div class="confirm-row"><span class="label">Hora</span><span class="value">${state.hora || '—'} hs</span></div>
    `;
  }

  // ===== Navegación =====
  $('#btnBack').addEventListener('click', () => {
    if (state.step > 1) {
      state.step--;
      renderForStep();
      renderSteps();
    }
  });

  $('#btnNext').addEventListener('click', async () => {
    if (state.step < 5) {
      state.step++;
      renderForStep();
      renderSteps();
    } else {
      try {
        $('#btnNext').disabled = true;
        $('#btnNext').textContent = 'Guardando...';
        await window.FC_DB.createTurno({
          pacienteId: session.pacienteId,
          medicoId: state.medicoId,
          fecha: state.fecha,
          hora: state.hora
        });
        window.FC_UTIL.showModal({
          icon: 'success',
          title: 'Turno confirmado',
          message: `Reservaste tu turno para el ${state.fecha} a las ${state.hora}.`,
          confirmText: 'Ver mis turnos',
          onConfirm: () => {
            window.location.href = 'mis-turnos.html';
          }
        });
      } catch (err) {
        window.FC_UTIL.showModal({
          icon: 'danger',
          title: 'No se pudo confirmar',
          message: err.message || 'Intentá de nuevo en unos momentos.',
          confirmText: 'Entendido'
        });
        $('#btnNext').disabled = false;
        $('#btnNext').textContent = 'Confirmar turno';
      }
    }
  });

  async function renderForStep() {
    if (state.step === 1) await renderEspecialidades();
    else if (state.step === 2) await renderMedicos();
    else if (state.step === 3) renderCalendario();
    else if (state.step === 4) await renderHorarios();
    else if (state.step === 5) await renderConfirm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderSteps();
  renderForStep();
})();
