/**
 * db.js — Capa de datos con persistencia local
 *
 * Cuando tu compañero conecte Firebase, solo reemplaza las funciones
 * internas de lectura/escritura por las llamadas reales a Firestore.
 * Por ahora todo funciona con localStorage para que la app sea usable.
 */
(function () {

  // ===== Datos iniciales =====
  const ESPECIALIDADES = [
    { id: 'e-1', nombre: 'Cardiología',     icono: 'heart' },
    { id: 'e-2', nombre: 'Clínica Médica',  icono: 'stethoscope' },
    { id: 'e-3', nombre: 'Pediatría',       icono: 'baby' },
    { id: 'e-4', nombre: 'Dermatología',    icono: 'skin' },
    { id: 'e-5', nombre: 'Oftalmología',    icono: 'eye' },
    { id: 'e-6', nombre: 'Traumatología',   icono: 'bone' }
  ];

  const MEDICOS = [
    { id: 'm-1', nombre: 'María',    apellido: 'Castillo', matricula: 'MN-12345', especialidadId: 'e-1', activo: true },
    { id: 'm-2', nombre: 'Roberto',  apellido: 'López',    matricula: 'MN-22345', especialidadId: 'e-2', activo: true },
    { id: 'm-3', nombre: 'Ana',      apellido: 'González', matricula: 'MN-32345', especialidadId: 'e-3', activo: true },
    { id: 'm-4', nombre: 'Fernando', apellido: 'Ponce',    matricula: 'MN-42345', especialidadId: 'e-4', activo: true },
    { id: 'm-5', nombre: 'Laura',    apellido: 'Medina',   matricula: 'MN-52345', especialidadId: 'e-5', activo: true },
    { id: 'm-6', nombre: 'Diego',    apellido: 'Suárez',   matricula: 'MN-62345', especialidadId: 'e-6', activo: true }
  ];

  const TURNOS_DEMO = [
    { id: 't-1', pacienteId: 'p-1', medicoId: 'm-1', fecha: '2025-08-04', hora: '09:30', estado: 'confirmado' },
    { id: 't-2', pacienteId: 'p-1', medicoId: 'm-2', fecha: '2025-08-06', hora: '11:00', estado: 'proximo' },
    { id: 't-3', pacienteId: 'p-1', medicoId: 'm-3', fecha: '2025-07-10', hora: '14:15', estado: 'asistido' },
    { id: 't-4', pacienteId: 'p-1', medicoId: 'm-4', fecha: '2025-07-15', hora: '10:00', estado: 'cancelado' },
    { id: 't-5', pacienteId: 'p-1', medicoId: 'm-5', fecha: '2025-08-18', hora: '16:30', estado: 'proximo' }
  ];

  const NOTIFS_DEMO = [
    { id: 'n-1', usuarioId: 'u-pac-1', mensaje: 'Tu turno del 4 Ago a las 09:30 con Dra. María Castillo fue confirmado.', fecha: Date.now() - 3*24*3600*1000, leida: false },
    { id: 'n-2', usuarioId: 'u-pac-1', mensaje: 'Recordatorio: tenés un turno el 6 Ago a las 11:00 con Dr. Roberto López.', fecha: Date.now() - 1*24*3600*1000, leida: false },
    { id: 'n-3', usuarioId: 'u-pac-1', mensaje: 'Tu turno del 15 Jul a las 10:00 fue cancelado.', fecha: Date.now() - 7*24*3600*1000, leida: true }
  ];

  const STORAGE_KEYS = {
    turnos: 'filacero_turnos',
    notificaciones: 'filacero_notificaciones',
    horariosOcupados: 'filacero_horarios_ocupados',
    initialized: 'filacero_initialized'
  };

  function _read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }
  function _write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function _initData() {
    if (_read(STORAGE_KEYS.initialized, false)) return;
    _write(STORAGE_KEYS.turnos, TURNOS_DEMO.map(t => ({ ...t })));
    _write(STORAGE_KEYS.notificaciones, NOTIFS_DEMO.map(n => ({ ...n })));
    _write(STORAGE_KEYS.horariosOcupados, {});
    _write(STORAGE_KEYS.initialized, true);
  }
  _initData();

  function _uid(prefix = 'id') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function _medicoConEspecialidad(m) {
    const esp = ESPECIALIDADES.find(e => e.id === m.especialidadId);
    return { ...m, especialidad: esp ? esp.nombre : '' };
  }

  function _turnoEnriquecido(t) {
    const m = MEDICOS.find(x => x.id === t.medicoId) || {};
    const esp = ESPECIALIDADES.find(e => e.id === m.especialidadId) || {};
    return {
      ...t,
      medico: `${m.nombre || ''} ${m.apellido || ''}`.trim(),
      especialidad: esp.nombre || '',
      especialidadId: esp.id || '',
      iniciales: `${(m.nombre||'')[0]||''}${(m.apellido||'')[0]||''}`.toUpperCase()
    };
  }

  function _turnosStore() {
    return _read(STORAGE_KEYS.turnos, []);
  }
  function _notifsStore() {
    return _read(STORAGE_KEYS.notificaciones, []);
  }
  function _horariosStore() {
    return _read(STORAGE_KEYS.horariosOcupados, {});
  }

  function _addNotificacion({ usuarioId, mensaje }) {
    const list = _notifsStore();
    list.unshift({ id: _uid('n'), usuarioId, mensaje, fecha: Date.now(), leida: false });
    _write(STORAGE_KEYS.notificaciones, list);
  }

  function _ocuparHorario(medicoId, fecha, hora) {
    const store = _horariosStore();
    const key = `${medicoId}-${fecha}`;
    if (!store[key]) store[key] = [];
    if (!store[key].includes(hora)) store[key].push(hora);
    _write(STORAGE_KEYS.horariosOcupados, store);
  }

  function _liberarHorario(medicoId, fecha, hora) {
    const store = _horariosStore();
    const key = `${medicoId}-${fecha}`;
    if (!store[key]) return;
    store[key] = store[key].filter(h => h !== hora);
    _write(STORAGE_KEYS.horariosOcupados, store);
  }

  // ===== API pública =====
  const API = {

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
    async updatePaciente(usuarioId, data) {
      // Persistir en localStorage para que parezca real
      const key = `filacero_paciente_${usuarioId}`;
      const current = _read(key, await this.findPacienteByUsuario(usuarioId));
      const updated = { ...current, ...data };
      _write(key, updated);
      return updated;
    },

    async listEspecialidades() {
      return ESPECIALIDADES.map(e => ({ ...e }));
    },

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

    async listHorariosDisponibles(medicoId, fecha) {
      const ocupados = _horariosStore()[`${medicoId}-${fecha}`] || [];
      const slots = [];
      for (let h = 9; h < 17; h++) {
        for (const mm of [0, 30]) {
          const hora = `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
          if (ocupados.includes(hora)) continue;
          slots.push({ id: _uid('h'), medicoId, fecha, hora });
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
    async reservarHorario(medicoId, fecha, hora) {
      _ocuparHorario(medicoId, fecha, hora);
    },
    async liberarHorario(medicoId, fecha, hora) {
      _liberarHorario(medicoId, fecha, hora);
    },

    async createTurno({ pacienteId, medicoId, fecha, hora }) {
      const m = await this.findMedico(medicoId);
      const nuevo = {
        id: _uid('t'),
        pacienteId,
        medicoId,
        fecha,
        hora,
        estado: 'confirmado'
      };
      const turnos = _turnosStore();
      turnos.push(nuevo);
      _write(STORAGE_KEYS.turnos, turnos);
      _ocuparHorario(medicoId, fecha, hora);
      _addNotificacion({
        usuarioId: 'u-pac-1',
        mensaje: `Tu turno de ${m.especialidad} con ${m.nombre} ${m.apellido} el ${fecha} a las ${hora} fue confirmado.`
      });
      return _turnoEnriquecido(nuevo);
    },

    async listTurnos(pacienteId) {
      return _turnosStore()
        .filter(t => t.pacienteId === pacienteId)
        .map(_turnoEnriquecido)
        .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
    },

    async cancelarTurno(turnoId) {
      const turnos = _turnosStore();
      const idx = turnos.findIndex(t => t.id === turnoId);
      if (idx === -1) throw new Error('TURNO_NO_ENCONTRADO');
      const t = turnos[idx];
      t.estado = 'cancelado';
      _write(STORAGE_KEYS.turnos, turnos);
      _liberarHorario(t.medicoId, t.fecha, t.hora);
      const m = await this.findMedico(t.medicoId);
      _addNotificacion({
        usuarioId: 'u-pac-1',
        mensaje: `Tu turno de ${m.especialidad} del ${t.fecha} a las ${t.hora} fue cancelado.`
      });
      return _turnoEnriquecido(t);
    },

    async listNotificaciones(usuarioId) {
      return _notifsStore()
        .filter(n => n.usuarioId === usuarioId)
        .sort((a, b) => b.fecha - a.fecha);
    },

    async resetAll() {
      _write(STORAGE_KEYS.turnos, TURNOS_DEMO.map(t => ({ ...t })));
      _write(STORAGE_KEYS.notificaciones, NOTIFS_DEMO.map(n => ({ ...n })));
      _write(STORAGE_KEYS.horariosOcupados, {});
    }
  };

  window.FC_DB = API;
})();
