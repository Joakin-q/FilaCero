/**
 * solicitar.js — Wizard 5 pasos (MODO VISUAL)
 *
 * El wizard se puede navegar paso a paso (atrás/siguiente),
 * pero al confirmar muestra "Acción deshabilitada".
 */

(function () {
  const session = window.FC_AUTH ? window.FC_AUTH.getSession() : null;

  const state = { step: 1, especialidadId: null, medicoId: null, fecha: null, horarioId: null, hora: null };
  const mesActual = { año: new Date().getFullYear(), mes: new Date().getMonth() };

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  if (session) {
    window.FC_UTIL.mountSidebar({ active: 'pedir', user: session });
    window.FC_UTIL.mountTopbar({ title: 'Pedir turno', user: session });
  }
  window.FC_UTIL.mountBottomNav('pedir');

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
  }

  // ===== Paso 1: Especialidades (mock) =====
  function renderEspecialidades() {
    const list = $('#especialidadesList');
    const data = [
      { id: 'e-1', nombre: 'Cardiología' },
      { id: 'e-2', nombre: 'Clínica Médica' },
      { id: 'e-3', nombre: 'Pediatría' },
      { id: 'e-4', nombre: 'Dermatología' },
      { id: 'e-5', nombre: 'Oftalmología' },
      { id: 'e-6', nombre: 'Traumatología' }
    ];
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
      el.addEventListener('click', () => {
        list.querySelectorAll('.option-card').forEach(c => c.classList.remove('is-selected'));
        el.classList.add('is-selected');
        state.especialidadId = el.dataset.esp;
      });
    });
  }

  // ===== Paso 2: Médicos (mock) =====
  function renderMedicos() {
    const list = $('#medicosList');
    const data = [
      { id: 'm-1', nombre: 'María',   apellido: 'Castillo', esp: 'e-1', matricula: 'MN-12345' },
      { id: 'm-2', nombre: 'Roberto', apellido: 'López',    esp: 'e-2', matricula: 'MN-22345' }
    ];
    const colorMap = { 'e-1': 'blue', 'e-2': 'green', 'e-3': 'cream', 'e-4': 'pink', 'e-5': 'teal', 'e-6': 'violet' };
    const espNombre = { 'e-1':'Cardiología','e-2':'Clínica Médica','e-3':'Pediatría','e-4':'Dermatología','e-5':'Oftalmología','e-6':'Traumatología' };
    list.innerHTML = data.map(m => {
      const ini = `${m.nombre[0]}${m.apellido[0]}`.toUpperCase();
      return `
        <div class="option-card" data-med="${m.id}">
          <div class="turno-avatar turno-avatar--${colorMap[m.esp]}" style="width:44px;height:44px;border-radius:12px;">${ini}</div>
          <div class="option-text">
            <div class="option-title">Dr. ${m.nombre} ${m.apellido}</div>
            <div class="option-sub">${espNombre[m.esp]} · Matrícula ${m.matricula}</div>
          </div>
        </div>
      `;
    }).join('');
    list.querySelectorAll('.option-card').forEach((el) => {
      el.addEventListener('click', () => {
        list.querySelectorAll('.option-card').forEach(c => c.classList.remove('is-selected'));
        el.classList.add('is-selected');
        state.medicoId = el.dataset.med;
      });
    });
  }

  // ===== Paso 3: Calendario (mock) =====
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
            const isPast = date < today;
            return `<div class="day ${isPast ? 'is-disabled' : ''}" data-iso="${date.toISOString().slice(0,10)}">${d}</div>`;
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
          cal.querySelectorAll('.day').forEach(d => d.classList.remove('is-selected'));
          el.classList.add('is-selected');
        });
      });
    };
    draw();
  }

  // ===== Paso 4: Horarios (mock) =====
  function renderHorarios() {
    const grid = $('#timesGrid');
    const slots = ['09:00','09:30','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30'];
    grid.innerHTML = slots.map(h => `<div class="time-slot" data-hora="${h}">${h}</div>`).join('');
    grid.querySelectorAll('.time-slot').forEach((el) => {
      el.addEventListener('click', () => {
        grid.querySelectorAll('.time-slot').forEach(s => s.classList.remove('is-selected'));
        el.classList.add('is-selected');
        state.horarioId = el.dataset.hora;
        state.hora = el.dataset.hora;
      });
    });
  }

  // ===== Paso 5: Confirmar (solo visual) =====
  function renderConfirm() {
    const card = $('#confirmCard');
    const espNombre = { 'e-1':'Cardiología','e-2':'Clínica Médica','e-3':'Pediatría','e-4':'Dermatología','e-5':'Oftalmología','e-6':'Traumatología' };
    const nombre = state.especialidadId ? (espNombre[state.especialidadId] || '—') : '—';
    card.innerHTML = `
      <h3>Resumen de tu turno</h3>
      <div class="confirm-row"><span class="label">Especialidad</span><span class="value">${nombre}</span></div>
      <div class="confirm-row"><span class="label">Médico</span><span class="value">${state.medicoId ? 'Dr. María Castillo' : '—'}</span></div>
      <div class="confirm-row"><span class="label">Fecha</span><span class="value">${state.fecha || '—'}</span></div>
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

  $('#btnNext').addEventListener('click', () => {
    if (state.step < 5) {
      state.step++;
      renderForStep();
      renderSteps();
    } else {
      window.FC_UTIL.showModal({
        icon: 'danger',
        title: 'Acción deshabilitada',
        message: 'La creación de turnos no está activa en esta versión.',
        confirmText: 'Entendido'
      });
    }
  });

  function renderForStep() {
    if (state.step === 1) renderEspecialidades();
    else if (state.step === 2) renderMedicos();
    else if (state.step === 3) renderCalendario();
    else if (state.step === 4) renderHorarios();
    else if (state.step === 5) renderConfirm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderSteps();
  renderForStep();
})();