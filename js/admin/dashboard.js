/**
 * dashboard.js — Pantalla principal del panel admin
 *
 * Carga métricas desde FC_REPO.getMetricas() y renderiza:
 *   - 4 tarjetas de métricas
 *   - Lista de próximos turnos
 *   - Gráfico de barras: turnos por especialidad
 *   - Gráfico de barras: turnos por estado
 */

(async () => {
  const session = window.FC_AUTH.requireAuth(['admin']);
  if (!session) return;

  window.FC_UTIL.mountSidebar({ active: 'dashboard', user: session, rol: 'admin' });
  window.FC_UTIL.mountTopbar({ title: 'Dashboard', user: session });

  const metrics = await window.FC_REPO.getMetricas();

  // ===== Métricas =====
  document.getElementById('mHoy').textContent = metrics.turnosHoy;
  document.getElementById('mHoyFoot').textContent =
    `${metrics.turnosHoy === 1 ? 'turno programado' : 'turnos programados'} para hoy`;

  document.getElementById('mMedicos').textContent = metrics.medicosActivos;
  document.getElementById('mMedicosFoot').textContent =
    `de ${metrics.medicosTotal} en el centro`;

  document.getElementById('mTotal').textContent = metrics.totalTurnos;
  document.getElementById('mTotalFoot').textContent =
    `${metrics.turnosFuturos} próximos · ${metrics.turnosPasados} pasados`;

  document.getElementById('mCancel').textContent = `${metrics.tasaCancelacion}%`;
  document.getElementById('mCancelFoot').textContent =
    `${metrics.estados.cancelado} turnos cancelados`;

  // ===== Gráfico por especialidad =====
  const espChart = document.getElementById('espChart');
  const espData = metrics.porEspecialidad;
  if (espData.every(e => e.total === 0)) {
    espChart.innerHTML = `<div class="admin-empty"><h3>Sin datos</h3><p>Aún no hay turnos para mostrar.</p></div>`;
  } else {
    const max = Math.max(...espData.map(e => e.total), 1);
    espChart.innerHTML = espData.map(e => `
      <div class="bar-row">
        <div class="bar-label">${e.nombre}</div>
        <div class="bar-track">
          <div class="bar-fill bar-fill--${e.color}" style="width: ${(e.total / max) * 100}%"></div>
        </div>
        <div class="bar-value">${e.total}</div>
      </div>
    `).join('');
  }

  // ===== Gráfico por estado =====
  const estadosChart = document.getElementById('estadosChart');
  const estados = [
    { key: 'confirmado', label: 'Confirmados', color: 'green'  },
    { key: 'proximo',    label: 'Próximos',    color: 'blue'   },
    { key: 'asistido',   label: 'Asistidos',   color: 'green'  },
    { key: 'cancelado',  label: 'Cancelados',  color: 'pink'   },
    { key: 'pendiente',  label: 'Pendientes',  color: 'cream'  }
  ];
  const estadosData = estados.map(s => ({ ...s, total: metrics.estados[s.key] || 0 }));
  const maxEstado = Math.max(...estadosData.map(s => s.total), 1);
  estadosChart.innerHTML = estadosData.map(s => `
    <div class="bar-row">
      <div class="bar-label">${s.label}</div>
      <div class="bar-track">
        <div class="bar-fill bar-fill--${s.color}" style="width: ${(s.total / maxEstado) * 100}%"></div>
      </div>
      <div class="bar-value">${s.total}</div>
    </div>
  `).join('');

  // ===== Lista de próximos turnos =====
  const turnosFuturos = await window.FC_REPO.listTurnos({
    desde: new Date().toISOString().slice(0, 10),
    estado: undefined
  });
  const proximos = turnosFuturos
    .filter(t => t.estado !== 'cancelado')
    .slice(0, 5);

  const proximosList = document.getElementById('proximosList');
  if (proximos.length === 0) {
    proximosList.innerHTML = `
      <div class="admin-empty">
        <h3>No hay turnos próximos</h3>
        <p>Cuando se agenden turnos van a aparecer acá.</p>
      </div>
    `;
  } else {
    proximosList.innerHTML = proximos.map(t => `
      <div class="mini-list-item">
        <div class="avatar avatar--${t.especialidadColor || 'blue'}">${(t.medico || '?').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()}</div>
        <div class="info">
          <div class="title">Dr. ${t.medico}</div>
          <div class="sub">${t.especialidad} · ${t.paciente}</div>
        </div>
        <div class="when">
          <strong>${window.FC_UTIL.formatFechaCorta(t.fecha)}</strong>
          ${t.hora}
        </div>
      </div>
    `).join('');
  }
})();
