/**
 * repository.js — Capa de datos para el panel ADMIN
 *
 * Hoy persiste en localStorage. Cuando se conecte Firebase, este mismo
 * módulo expondrá la misma API pero los métodos delegarán a Firestore/RTDB.
 * Las páginas admin consumen SOLO esta API → migrar a Firebase no rompe nada.
 *
 * Entidades:
 *   - especialidades
 *   - medicos
 *   - horarios        (slots semanales por médico)
 *   - turnos
 *   - pacientes
 *   - usuarios
 *   - centro          (configuración del centro médico, single-doc)
 */

(function () {

  const KEYS = {
    especialidades: 'fc_admin_especialidades',
    medicos:         'fc_admin_medicos',
    horarios:        'fc_admin_horarios',
    turnos:          'fc_admin_turnos',
    pacientes:       'fc_admin_pacientes',
    usuarios:        'fc_admin_usuarios',
    centro:          'fc_admin_centro'
  };

  // ============ Seeds ============
  const SEED_ESPECIALIDADES = [
    { id: 'e-1', nombre: 'Cardiología',     icono: 'heart',       color: 'blue'   },
    { id: 'e-2', nombre: 'Clínica Médica',  icono: 'stethoscope', color: 'green'  },
    { id: 'e-3', nombre: 'Pediatría',       icono: 'baby',        color: 'cream'  },
    { id: 'e-4', nombre: 'Dermatología',    icono: 'skin',        color: 'pink'   },
    { id: 'e-5', nombre: 'Oftalmología',    icono: 'eye',         color: 'teal'   },
    { id: 'e-6', nombre: 'Traumatología',   icono: 'bone',        color: 'violet' }
  ];

  const SEED_MEDICOS = [
    { id: 'm-1', nombre: 'María',   apellido: 'Castillo', matricula: 'MN-12345', especialidadId: 'e-1', telefono: '+54 11 5555-0001', email: 'maria.castillo@filacero.app', activo: true },
    { id: 'm-2', nombre: 'Roberto', apellido: 'López',    matricula: 'MN-22345', especialidadId: 'e-2', telefono: '+54 11 5555-0002', email: 'roberto.lopez@filacero.app',  activo: true },
    { id: 'm-3', nombre: 'Ana',     apellido: 'González', matricula: 'MN-32345', especialidadId: 'e-3', telefono: '+54 11 5555-0003', email: 'ana.gonzalez@filacero.app',   activo: true },
    { id: 'm-4', nombre: 'Fernando',apellido: 'Ponce',    matricula: 'MN-42345', especialidadId: 'e-4', telefono: '+54 11 5555-0004', email: 'fernando.ponce@filacero.app', activo: true },
    { id: 'm-5', nombre: 'Laura',   apellido: 'Medina',   matricula: 'MN-52345', especialidadId: 'e-5', telefono: '+54 11 5555-0005', email: 'laura.medina@filacero.app',   activo: true },
    { id: 'm-6', nombre: 'Diego',   apellido: 'Suárez',   matricula: 'MN-62345', especialidadId: 'e-6', telefono: '+54 11 5555-0006', email: 'diego.suarez@filacero.app',   activo: true }
  ];

  // Horario por defecto: lunes a viernes 09:00–17:00 cada 30 min
  const DEFAULT_DIAS = [1, 2, 3, 4, 5];
  const DEFAULT_SLOTS = (() => {
    const arr = [];
    for (let h = 9; h < 17; h++) for (const m of [0, 30]) arr.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    return arr;
  })();

  function seedHorarios() {
    const arr = [];
    SEED_MEDICOS.forEach(m => {
      DEFAULT_DIAS.forEach(d => {
        arr.push({ id: `h-${m.id}-${d}`, medicoId: m.id, diaSemana: d, slots: [...DEFAULT_SLOTS] });
      });
    });
    return arr;
  }

  const SEED_PACIENTES = [
    { id: 'p-1', nombre: 'Juan', apellido: 'Pérez', dni: '40123456', fechaNacimiento: '1995-03-12', obraSocial: 'OSDE', telefono: '+54 11 5555-0101', email: 'juan@demo.com', createdAt: Date.now() - 30*24*3600*1000 }
  ];

  const SEED_USUARIOS = [
    { id: 'u-pac-1', email: 'juan@demo.com',      password: 'demo1234', rol: 'paciente', pacienteId: 'p-1', createdAt: Date.now() - 30*24*3600*1000 },
    { id: 'u-admin-1', email: 'admin@filacero.app', password: 'admin123', rol: 'admin', pacienteId: null,  createdAt: Date.now() - 60*24*3600*1000 }
  ];

  const SEED_TURNOS = [
    { id: 't-1', pacienteId: 'p-1', medicoId: 'm-1', fecha: _hoy(),    hora: '09:30', estado: 'confirmado', createdAt: Date.now() - 2*24*3600*1000 },
    { id: 't-2', pacienteId: 'p-1', medicoId: 'm-2', fecha: _hoy(),    hora: '11:00', estado: 'proximo',   createdAt: Date.now() - 1*24*3600*1000 },
    { id: 't-3', pacienteId: 'p-1', medicoId: 'm-3', fecha: _hoy(-3),  hora: '14:15', estado: 'asistido',  createdAt: Date.now() - 5*24*3600*1000 },
    { id: 't-4', pacienteId: 'p-1', medicoId: 'm-4', fecha: _hoy(-5),  hora: '10:00', estado: 'cancelado', createdAt: Date.now() - 6*24*3600*1000 },
    { id: 't-5', pacienteId: 'p-1', medicoId: 'm-5', fecha: _hoy(2),   hora: '16:30', estado: 'proximo',   createdAt: Date.now() - 1*24*3600*1000 },
    { id: 't-6', pacienteId: 'p-1', medicoId: 'm-1', fecha: _hoy(1),   hora: '10:30', estado: 'confirmado',createdAt: Date.now() - 1*24*3600*1000 }
  ];

  function _hoy(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }

  // ============ Storage helpers ============
  function _load(key, seedFactory) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {}
    const seed = seedFactory();
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  function _save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function _uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  // ============ API pública ============
  const Repo = {

    // ====== Especialidades ======
    async listEspecialidades() {
      return _load(KEYS.especialidades, () => [...SEED_ESPECIALIDADES]);
    },
    async createEspecialidad(data) {
      const all = await this.listEspecialidades();
      const nueva = { id: _uid('e'), ...data };
      all.push(nueva);
      _save(KEYS.especialidades, all);
      return nueva;
    },
    async updateEspecialidad(id, patch) {
      const all = await this.listEspecialidades();
      const idx = all.findIndex(e => e.id === id);
      if (idx < 0) throw new Error('Especialidad no encontrada');
      all[idx] = { ...all[idx], ...patch };
      _save(KEYS.especialidades, all);
      return all[idx];
    },
    async deleteEspecialidad(id) {
      const all = await this.listEspecialidades();
      const medicos = await this.listMedicos();
      const enUso = medicos.some(m => m.especialidadId === id);
      if (enUso) throw new Error('No se puede eliminar: hay médicos asignados');
      _save(KEYS.especialidades, all.filter(e => e.id !== id));
      return true;
    },

    // ====== Médicos ======
    async listMedicos({ especialidadId, activo } = {}) {
      const all = _load(KEYS.medicos, () => [...SEED_MEDICOS]);
      const especialidades = await this.listEspecialidades();
      return all
        .filter(m => {
          if (especialidadId && m.especialidadId !== especialidadId) return false;
          if (activo !== undefined && m.activo !== activo) return false;
          return true;
        })
        .map(m => {
          const esp = especialidades.find(e => e.id === m.especialidadId);
          return {
            ...m,
            especialidad: esp ? esp.nombre : '—',
            especialidadColor: esp ? esp.color : 'blue',
            iniciales: `${(m.nombre||'')[0]||''}${(m.apellido||'')[0]||''}`.toUpperCase()
          };
        });
    },
    async getMedico(id) {
      const medicos = await this.listMedicos();
      return medicos.find(m => m.id === id) || null;
    },
    async createMedico(data) {
      const all = _load(KEYS.medicos, () => [...SEED_MEDICOS]);
      const nuevo = { id: _uid('m'), activo: true, ...data };
      all.push(nuevo);
      _save(KEYS.medicos, all);
      // crear horarios default L-V 9-17
      const horarios = _load(KEYS.horarios, seedHorarios);
      DEFAULT_DIAS.forEach(d => {
        horarios.push({ id: _uid('h'), medicoId: nuevo.id, diaSemana: d, slots: [...DEFAULT_SLOTS] });
      });
      _save(KEYS.horarios, horarios);
      return nuevo;
    },
    async updateMedico(id, patch) {
      const all = _load(KEYS.medicos, () => [...SEED_MEDICOS]);
      const idx = all.findIndex(m => m.id === id);
      if (idx < 0) throw new Error('Médico no encontrado');
      all[idx] = { ...all[idx], ...patch };
      _save(KEYS.medicos, all);
      return all[idx];
    },
    async deleteMedico(id) {
      const all = _load(KEYS.medicos, () => [...SEED_MEDICOS]);
      const turnos = _load(KEYS.turnos, () => [...SEED_TURNOS]);
      const conTurnos = turnos.some(t => t.medicoId === id);
      if (conTurnos) throw new Error('No se puede eliminar: tiene turnos asignados');
      _save(KEYS.medicos, all.filter(m => m.id !== id));
      // borrar horarios asociados
      const horarios = _load(KEYS.horarios, seedHorarios);
      _save(KEYS.horarios, horarios.filter(h => h.medicoId !== id));
      return true;
    },

    // ====== Horarios ======
    async listHorariosMedico(medicoId) {
      const all = _load(KEYS.horarios, seedHorarios);
      return all.filter(h => h.medicoId === medicoId).sort((a, b) => a.diaSemana - b.diaSemana);
    },
    async upsertHorario({ medicoId, diaSemana, slots }) {
      const all = _load(KEYS.horarios, seedHorarios);
      const idx = all.findIndex(h => h.medicoId === medicoId && h.diaSemana === diaSemana);
      if (idx >= 0) {
        all[idx].slots = slots;
      } else {
        all.push({ id: _uid('h'), medicoId, diaSemana, slots });
      }
      _save(KEYS.horarios, all);
      return true;
    },
    async deleteHorario(medicoId, diaSemana) {
      const all = _load(KEYS.horarios, seedHorarios);
      _save(KEYS.horarios, all.filter(h => !(h.medicoId === medicoId && h.diaSemana === diaSemana)));
      return true;
    },

    // ====== Turnos ======
    async listTurnos(filtros = {}) {
      const all = _load(KEYS.turnos, () => [...SEED_TURNOS]);
      const medicos = await this.listMedicos();
      const pacientes = await this.listPacientes();
      const result = all
        .filter(t => {
          if (filtros.estado && t.estado !== filtros.estado) return false;
          if (filtros.medicoId && t.medicoId !== filtros.medicoId) return false;
          if (filtros.especialidadId) {
            const m = medicos.find(x => x.id === t.medicoId);
            if (!m || m.especialidadId !== filtros.especialidadId) return false;
          }
          if (filtros.desde && t.fecha < filtros.desde) return false;
          if (filtros.hasta && t.fecha > filtros.hasta) return false;
          if (filtros.pacienteId && t.pacienteId !== filtros.pacienteId) return false;
          return true;
        })
        .map(t => {
          const m = medicos.find(x => x.id === t.medicoId) || {};
          const p = pacientes.find(x => x.id === t.pacienteId) || {};
          return {
            ...t,
            medico: `${m.nombre || ''} ${m.apellido || ''}`.trim() || '—',
            especialidad: m.especialidad || '—',
            especialidadColor: m.especialidadColor || 'blue',
            paciente: `${p.nombre || ''} ${p.apellido || ''}`.trim() || '—',
            pacienteDni: p.dni || ''
          };
        })
        .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
      return result;
    },
    async createTurno(data) {
      const all = _load(KEYS.turnos, () => [...SEED_TURNOS]);
      // Validar choque: mismo médico + fecha + hora ya ocupado (no cancelado)
      const choque = all.find(t =>
        t.medicoId === data.medicoId &&
        t.fecha === data.fecha &&
        t.hora === data.hora &&
        t.estado !== 'cancelado'
      );
      if (choque) throw new Error('Ese horario ya está ocupado para ese médico');
      const nuevo = { id: _uid('t'), estado: 'confirmado', createdAt: Date.now(), ...data };
      all.push(nuevo);
      _save(KEYS.turnos, all);
      return nuevo;
    },
    async deleteTurno(id) {
      const all = _load(KEYS.turnos, () => [...SEED_TURNOS]);
      _save(KEYS.turnos, all.filter(t => t.id !== id));
      return true;
    },
    async updateTurno(id, patch) {
      const all = _load(KEYS.turnos, () => [...SEED_TURNOS]);
      const idx = all.findIndex(t => t.id === id);
      if (idx < 0) throw new Error('Turno no encontrado');
      all[idx] = { ...all[idx], ...patch };
      _save(KEYS.turnos, all);
      return all[idx];
    },

    // ====== Pacientes ======
    async listPacientes() {
      return _load(KEYS.pacientes, () => [...SEED_PACIENTES]);
    },
    async createPaciente(data) {
      const pacientes = await this.listPacientes();
      const usuarios = _load(KEYS.usuarios, () => [...SEED_USUARIOS]);
      if (usuarios.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
        throw new Error('Ya existe un usuario con ese email');
      }
      const pacienteId = _uid('p');
      const usuarioId = _uid('u');
      const tempPassword = data.password || _randomPassword();
      const nuevoPaciente = {
        id: pacienteId,
        usuarioId,
        createdAt: Date.now(),
        ...data
      };
      delete nuevoPaciente.password;
      const nuevoUsuario = {
        id: usuarioId,
        email: data.email,
        password: tempPassword,
        rol: 'paciente',
        pacienteId,
        createdAt: Date.now()
      };
      pacientes.push(nuevoPaciente);
      usuarios.push(nuevoUsuario);
      _save(KEYS.pacientes, pacientes);
      _save(KEYS.usuarios, usuarios);
      return { paciente: nuevoPaciente, usuario: nuevoUsuario, tempPassword };
    },
    async updatePaciente(id, patch) {
      const pacientes = await this.listPacientes();
      const idx = pacientes.findIndex(p => p.id === id);
      if (idx < 0) throw new Error('Paciente no encontrado');
      pacientes[idx] = { ...pacientes[idx], ...patch };
      _save(KEYS.pacientes, pacientes);
      return pacientes[idx];
    },
    async deletePaciente(id) {
      const pacientes = await this.listPacientes();
      const turnos = _load(KEYS.turnos, () => [...SEED_TURNOS]);
      const conTurnos = turnos.some(t => t.pacienteId === id && t.estado !== 'cancelado');
      if (conTurnos) throw new Error('No se puede eliminar: el paciente tiene turnos activos');
      const paciente = pacientes.find(p => p.id === id);
      _save(KEYS.pacientes, pacientes.filter(p => p.id !== id));
      if (paciente && paciente.usuarioId) {
        const usuarios = _load(KEYS.usuarios, () => [...SEED_USUARIOS]);
        _save(KEYS.usuarios, usuarios.filter(u => u.id !== paciente.usuarioId));
      }
      return true;
    },

    // ====== Centro médico ======
    async getCentro() {
      return _load(KEYS.centro, () => ({ ...(window.FC_CONFIG.centroDefault || {}) }));
    },
    async updateCentro(data) {
      const current = await this.getCentro();
      const next = { ...current, ...data };
      _save(KEYS.centro, next);
      return next;
    },

    // ====== Métricas (para dashboard) ======
    async getMetricas() {
      const turnos = _load(KEYS.turnos, () => [...SEED_TURNOS]);
      const medicos = await this.listMedicos();
      const especialidades = await this.listEspecialidades();
      const hoy = _hoy();

      const turnosHoy = turnos.filter(t => t.fecha === hoy);
      const turnosPasados = turnos.filter(t => t.fecha < hoy);
      const turnosFuturos = turnos.filter(t => t.fecha > hoy);

      const cancelados = turnos.filter(t => t.estado === 'cancelado').length;
      const tasaCancelacion = turnos.length ? Math.round((cancelados / turnos.length) * 100) : 0;

      // Turnos por especialidad (todos los estados)
      const porEspecialidad = {};
      turnos.forEach(t => {
        const m = medicos.find(x => x.id === t.medicoId);
        const espId = m ? m.especialidadId : 'sin-esp';
        porEspecialidad[espId] = (porEspecialidad[espId] || 0) + 1;
      });
      const porEspecialidadLista = especialidades
        .map(e => ({ id: e.id, nombre: e.nombre, color: e.color, total: porEspecialidad[e.id] || 0 }))
        .sort((a, b) => b.total - a.total);

      return {
        turnosHoy: turnosHoy.length,
        turnosFuturos: turnosFuturos.length,
        turnosPasados: turnosPasados.length,
        totalTurnos: turnos.length,
        medicosActivos: medicos.filter(m => m.activo).length,
        medicosTotal: medicos.length,
        tasaCancelacion,
        porEspecialidad: porEspecialidadLista,
        estados: {
          pendiente:   turnos.filter(t => t.estado === 'pendiente').length,
          confirmado:  turnos.filter(t => t.estado === 'confirmado').length,
          proximo:     turnos.filter(t => t.estado === 'proximo').length,
          asistido:    turnos.filter(t => t.estado === 'asistido').length,
          cancelado:   turnos.filter(t => t.estado === 'cancelado').length
        }
      };
    },

    // ====== Util ======
    async resetAll() {
      Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    }
  };

  function _randomPassword() {
    return Math.random().toString(36).slice(-8);
  }

  window.FC_REPO = Repo;
})();
