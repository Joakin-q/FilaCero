/* repository.js — Firestore */
(function () {
  const db = window.FC_FIREBASE && window.FC_FIREBASE.db;
  if (!db) throw new Error('Firebase no fue inicializado antes de repository.js');

  const COLORS = ['blue', 'green', 'cream', 'pink', 'teal', 'violet'];
  const colorFor = (id) => COLORS[Math.abs([...String(id)].reduce((n, c) => n + c.charCodeAt(0), 0)) % COLORS.length];
  const fullName = (d) => `${d.Nombre || d.nombre || ''} ${d.Apellido || d.apellido || ''}`.trim();

  async function especialidades() {
    const snap = await db.collection('Especialidades').get();
    return snap.docs.map((doc, index) => {
      const d = doc.data();
      return {
        id: doc.id,
        nombre: d.Nombre || d.nombre || doc.id,
        icono: d.icono || 'stethoscope',
        color: d.color || COLORS[index % COLORS.length]
      };
    }).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  async function medicos() {
    const [docsSnap, esp] = await Promise.all([
      db.collection('Doctores').get(),
      especialidades()
    ]);
    return docsSnap.docs.map(doc => {
      const d = doc.data();
      const especialidadId = d.EspecialidadID || d.especialidadID || d.especialidadId || '';
      const especialidad = esp.find(e => e.id === especialidadId);
      const nombre = d.Nombre || d.nombre || '';
      const apellido = d.Apellido || d.apellido || '';
      return {
        id: doc.id,
        nombre,
        apellido,
        matricula: d.Matricula || d.matricula || '—',
        especialidadId,
        especialidad: especialidad ? especialidad.nombre : especialidadId || '—',
        especialidadColor: especialidad ? especialidad.color : colorFor(especialidadId),
        telefono: d.Telefono || d.telefono || '',
        email: d.Email || d.email || '',
        activo: d.Disponible !== false && d.disponible !== false && d.activo !== false,
        iniciales: `${nombre[0] || ''}${apellido[0] || ''}`.toUpperCase()
      };
    }).sort((a, b) => `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`));
  }

  async function pacientes() {
    const [usersSnap, patientsSnap] = await Promise.all([
      db.collection('usuarios').get(),
      db.collection('pacientes').get()
    ]);

    const patientsMap = {};
    patientsSnap.docs.forEach(doc => {
      const d = doc.data();
      patientsMap[doc.id] = d;
      if (d.usuarioId) patientsMap[d.usuarioId] = d;
    });

    return usersSnap.docs.map(doc => {
      const u = doc.data();
      const p = patientsMap[doc.id] || {};
      return {
        id: doc.id,
        usuarioId: doc.id,
        nombre: p.nombre || u.nombre || u.Nombre || '',
        apellido: p.apellido || u.apellido || u.Apellido || '',
        dni: p.dni || u.dni || u.DNI || '—',
        email: u.email || '',
        telefono: p.telefono || u.telefono || u.Telefono || '',
        obraSocial: p.obraSocial || u.obraSocial || u.ObraSocial || '',
        fechaNacimiento: p.fechaNacimiento || u.fechaNacimiento || u.FechaNacimiento || '',
        rol: u.rol || 'paciente'
      };
    }).filter(p => p.nombre || p.apellido || p.email);
  }

  const Repo = {
    async listEspecialidades() { return especialidades(); },

    async createEspecialidad(data) {
      const ref = await db.collection('Especialidades').add({
        Nombre: data.nombre,
        color: data.color || 'blue',
        icono: data.icono || 'stethoscope'
      });
      return { id: ref.id, ...data };
    },

    async updateEspecialidad(id, patch) {
      await db.collection('Especialidades').doc(id).update({
        ...(patch.nombre !== undefined ? { Nombre: patch.nombre } : {}),
        ...(patch.color !== undefined ? { color: patch.color } : {}),
        ...(patch.icono !== undefined ? { icono: patch.icono } : {})
      });
      return { id, ...patch };
    },

    async deleteEspecialidad(id) {
      const docs = await medicos();
      if (docs.some(m => m.especialidadId === id)) throw new Error('No se puede eliminar: hay médicos asignados');
      await db.collection('Especialidades').doc(id).delete();
      return true;
    },

    async listMedicos(filters = {}) {
      let result = await medicos();
      if (filters.especialidadId) result = result.filter(m => m.especialidadId === filters.especialidadId);
      if (filters.activo !== undefined) result = result.filter(m => m.activo === filters.activo);
      return result;
    },

    async getMedico(id) {
      return (await medicos()).find(m => m.id === id) || null;
    },

    async createMedico(data) {
      const ref = await db.collection('Doctores').add({
        Nombre: data.nombre,
        Apellido: data.apellido,
        EspecialidadID: data.especialidadId,
        Disponible: data.activo !== false,
        Matricula: data.matricula || '',
        Telefono: data.telefono || '',
        Email: data.email || ''
      });
      return { id: ref.id, ...data };
    },

    async updateMedico(id, patch) {
      const next = {};
      if (patch.nombre !== undefined) next.Nombre = patch.nombre;
      if (patch.apellido !== undefined) next.Apellido = patch.apellido;
      if (patch.especialidadId !== undefined) next.EspecialidadID = patch.especialidadId;
      if (patch.activo !== undefined) next.Disponible = patch.activo;
      if (patch.matricula !== undefined) next.Matricula = patch.matricula;
      if (patch.telefono !== undefined) next.Telefono = patch.telefono;
      if (patch.email !== undefined) next.Email = patch.email;
      await db.collection('Doctores').doc(id).update(next);
      return { id, ...patch };
    },

    async deleteMedico(id) {
      const turnos = await this.listTurnos({ medicoId: id });
      if (turnos.some(t => t.estado !== 'cancelado')) throw new Error('No se puede eliminar: tiene turnos asignados');
      await db.collection('Doctores').doc(id).delete();
      return true;
    },

    async listHorariosMedico(medicoId) {
      const snap = await db.collection('Horarios').where('MedicoID', '==', medicoId).get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async listHorariosDisponibles(medicoId, fecha) {
      const date = new Date(fecha + 'T00:00:00');
      const diaSemana = date.getDay();
      const doc = await db.collection('Horarios').doc(`${medicoId}_${diaSemana}`).get();
      if (!doc.exists) return [];
      const slots = doc.data().slots || [];
      return slots.map(slot => ({ id: `${doc.id}_${slot}`, hora: slot }));
    },

    async createHorario(data) {
      const ref = await db.collection('Horarios').add({
        MedicoID: data.medicoId,
        fecha: data.fecha,
        hora: data.hora,
        disponibilidad: true
      });
      return { id: ref.id, ...data, disponibilidad: true };
    },

    async deleteHorario(id) { await db.collection('Horarios').doc(id).delete(); return true; },
    async upsertHorario(data) {
      const { medicoId, diaSemana, slots } = data;
      const id = `${medicoId}_${diaSemana}`;
      await db.collection('Horarios').doc(id).set({
        MedicoID: medicoId,
        diaSemana,
        slots,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { id, ...data };
    },

    async listTurnos(filtros = {}) {
      try {
        let query = db.collection('turnos');

        // --- OPTIMIZACIÓN DE PERMISOS ---
        // Obtenemos la sesión actual para saber el rol y el ID del paciente
        const session = window.FC_SESSION;
        const user = firebase.auth().currentUser;

        if (filtros.pacienteId) {
          // Si se pide un paciente específico, filtramos por él
          query = query.where('pacienteID', '==', filtros.pacienteId);
        } else if (session && session.rol !== 'admin') {
          // Si NO es admin y no hay filtro, FORZAMOS el filtro por su propio ID.
          // Esto evita el error "Missing or insufficient permissions" ya que
          // Firebase no permite pedir la lista completa si no eres admin.
          const pid = session.pacienteId || (user ? user.uid : null);
          if (pid) {
            query = query.where('pacienteID', '==', pid);
          }
        }
        // Si es admin y no hay filtro, query se queda como db.collection('turnos'),
        // lo cual está permitido por las reglas para admins.
        // -------------------------------

        const [turnosSnap, docs, pacs] = await Promise.all([
          query.get(), medicos(), pacientes()
        ]);

        let list = turnosSnap.docs.map(doc => {
          const t = doc.data();
          const medicoId = t.medicoID || t.medicoId || '';
          const pacienteId = t.pacienteID || t.pacienteId || '';
          const m = docs.find(x => x.id === medicoId);
          const p = pacs.find(x => x.id === pacienteId);
          return {
            id: doc.id,
            ...t,
            medicoId,
            pacienteId,
            especialidadId: t.especialidadID || t.especialidadId || (m && m.especialidadId) || '',
            medico: m ? `${m.nombre} ${m.apellido}`.trim() : '—',
            especialidad: m ? m.especialidad : (t.especialidadID || '—'),
            especialidadColor: m ? m.especialidadColor : 'blue',
            iniciales: m ? m.iniciales : 'P',
            paciente: p ? `${p.nombre} ${p.apellido}`.trim() || p.email : '—',
            pacienteDni: p ? p.dni : ''
          };
        });

        if (filtros.medicoId) list = list.filter(t => t.medicoId === filtros.medicoId);
        if (filtros.estado) list = list.filter(t => t.estado === filtros.estado);
        if (filtros.desde) list = list.filter(t => t.fecha >= filtros.desde);
        if (filtros.hasta) list = list.filter(t => t.fecha <= filtros.hasta);
        if (filtros.especialidadId) list = list.filter(t => t.especialidadId === filtros.especialidadId);

        return list.sort((a, b) => `${b.fecha || ''}${b.hora || ''}`.localeCompare(`${a.fecha || ''}${a.hora || ''}`));
      } catch (e) {
        console.error('❌ Error en listTurnos:', e);
        throw e;
      }
    },

    async createTurno(data) {
      const medico = await this.getMedico(data.medicoId);
      const ref = await db.collection('turnos').add({
        pacienteID: data.pacienteId,
        medicoID: data.medicoId,
        especialidadID: medico ? medico.especialidadId : '',
        fecha: data.fecha,
        hora: data.hora,
        estado: data.estado || 'confirmado',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { id: ref.id, ...data };
    },

    async updateTurno(id, patch) { await db.collection('turnos').doc(id).update(patch); return { id, ...patch }; },
    async deleteTurno(id) { await db.collection('turnos').doc(id).delete(); return true; },

    async listPacientes() { return pacientes(); },
    async updatePaciente(id, patch) { await db.collection('usuarios').doc(id).set(patch, { merge: true }); return { id, ...patch }; },
    async updatePatientDetails(id, patch) { await db.collection('pacientes').doc(id).set(patch, { merge: true }); return { id, ...patch }; },
    async createPaciente(data) {
      const uid = `pac-${Date.now()}`;
      await db.collection('usuarios').doc(uid).set({
        email: data.email.toLowerCase(),
        rol: data.rol || 'paciente',
        pacienteID: uid,
        createdAt: Date.now()
      });
      await db.collection('pacientes').doc(uid).set({
        id: uid,
        usuarioId: uid,
        nombre: data.nombre,
        apellido: data.apellido,
        dni: data.dni,
        fechaNacimiento: data.fechaNacimiento,
        telefono: data.telefono,
        obraSocial: data.obraSocial,
        activo: true
      });
      return {
        paciente: { id: uid, nombre: data.nombre, apellido: data.apellido },
        tempPassword: 'Temp' + Math.random().toString(36).slice(-6).toUpperCase()
      };
    },
    async deletePaciente(id) {
      await db.collection('usuarios').doc(id).delete();
      await db.collection('pacientes').doc(id).delete();
      return true;
    },

    async findPacienteByUsuario(userId) {
      const snap = await db.collection('pacientes').where('usuarioId', '==', userId).get();
      if (snap.empty) return null;
      return snap.docs[0].data();
    },

    async listNotificaciones(userId) {
      const snap = await db.collection('notificaciones').where('usuarioId', '==', userId).orderBy('fecha', 'desc').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async createNotificacion(data) {
      const ref = await db.collection('notificaciones').add({
        ...data,
        fecha: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { id: ref.id, ...data };
    },

    async getCentro() {
      const doc = await db.collection('centro').doc('principal').get();
      return doc.exists ? doc.data() : (window.FC_CONFIG.centroDefault || {});
    },
    async updateCentro(data) { await db.collection('centro').doc('principal').set(data, { merge: true }); return data; },

    async getMetricas() {
      const [turnos, docs, esp] = await Promise.all([this.listTurnos(), medicos(), especialidades()]);
      const hoy = new Date().toISOString().slice(0, 10);
      const estados = ['pendiente', 'confirmado', 'proximo', 'asistido', 'cancelado'].reduce((o, k) => ({ ...o, [k]: turnos.filter(t => t.estado === k).length }), {});
      const cancelados = estados.cancelado || 0;
      return {
        turnosHoy: turnos.filter(t => t.fecha === hoy).length,
        turnosFuturos: turnos.filter(t => t.fecha > hoy).length,
        turnosPasados: turnos.filter(t => t.fecha < hoy).length,
        totalTurnos: turnos.length,
        medicosActivos: docs.filter(m => m.activo).length,
        medicosTotal: docs.length,
        tasaCancelacion: turnos.length ? Math.round(cancelados * 100 / turnos.length) : 0,
        porEspecialidad: esp.map(e => ({ ...e, total: turnos.filter(t => t.especialidadId === e.id).length })),
        estados
      };
    }
  };

  window.FC_REPO = Repo;
})();