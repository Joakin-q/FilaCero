# FilaCero — Versión visual + sidebar + login

Proyecto visual de FilaCero en modo demo.
**Únicas cosas funcionales:**

1. **Login** (acepta 2 cuentas demo).
2. **Menú lateral izquierdo** (sidebar desktop + bottom nav visual) — todos los links navegan.
3. **Toggle de colapsar** el sidebar.

**Todo lo demás está bloqueado.** Cualquier botón fuera del sidebar o de los formularios de auth muestra un toast "Acción deshabilitada".

## 🚀 Cómo abrirlo

Doble click en `index.html`.

## 🔐 Login funcional

| Rol | Email | Contraseña |
|---|---|---|
| Paciente | `juan@demo.com` | `demo1234` |
| Admin | `admin@filacero.app` | `admin123` |

Los formularios de Registro y Recuperar contraseña NO funcionan: al enviar, muestran "deshabilitado".

## 🧭 Navegación

| Punto de navegación | Estado |
|---|---|
| Sidebar desktop (Inicio / Pedir turno / Mis turnos / Historial / Notificaciones / Perfil / Configuración) | ✅ Navega |
| Toggle colapsar sidebar | ✅ Funciona |
| Botón "Cerrar sesión" del sidebar | ✅ Funciona |
| Bottom nav móvil | ⚠️ Visible pero no navega (toast al click) |
| Topbar desktop | ✅ Muestra el título de la página y email del usuario (sin navegación) |
| Cualquier otro botón/link de las páginas | 🔒 Bloqueado con toast |

## 🔒 Qué pasa cuando hacés click en un botón bloqueado

- En **mobile** (fuera del sidebar): toast negro "Acción deshabilitada en esta versión" + animation de shake en la bottom nav.
- En **desktop**: idem.
- En **login/registro/recuperar**: el envío del form bloqueado abre un modal con el motivo.

## 🗂️ Estructura

```
.
├── index.html                  # Landing (botones → login/registro)
├── manifest.json
├── service-worker.js
├── README.md
├── css/
│   ├── variables.css
│   ├── main.css                # + estilos de bloqueo animado
│   ├── auth.css
│   └── paciente.css
├── js/
│   ├── config.js               # (no usado, placeholder)
│   ├── data/db.js              # Devuelve datos estáticos
│   ├── auth/auth.js            # Solo valida 2 cuentas demo
│   ├── utils/
│   │   ├── utils.js            # Modales, fechas, sidebar, bottom nav
│   │   └── lock-ui.js          # Bloqueador universal de botones
│   └── paciente/
│       ├── solicitar.js        # Wizard visual, confirmar bloqueado
│       └── mis-turnos.js       # Lista mock, cancelar bloqueado
└── pages/
    ├── auth/
    │   ├── login.html          # ✅ funcional
    │   ├── registro.html       # 🔒 bloqueado
    │   └── recuperar.html      # 🔒 bloqueado
    └── paciente/
        ├── inicio.html         # 🔒 botones inertes
        ├── solicitar.html      # 🔒 confirm bloqueado
        ├── mis-turnos.html     # 🔒 cancelar bloqueado
        ├── perfil.html         # 🔒 editar y logout inertes
        └── avisos.html         # solo lectura
```

## 🆕 Cómo se logra el bloqueo

Cada página del paciente y de auth (excepto `login.html`) carga `js/utils/lock-ui.js`. Este script:

1. En `DOMContentLoaded` busca todos los `<button>` que NO estén dentro de `#fc-sidebar` ni en los `<form id="loginForm|registerForm|recoverForm">`.
2. Les añade un listener `click` con `capture: true` que hace `preventDefault + stopImmediatePropagation` y muestra un toast.
3. Bloquea también los submits de formularios que no sean los de auth.

El login sigue funcionando porque NO carga `lock-ui.js` y porque `lock-ui.js` excluye específicamente los formularios `#loginForm, #registerForm, #recoverForm`.

## ✅ Pantallas listas (visualmente)

- [x] Landing con CTAs (los CTAs navegan porque son flujo de auth)
- [x] Login (única pantalla 100% funcional de paciente)
- [x] Registro (UI lista, envío bloqueado)
- [x] Recuperar (UI lista, envío bloqueado)
- [x] Inicio del paciente (stats + 3 próximos)
- [x] Solicitar turno — wizard 5 pasos (visual)
- [x] Mis turnos (lista + filtros + buscar)
- [x] Perfil (datos demo)
- [x] Notificaciones (3 mensajes demo)
- [x] Sidebar colapsable (única navegación activa del paciente)
- [x] Bottom nav móvil (visible, no navega)

## ⏭️ Lo que sigue

- Reemplazar `lock-ui.js` cuando se reactive la lógica real.
- Panel admin (Dashboard, CRUD médicos, CRUD horarios, reportes).
- Conectar a Firebase real.
