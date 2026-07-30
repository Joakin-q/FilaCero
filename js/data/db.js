/**
 * db.js — Capa de datos ESTÁTICA (solo lectura)
 *
 * Devuelve los mismos datos de ejemplo siempre, sin persistir nada.
 * Las funciones de escritura (createTurno, cancelarTurno, etc.) están
 * definidas pero no hacen nada — son stubs para que las pantallas
 * no rompan si alguien las llama por error.
 */

(function () {

  // ===== Datos estáticos (no se modifican) =====
  const ESPECIALIDADES = [
    { id: 'e-1', nombre: 'Cardiología',     icono: 'heart' },
    { id: 'e-2', nombre: 'Clínica Médica',  icono: 'stethoscope' },
    { id: 'e-3', nombre: 'Pediatría',       icono: 'baby' },
    { id: 'e-4', nombre: 'Dermatología',    icono: 'skin' },
    { id: 'e-5', nombre: 'Oftalmología',    icono: 'eye' },
    { id: 'e-6', nombre: 'Traumatología',   icono: 'bone' }
  ];

  const MEDICOS = [
    { id: 'm-1', nombre: 'María',   apellido: 'Castillo', matricula: 'MN-12345', especialidadId: 'e-1', activo: true },
    { id: 'm-2', nombre: 'Roberto', apellido: 'López',    matricula: 'MN-22345', especialidadId: 'e-2', activo: true },
    { id: 'm-3', nombre: 'Ana',     apellido: 'González', matricula: 'MN-32345', especialidadId: 'e-3', activo: true },
    { id: 'm-4', nombre: 'Fernando', apellido: 'Ponce',   matricula: 'MN-42345', especialidadId: 'e-4', activo: true },
    { id: 'm-5', nombre: 'Laura',   apellido: 'Medina',   matricula: 'MN-52345', especialidadId: 'e-5', activo: true },
    { id: 'm-6', nombre: 'Diego',   apellido: 'Suárez',   matricula: 'MN-62345', especialidadId: 'e-6', activo: true }
  ];

  const TURNOS_DEMO = [
    {
      id: 't-1', pacienteId: 'p-1', medicoId: 'm-1',
      fecha: '2025-08-04', hora: '09:30', estado: 'confirmado'
    },
    {
      id: 't-2', pacienteId: 'p-1', medicoId: 'm-2',
      fecha: '2025-08-06', hora: '11:00', estado: 'proximo'
    },
    {
      id: 't-3', pacienteId: 'p-1', medicoId: 'm-3',
      fecha: '2025-07-10', hora: '14:15', estado: 'asistido'
    },
    {
      id: 't-4', pacienteId: 'p-1', medicoId: 'm-4',
      fecha: '2025-07-15', hora: '10:00', estado: 'cancelado'
    },
    {
      id: 't-5', pacienteId: 'p-1', medicoId: 'm-5',
      fecha: '2025-08-18', hora: '16:30', estado: 'proximo'
    }
  ];

  const NOTIFS_DEMO = [
    { id: 'n-1', mensaje: 'Tu turno del 4 Ago a las 09:30 con Dra. María Castillo fue confirmado.', fecha: Date.now() - 3*24*3600*1000, leida: false },
    { id: 'n-2', mensaje: 'Recordatorio: tenés un turno el 6 Ago a las 11:00 con Dr. Roberto López.', fecha: Date.now() - 1*24*3600*1000, leida: false },
    { id: 'n-3', mensaje: 'Tu turno del 15 Jul a las 10:00 fue cancelado.', fecha: Date.now() - 7*24*3600*1000, leida: true }
  ];

  // ===== Helpers =====
  function _medicoConEspecialidad(m) {
    const esp = ESPECIALIDADES.find(e => e.id === m.especialidadId);
    return { ...m, especialidad: esp ? esp.nombre : '' };
  }
  function _turnoEnriquecido(t) {
    const m = MEDICOS.find(x => x.id === t.medicoId) || {};
    const esp = ESPECIALIDADES.find(e => e.id === m.especialidadId) || {};
    return {
      ...t,
      hora: t.hora,
      medico: `${m.nombre || ''} ${m.apellido || ''}`.trim(),
      especialidad: esp.nombre || '',
      especialidadId: esp.id || '',
      iniciales: `${(m.nombre||'')[0]||''}${(m.apellido||'')[0]||''}`.toUpperCase()
    };
  }

  // ===== API pública (todo de solo lectura) =====
  const API = {

    // ----- Usuarios (sólo se consultan, no se crean) -----
    async findUserByEmail(email) {
      const e = email.toLowerCase();
      if (e === 'juan@demo.com') {
        return { id: 'u-pac-1', email, passwordHash: 'demo1234', rol: 'paciente', createdAt: 0 };
      }
      if (e === 'admin@filacero.app') {
        return { id: 'u-admin-1', email, passwordHash: 'admin123', rol: 'admin', createdAt: 0 };
      }
      return null;
    },
    async createUser() { throw new Error('Registro deshabilitado'); },

    // ----- Pacientes -----
    async findPacienteByUsuario(usuarioId) {
      if (usuarioId === 'u-pac-1') {
        return {
          id: 'p-1', usuarioId, nombre: 'Juan', apellido: 'Pérez',
          dni: '40123456', fechaNacimiento: '1995-03-12',
          obraSocial: 'OSDE', telefono: '+54 11 5555-0101'
        };
      }
      return null;
    },
    async createPaciente() { throw new Error('Registro deshabilitado'); },
    async updatePaciente() { throw new Error('Edición deshabilitada'); },

    // ----- Especialidades -----
    async listEspecialidades() {
      return ESPECIALIDADES.map(e => ({ ...e }));
    },

    // ----- Médicos -----
    async listMedicos({ especialidadId, activo } = {}) {
      return MEDICOS.filter(m => {
        if (especialidadId && m.especialidadId !== especialidadId) return false;
        if (activo !== undefined && m.activo !== activo) return false;
        return true;
      }).map(_medicoConEspecialidad);
    },
    async findMedico(medicoId) {
      const m = MEDICOS.find(x => x.id === medicoId);
      return m ? _medicoConEspecialidad(m) : null;
    },

    // ----- Horarios (slots mock: 9 a 17 cada 30 min) -----
    async listHorariosDisponibles(medicoId, fecha) {
      const slots = [];
      for (let h = 9; h < 17; h++) {
        for (const mm of [0, 30]) {
          const hora = `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
          const ocupados = ['09:00','09:30','10:00','11:00','14:00','15:30','16:30'];
          if (ocupados.includes(hora)) continue;
          slots.push({ id: `h-${medicoId}-${fecha}-${hora.replace(':','')}`, hora });
        }
      }
      return slots;
    },
    async listFechasConHorarios() {
      const fechas = [];
      const start = new Date();
      let d = 0;
      while (fechas.length < 14) {
        const date = new Date(start);
        date.setDate(start.getDate() + d);
        if (date.getDay() !== 0) fechas.push(date.toISOString().slice(0,10));
        d++;
      }
      return fechas;
    },
    async reservarHorario() { throw new Error('Reserva deshabilitada'); },
    async liberarHorario() { /* noop */ },

    // ----- Turnos -----
    async createTurno() { throw new Error('Creación deshabilitada'); },
    async listTurnos(pacienteId) {
      return TURNOS_DEMO
        .filter(t => t.pacienteId === pacienteId)
        .map(_turnoEnriquecido)
        .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
    },
    async cancelarTurno() { throw new Error('Cancelación deshabilitada'); },

    // ----- Notificaciones -----
    async listNotificaciones(usuarioId) {
      if (usuarioId !== 'u-pac-1') return [];
      return NOTIFS_DEMO.map(n => ({ ...n }));
    },

    // ----- Reset -----
    async resetAll() { /* noop */ }
  };

  window.FC_DB = API;
})();