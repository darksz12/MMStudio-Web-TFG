;(function () {
  'use strict'

  // ---- Datos (localStorage + API) ----
  var SESSION_KEY = 'mm_session'
  var TOKEN_KEY   = 'mm_token'

  function getSession() { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') }
  function setSession(u) { localStorage.setItem(SESSION_KEY, JSON.stringify(u)) }
  function clearSession() { localStorage.removeItem(SESSION_KEY); localStorage.removeItem(TOKEN_KEY) }
  function getToken() { return localStorage.getItem(TOKEN_KEY) }
  function setToken(t) { localStorage.setItem(TOKEN_KEY, t) }

  function getInitials(name) {
    return name.trim().split(/\s+/).map(function (w) { return w[0] }).slice(0, 2).join('').toUpperCase()
  }

  // ---- Estilos ----
  var style = document.createElement('style')
  style.textContent = `
    /* Botón flotante */
    #auth-fab {
      position: fixed;
      bottom: 135px;
      right: 20px;
      z-index: 9996;
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: linear-gradient(135deg, #111111, #6b5438);
      border: 2px solid #b99a5b;
      cursor: pointer;
      box-shadow: 0 4px 18px rgba(0,0,0,.4);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform .2s, box-shadow .2s;
      padding: 0 !important;
      margin: 0 !important;
      width: 54px !important;
      margin-top: 0 !important;
    }
    #auth-fab:hover { transform: scale(1.1); box-shadow: 0 6px 24px rgba(0,0,0,.5); }
    #auth-fab-icon {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,.15);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; color: white; font-weight: bold;
      pointer-events: none; letter-spacing: 0;
    }

    /* Overlay */
    #auth-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,.7);
      backdrop-filter: blur(6px);
      display: none; align-items: center; justify-content: center;
    }
    #auth-overlay.open { display: flex; }

    /* Modal */
    #auth-modal {
      background: #ffffff;
      border-radius: 24px;
      width: 400px;
      max-width: 96vw;
      box-shadow: 0 30px 80px rgba(0,0,0,.5);
      overflow: hidden;
      animation: authPop .28s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes authPop {
      from { opacity: 0; transform: scale(.88) translateY(20px); }
      to   { opacity: 1; transform: none; }
    }

    /* Cabecera del modal */
    #auth-modal-head {
      background: linear-gradient(135deg, #0d0d0d 0%, #6b5438 55%, #b99a5b 100%);
      padding: 24px 24px 0;
      position: relative;
    }
    #auth-modal-brand {
      display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
    }
    #auth-modal-brand-logo {
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; color: white; font-weight: bold;
    }
    #auth-modal-brand-text { color: white; font-size: 18px; font-weight: bold; letter-spacing: 1px; }
    #auth-modal-brand-sub { color: rgba(255,255,255,.65); font-size: 12px; }
    #auth-close-btn {
      position: absolute; top: 16px; right: 16px;
      background: rgba(255,255,255,.15) !important;
      border: none !important; color: white !important;
      width: 32px !important; height: 32px !important;
      border-radius: 50% !important; cursor: pointer !important;
      font-size: 14px !important; display: flex; align-items: center; justify-content: center;
      padding: 0 !important; margin: 0 !important; margin-top: 0 !important;
      line-height: 1; transition: background .2s !important;
    }
    #auth-close-btn:hover { background: rgba(255,255,255,.3) !important; }

    /* Tabs */
    #auth-tabs {
      display: flex; border-bottom: none; gap: 4px;
    }
    .a-tab {
      flex: 1; padding: 10px 16px !important;
      background: rgba(255,255,255,.12) !important;
      border: none !important; border-radius: 10px 10px 0 0 !important;
      color: rgba(255,255,255,.7) !important;
      font-size: 14px !important; font-weight: bold !important;
      cursor: pointer !important; transition: all .2s !important;
      margin: 0 !important; margin-top: 0 !important; width: auto !important;
    }
    .a-tab.active {
      background: #ffffff !important;
      color: #3a2b16 !important;
    }
    .a-tab:not(.active):hover { background: rgba(255,255,255,.22) !important; color: white !important; }

    /* Cuerpo */
    #auth-modal-body { padding: 28px 28px 24px; background: white; }
    .a-form { display: none; flex-direction: column; gap: 14px; }
    .a-form.active { display: flex; }

    .a-field { display: flex; flex-direction: column; gap: 5px; }
    .a-field label { font-size: 12px; font-weight: 700; color: #6b5438; text-transform: uppercase; letter-spacing: .5px; }
    .a-field input {
      width: 100% !important; padding: 12px 14px !important;
      border: 1.5px solid #e8e0d5 !important; border-radius: 10px !important;
      font-size: 14px !important; color: #2b2b2b !important;
      background: #faf7f2 !important; transition: border-color .2s, box-shadow .2s !important;
      margin-top: 0 !important; outline: none;
    }
    .a-field input:focus { border-color: #b99a5b !important; box-shadow: 0 0 0 3px rgba(185,154,91,.15) !important; background: white !important; }
    .a-err { font-size: 13px; color: #c0392b; font-weight: 600; min-height: 16px; }
    .a-ok  { font-size: 13px; color: #27ae60; font-weight: 600; min-height: 16px; }
    .a-submit {
      width: 100% !important; padding: 13px !important;
      background: linear-gradient(135deg, #6b5438, #b99a5b) !important;
      color: white !important; border: none !important; border-radius: 12px !important;
      font-size: 15px !important; font-weight: bold !important;
      cursor: pointer !important; margin-top: 4px !important;
      transition: opacity .2s, transform .15s !important;
      box-shadow: 0 4px 14px rgba(107,84,56,.35) !important;
    }
    .a-submit:hover { opacity: .9 !important; transform: translateY(-1px) !important; }
    .a-switch { text-align: center; font-size: 13px; color: #aaa; margin: 0; }
    .a-switch a { color: #8c6a32; text-decoration: none; font-weight: bold; }
    .a-switch a:hover { text-decoration: underline; }

    /* Perfil */
    #a-profile-av {
      width: 72px; height: 72px; border-radius: 50%;
      background: linear-gradient(135deg, #6b5438, #b99a5b);
      color: white; font-size: 26px; font-weight: bold;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px;
    }
    .a-profile-name { text-align: center; font-size: 20px; font-weight: bold; color: #2b2b2b; }
    .a-profile-email { text-align: center; color: #aaa; font-size: 13px; margin-bottom: 16px; }
    .a-info-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 11px 0; border-bottom: 1px solid #f0ebe2; font-size: 14px;
    }
    .a-info-row:last-of-type { border-bottom: none; }
    .a-info-row span:first-child { color: #aaa; }
    .a-info-row span:last-child { font-weight: 700; color: #6b5438; }
    .a-logout {
      width: 100% !important; padding: 12px !important;
      background: #f0ebe2 !important; color: #6b5438 !important;
      border: none !important; border-radius: 12px !important;
      font-size: 14px !important; font-weight: bold !important;
      cursor: pointer !important; margin-top: 16px !important;
      transition: background .2s !important;
    }
    .a-logout:hover { background: #e0d9cc !important; }
    .a-edit-btn {
      width: 100% !important; padding: 11px !important;
      background: transparent !important; color: #6b5438 !important;
      border: 1.5px solid #e0d5c5 !important; border-radius: 12px !important;
      font-size: 14px !important; font-weight: bold !important;
      cursor: pointer !important; margin-top: 12px !important;
      transition: background .2s, border-color .2s !important;
    }
    .a-edit-btn:hover { background: #f5f0e8 !important; border-color: #b99a5b !important; }

    /* Banner de contraseña temporal */
    #mm-pwd-banner {
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      background: linear-gradient(90deg, #5a3e0a, #8c6a32);
      color: white; padding: 10px 20px; font-size: 13px;
      display: none; align-items: center; justify-content: center; gap: 14px;
      box-shadow: 0 2px 12px rgba(0,0,0,.4);
    }
    #mm-pwd-banner.visible { display: flex; }
    #mm-pwd-banner-btn {
      background: rgba(255,255,255,.2) !important; border: 1px solid rgba(255,255,255,.4) !important;
      color: white !important; padding: 5px 14px !important; border-radius: 6px !important;
      cursor: pointer !important; font-size: 12px !important; font-weight: bold !important;
      white-space: nowrap; margin: 0 !important; margin-top: 0 !important; width: auto !important;
    }
    #mm-pwd-banner-btn:hover { background: rgba(255,255,255,.35) !important; }

    /* Dark mode */
    body.dark-mode #auth-modal { background: #1e1c18; }
    body.dark-mode #auth-modal-body { background: #1e1c18; }
    body.dark-mode #a-form-changepwd div[style*="color:#3a2b16"] { color: #d4a96a !important; }
    body.dark-mode .a-field label { color: #d4a96a; }
    body.dark-mode .a-field input { background: #141210 !important; color: #e0d5c5 !important; border-color: #3a2f20 !important; }
    body.dark-mode .a-field input:focus { background: #1e1c18 !important; border-color: #b99a5b !important; }
    body.dark-mode .a-profile-name { color: #e0d5c5; }
    body.dark-mode .a-info-row { border-color: #2d2318; }
    body.dark-mode .a-info-row span:last-child { color: #d4a96a; }
    body.dark-mode .a-logout { background: #2d2318 !important; color: #d4a96a !important; }
    body.dark-mode .a-logout:hover { background: #3a2b16 !important; }
    body.dark-mode .a-switch { color: #6b5438; }
    body.dark-mode .a-tab.active { background: #1e1c18 !important; color: #d4a96a !important; }
  `
  document.head.appendChild(style)

  // ---- HTML ----
  // Botón flotante
  var fab = document.createElement('button')
  fab.id = 'auth-fab'
  fab.title = 'Mi cuenta'
  fab.innerHTML = '<div id="auth-fab-icon">👤</div>'

  // Modal
  var overlay = document.createElement('div')
  overlay.id = 'auth-overlay'
  overlay.innerHTML = `
    <div id="auth-modal">
      <div id="auth-modal-head">
        <button id="auth-close-btn" title="Cerrar">✕</button>
        <div id="auth-modal-brand">
          <div id="auth-modal-brand-logo">M</div>
          <div>
            <div id="auth-modal-brand-text">M&M Studio</div>
            <div id="auth-modal-brand-sub">Asesoría de imagen digital</div>
          </div>
        </div>
        <div id="auth-tabs">
          <button class="a-tab active" data-tab="login">Iniciar sesión</button>
          <button class="a-tab" data-tab="register">Registrarse</button>
        </div>
      </div>

      <div id="auth-modal-body">

        <form id="a-form-login" class="a-form active" onsubmit="return false">
          <div class="a-field"><label>Email</label><input id="l-email" type="email" placeholder="tu@email.com" autocomplete="email"></div>
          <div class="a-field"><label>Contraseña</label><input id="l-pwd" type="password" placeholder="••••••••" autocomplete="current-password"></div>
          <div class="a-err" id="l-err"></div>
          <button class="a-submit" id="l-btn">Entrar →</button>
          <p class="a-switch">¿Sin cuenta? <a href="#" id="go-reg">Regístrate gratis</a></p>
        </form>

        <form id="a-form-register" class="a-form" onsubmit="return false">
          <div class="a-field"><label>Nombre</label><input id="r-name" type="text" placeholder="Tu nombre" autocomplete="given-name"></div>
          <div class="a-field"><label>Apellidos <span style="font-weight:normal;color:#aaa">(opcional)</span></label><input id="r-apellidos" type="text" placeholder="Tus apellidos" autocomplete="family-name"></div>
          <div class="a-field"><label>Email</label><input id="r-email" type="email" placeholder="tu@email.com" autocomplete="email"></div>
          <div class="a-field"><label>Contraseña</label><input id="r-pwd" type="password" placeholder="Mínimo 6 caracteres" autocomplete="new-password"></div>
          <div class="a-err" id="r-err"></div>
          <div class="a-ok"  id="r-ok"></div>
          <button class="a-submit" id="r-btn">Crear cuenta →</button>
          <p class="a-switch">¿Ya tienes cuenta? <a href="#" id="go-login">Inicia sesión</a></p>
        </form>

        <div id="a-form-profile" class="a-form">
          <div id="a-profile-av"></div>
          <div class="a-profile-name" id="a-p-name"></div>
          <div class="a-profile-email" id="a-p-email"></div>
          <div class="a-info-row"><span>Apellidos</span><span id="a-p-apellidos" style="color:#aaa;font-style:italic">—</span></div>
          <div class="a-info-row"><span>Teléfono</span><span id="a-p-telefono" style="color:#aaa;font-style:italic">—</span></div>
          <div class="a-info-row"><span>Plan activo</span><span id="a-p-plan"></span></div>
          <div class="a-info-row"><span>Miembro desde</span><span id="a-p-joined"></span></div>
          <button class="a-edit-btn" id="a-edit-btn">✏️ Editar perfil</button>
          <button class="a-logout" id="a-logout">Cerrar sesión</button>
        </div>

        <div id="a-form-editprofile" class="a-form">
          <div style="text-align:center;margin-bottom:16px;">
            <div style="font-size:28px;margin-bottom:6px;">✏️</div>
            <div style="font-weight:bold;color:#3a2b16;font-size:16px;">Editar perfil</div>
          </div>
          <div class="a-field"><label>Nombre</label><input id="ep-name" type="text" placeholder="Tu nombre" autocomplete="given-name"></div>
          <div class="a-field"><label>Apellidos</label><input id="ep-apellidos" type="text" placeholder="Tus apellidos" autocomplete="family-name"></div>
          <div class="a-field"><label>Teléfono</label><input id="ep-telefono" type="tel" placeholder="612 345 678" autocomplete="tel"></div>
          <div class="a-err" id="ep-err"></div>
          <div class="a-ok"  id="ep-ok"></div>
          <button class="a-submit" id="ep-save-btn">Guardar cambios →</button>
          <button class="a-logout" id="ep-cancel-btn">← Volver al perfil</button>
        </div>

        <div id="a-form-changepwd" class="a-form">
          <div style="text-align:center;margin-bottom:16px;">
            <div style="font-size:32px;margin-bottom:8px;">🔑</div>
            <div style="font-weight:bold;color:#3a2b16;font-size:16px;">Cambia tu contraseña</div>
            <div style="font-size:13px;color:#aaa;margin-top:4px;">El administrador requiere que establezcas una nueva contraseña.</div>
          </div>
          <div class="a-field"><label>Contraseña actual</label><input id="cp-old" type="password" placeholder="La contraseña temporal" autocomplete="current-password"></div>
          <div class="a-field"><label>Nueva contraseña</label><input id="cp-pwd" type="password" placeholder="Mínimo 6 caracteres" autocomplete="new-password"></div>
          <div class="a-field"><label>Confirmar contraseña</label><input id="cp-pwd2" type="password" placeholder="Repite la nueva contraseña" autocomplete="new-password"></div>
          <div class="a-err" id="cp-err"></div>
          <button class="a-submit" id="cp-btn">Establecer contraseña →</button>
        </div>

      </div>
    </div>
  `

  // Banner contraseña temporal
  var pwdBanner = document.createElement('div')
  pwdBanner.id = 'mm-pwd-banner'
  pwdBanner.innerHTML = '⚠️ Tu administrador ha establecido una contraseña temporal. Cámbiala antes de cerrar sesión.' +
    '<button id="mm-pwd-banner-btn">Cambiar ahora →</button>'
  document.body.appendChild(pwdBanner)

  document.body.appendChild(overlay)
  document.body.appendChild(fab)

  // ---- Helpers UI ----
  function updateFab(session) {
    var icon = document.getElementById('auth-fab-icon')
    if (!icon) return
    if (session) {
      icon.textContent = getInitials(session.name)
      icon.style.background = 'rgba(255,255,255,.25)'
      icon.style.fontSize = '16px'
    } else {
      icon.textContent = '👤'
      icon.style.background = 'rgba(255,255,255,.15)'
      icon.style.fontSize = '18px'
    }
  }

  function openModal(tab) {
    overlay.classList.add('open')
    switchTab(tab || 'login')
    document.getElementById('l-err').textContent = ''
    document.getElementById('r-err').textContent = ''
    document.getElementById('r-ok').textContent = ''
  }

  function closeModal() { overlay.classList.remove('open') }

  function switchTab(tab) {
    overlay.querySelectorAll('.a-form').forEach(function (f) { f.classList.remove('active') })
    overlay.querySelectorAll('.a-tab').forEach(function (t) { t.classList.remove('active') })
    var form = document.getElementById('a-form-' + tab)
    if (form) form.classList.add('active')
    var tabBtn = overlay.querySelector('.a-tab[data-tab="' + tab + '"]')
    if (tabBtn) tabBtn.classList.add('active')
    var tabsRow = document.getElementById('auth-tabs')
    if (tabsRow) tabsRow.style.display = (tab === 'profile' || tab === 'changepwd' || tab === 'editprofile') ? 'none' : 'flex'
  }

  function fillProfile(s) {
    document.getElementById('a-profile-av').textContent = getInitials(s.name)
    document.getElementById('a-p-name').textContent = s.name
    document.getElementById('a-p-email').textContent = s.email
    var apEl = document.getElementById('a-p-apellidos')
    if (apEl) { apEl.textContent = s.apellidos || '—'; apEl.style.fontStyle = s.apellidos ? 'normal' : 'italic'; apEl.style.color = s.apellidos ? '#6b5438' : '#aaa' }
    var tfEl = document.getElementById('a-p-telefono')
    if (tfEl) { tfEl.textContent = s.telefono || '—'; tfEl.style.fontStyle = s.telefono ? 'normal' : 'italic'; tfEl.style.color = s.telefono ? '#6b5438' : '#aaa' }
    document.getElementById('a-p-plan').textContent = s.plan
    document.getElementById('a-p-joined').textContent = s.joined
  }

  function updateBanner(session) {
    var banner = document.getElementById('mm-pwd-banner')
    if (!banner) return
    if (session && session.forcePwdChange) banner.classList.add('visible')
    else banner.classList.remove('visible')
  }

  // ---- Eventos ----
  document.addEventListener('DOMContentLoaded', function () {
    var session = getSession()
    var token   = getToken()
    updateFab(session)
    if (session) { fillProfile(session); updateBanner(session) }

    // Validar token con la API en segundo plano
    if (token) {
      fetch('/api/me', { headers: { 'Authorization': 'Bearer ' + token } })
        .then(function (r) { return r.json() })
        .then(function (user) {
          if (user.error) { clearSession(); updateFab(null); updateBanner(null); return }
          setSession(user); updateFab(user); fillProfile(user); updateBanner(user)
        })
        .catch(function () {})
    }

    // Banner → abrir modal cambio de contraseña
    var bannerBtn = document.getElementById('mm-pwd-banner-btn')
    if (bannerBtn) {
      bannerBtn.addEventListener('click', function () {
        document.getElementById('cp-old').value = ''
        document.getElementById('cp-pwd').value = ''
        document.getElementById('cp-pwd2').value = ''
        document.getElementById('cp-err').textContent = ''
        openModal('changepwd')
      })
    }

    fab.addEventListener('click', function () {
      openModal(getSession() ? 'profile' : 'login')
    })

    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal() })
    document.getElementById('auth-close-btn').addEventListener('click', closeModal)

    overlay.querySelectorAll('.a-tab').forEach(function (t) {
      t.addEventListener('click', function () { switchTab(t.dataset.tab) })
    })
    document.getElementById('go-reg').addEventListener('click', function (e) { e.preventDefault(); switchTab('register') })
    document.getElementById('go-login').addEventListener('click', function (e) { e.preventDefault(); switchTab('login') })

    // Login
    document.getElementById('l-btn').addEventListener('click', function () {
      var email = document.getElementById('l-email').value.trim()
      var pwd   = document.getElementById('l-pwd').value
      var err   = document.getElementById('l-err')
      var btn   = document.getElementById('l-btn')
      if (!email || !pwd) { err.textContent = 'Completa todos los campos.'; return }
      err.textContent = ''; btn.disabled = true; btn.textContent = 'Entrando…'
      fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: pwd })
      })
      .then(function (r) { return r.json() })
      .then(function (res) {
        if (res.error) { err.textContent = res.error; return }
        setToken(res.token); setSession(res.user); updateFab(res.user); updateBanner(res.user)
        if (res.user.forcePwdChange) {
          document.getElementById('cp-old').value  = ''
          document.getElementById('cp-pwd').value  = ''
          document.getElementById('cp-pwd2').value = ''
          document.getElementById('cp-err').textContent = ''
          switchTab('changepwd')
        } else {
          fillProfile(res.user); closeModal()
        }
      })
      .catch(function () { err.textContent = 'Error de conexión. Inténtalo de nuevo.' })
      .finally(function () { btn.disabled = false; btn.textContent = 'Entrar →' })
    })

    // Register
    document.getElementById('r-btn').addEventListener('click', function () {
      var name      = document.getElementById('r-name').value.trim()
      var apellidos = document.getElementById('r-apellidos').value.trim()
      var email     = document.getElementById('r-email').value.trim()
      var pwd       = document.getElementById('r-pwd').value
      var err       = document.getElementById('r-err')
      var ok        = document.getElementById('r-ok')
      var btn       = document.getElementById('r-btn')
      err.textContent = ''; ok.textContent = ''
      if (!name || !email || !pwd) { err.textContent = 'Completa todos los campos.'; return }
      if (pwd.length < 6) { err.textContent = 'La contraseña debe tener al menos 6 caracteres.'; return }
      btn.disabled = true; btn.textContent = 'Creando cuenta…'
      fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, apellidos: apellidos, email: email, password: pwd })
      })
      .then(function (r) { return r.json() })
      .then(function (res) {
        if (res.error) { err.textContent = res.error; return }
        ok.textContent = '¡Cuenta creada correctamente!'
        setTimeout(function () {
          setToken(res.token); setSession(res.user); fillProfile(res.user); updateFab(res.user); updateBanner(res.user); closeModal()
        }, 900)
      })
      .catch(function () { err.textContent = 'Error de conexión. Inténtalo de nuevo.' })
      .finally(function () { btn.disabled = false; btn.textContent = 'Crear cuenta →' })
    })

    // Cambio de contraseña forzado
    document.getElementById('cp-btn').addEventListener('click', function () {
      var oldPwd = document.getElementById('cp-old').value
      var pwd    = document.getElementById('cp-pwd').value
      var pwd2   = document.getElementById('cp-pwd2').value
      var err    = document.getElementById('cp-err')
      var btn    = document.getElementById('cp-btn')
      err.textContent = ''
      if (!oldPwd) { err.textContent = 'Introduce la contraseña actual (temporal).'; return }
      if (!pwd || pwd.length < 6) { err.textContent = 'La nueva contraseña debe tener al menos 6 caracteres.'; return }
      if (pwd !== pwd2) { err.textContent = 'Las contraseñas no coinciden.'; return }
      btn.disabled = true; btn.textContent = 'Guardando…'
      fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
        body: JSON.stringify({ oldPassword: oldPwd, password: pwd })
      })
      .then(function (r) { return r.json() })
      .then(function (res) {
        if (res.error) { err.textContent = res.error; return }
        var session = getSession()
        if (session) { session.forcePwdChange = false; setSession(session) }
        updateBanner(session); fillProfile(session); switchTab('profile')
      })
      .catch(function () { err.textContent = 'Error de conexión.' })
      .finally(function () { btn.disabled = false; btn.textContent = 'Establecer contraseña →' })
    })

    // Editar perfil — abrir
    document.getElementById('a-edit-btn').addEventListener('click', function () {
      var s = getSession()
      if (!s) return
      document.getElementById('ep-name').value      = s.name      || ''
      document.getElementById('ep-apellidos').value = s.apellidos || ''
      document.getElementById('ep-telefono').value  = s.telefono  || ''
      document.getElementById('ep-err').textContent = ''
      document.getElementById('ep-ok').textContent  = ''
      switchTab('editprofile')
    })

    // Editar perfil — cancelar
    document.getElementById('ep-cancel-btn').addEventListener('click', function () {
      switchTab('profile')
    })

    // Editar perfil — guardar
    document.getElementById('ep-save-btn').addEventListener('click', function () {
      var name      = document.getElementById('ep-name').value.trim()
      var apellidos = document.getElementById('ep-apellidos').value.trim()
      var telefono  = document.getElementById('ep-telefono').value.trim()
      var err       = document.getElementById('ep-err')
      var ok        = document.getElementById('ep-ok')
      var btn       = document.getElementById('ep-save-btn')
      err.textContent = ''; ok.textContent = ''
      if (!name || name.length < 2) { err.textContent = 'El nombre debe tener al menos 2 caracteres.'; return }
      btn.disabled = true; btn.textContent = 'Guardando…'
      fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
        body: JSON.stringify({ name: name, apellidos: apellidos, telefono: telefono })
      })
      .then(function (r) { return r.json() })
      .then(function (res) {
        if (res.error) { err.textContent = res.error; return }
        setSession(res); updateFab(res); fillProfile(res)
        ok.textContent = '¡Perfil actualizado!'
        setTimeout(function () { switchTab('profile') }, 900)
      })
      .catch(function () { err.textContent = 'Error de conexión.' })
      .finally(function () { btn.disabled = false; btn.textContent = 'Guardar cambios →' })
    })

    // Logout
    document.getElementById('a-logout').addEventListener('click', function () {
      clearSession(); updateFab(null); updateBanner(null); closeModal()
      window._miembrosInit = false
      window._miembrosHistory = []
    })

    // Keydown Enter
    ;['l-email', 'l-pwd'].forEach(function (id) {
      document.getElementById(id).addEventListener('keydown', function (e) {
        if (e.key === 'Enter') document.getElementById('l-btn').click()
      })
    })
    ;['r-name', 'r-email', 'r-pwd'].forEach(function (id) {
      document.getElementById(id).addEventListener('keydown', function (e) {
        if (e.key === 'Enter') document.getElementById('r-btn').click()
      })
    })
  })
})()

// ---- ÁREA DE MIEMBROS ----
;(function () {
  'use strict'

  var GROQ_KEY = 'TU_API_KEY_GROQ_AQUI'

  var PLAN_RECURSOS = {
    'Plan Normal': [
      { icon: '📸', titulo: 'Guía de foto de perfil', desc: 'Ángulos, iluminación y composición para transmitir confianza en tu primera impresión.' },
      { icon: '✍️', titulo: 'Plantillas de biografía', desc: 'Fórmulas probadas para Instagram, LinkedIn y TikTok que generan más visitas.' },
      { icon: '🔒', titulo: 'Checklist de privacidad', desc: '10 ajustes esenciales que deberías revisar en tus cuentas ahora mismo.' },
      { icon: '📄', titulo: 'Informe inicial PDF', desc: 'Tu asesora está preparando tu informe personalizado de imagen digital.' }
    ],
    'Plan Premium': [
      { icon: '📸', titulo: 'Guía de foto de perfil', desc: 'Ángulos, iluminación y composición para transmitir confianza.' },
      { icon: '✍️', titulo: 'Plantillas de biografía', desc: 'Fórmulas probadas para todas tus redes sociales.' },
      { icon: '📊', titulo: 'Informe mensual de rendimiento', desc: 'Análisis detallado de tus mejores publicaciones, horarios óptimos y evolución del engagement.' },
      { icon: '🚀', titulo: 'Estrategia de crecimiento 90 días', desc: 'Plan personalizado para aumentar tu audiencia de forma orgánica y consistente.' },
      { icon: '💾', titulo: 'Copia de seguridad activa', desc: 'Tu contenido digital está siendo respaldado automáticamente cada semana.' },
      { icon: '⏰', titulo: 'Calendario de publicaciones', desc: 'Horarios optimizados según el comportamiento real de tu audiencia.' }
    ],
    'Plan Exeltior': [
      { icon: '🎯', titulo: 'Consultoría estratégica', desc: 'Sesión 1-a-1 con tu asesora senior para definir y proyectar tu imagen ejecutiva.' },
      { icon: '💼', titulo: 'LinkedIn premium', desc: 'Perfil reescrito, headline que posiciona y "Acerca de" que convierte visitas en oportunidades.' },
      { icon: '📷', titulo: 'Sesión fotográfica planificada', desc: 'Brief completo y coordinación con fotógrafo profesional.' },
      { icon: '🛡️', titulo: 'Gestión de reputación', desc: 'Monitorización de menciones, alertas de marca y estrategia de respuesta ante crisis.' },
      { icon: '🧹', titulo: 'Limpieza de huella digital', desc: 'Identificación y eliminación de contenido antiguo que no encaja con tu imagen actual.' },
      { icon: '🤝', titulo: 'Filtrado de oportunidades', desc: 'Evaluación estratégica de colaboraciones, entrevistas y apariciones en medios.' },
      { icon: '⚡', titulo: 'Acceso prioritario', desc: 'Tu asesora personal responde en menos de 24 horas, cualquier día de la semana.' }
    ]
  }

  window._miembrosHistory = window._miembrosHistory || []
  window._miembrosInit    = window._miembrosInit    || false

  function getSession() { return JSON.parse(localStorage.getItem('mm_session') || 'null') }
  function getToken() { return localStorage.getItem('mm_token') }

  function getActivePlan(session) {
    if (!session || !session.plan) return null
    var plans = ['Plan Exeltior', 'Plan Premium', 'Plan Normal']
    for (var i = 0; i < plans.length; i++) {
      if (session.plan.indexOf(plans[i]) !== -1 && session.plan.indexOf('activo') !== -1) return plans[i]
    }
    return null
  }

  function planColor(plan) {
    if (plan === 'Plan Exeltior') return '#1a1a1a'
    if (plan === 'Plan Premium')  return '#b99a5b'
    return '#8c6a32'
  }

  function initials(name) {
    return name.trim().split(/\s+/).map(function (w) { return w[0] }).slice(0, 2).join('').toUpperCase()
  }

  function systemPrompt(session, plan) {
    var nombre = session.name.split(' ')[0]
    var recursos = (PLAN_RECURSOS[plan] || []).map(function (r) { return r.titulo }).join(', ')
    return 'Eres la gestora de cuenta privada y exclusiva de ' + nombre + ' en M&M Studio.' +
      ' Tu única función es acompañar a ' + nombre + ' en el aprovechamiento de su ' + plan + '.' +
      ' Trátale siempre por su nombre y con un trato premium, como si fuera tu único cliente.' +
      '\n\nSu plan incluye exactamente estos recursos: ' + recursos + '.' +
      '\n\nCómo debes responder:' +
      '\n- Centra TODAS tus respuestas en los recursos de su ' + plan + ': cómo usarlos, qué esperar, próximos pasos' +
      '\n- Si te hace una pregunta general de imagen, relaciónala siempre con alguno de sus recursos del plan' +
      '\n- Usa un lenguaje exclusivo: "en tu plan tienes acceso a...", "vamos a trabajar juntos en...", "tu próximo paso es..."' +
      '\n- Si pregunta algo que no cubre su plan, indícale qué plan lo incluiría (sin presionar)' +
      '\n- Máximo 4 frases por respuesta. En español. No menciones que eres una IA.'
  }

  // ---- ESTILOS ----
  var s = document.createElement('style')
  s.textContent = [
    '#miembros-fab{position:fixed;top:20px;left:20px;z-index:8997;',
    'background:linear-gradient(135deg,#111111,#6b5438);color:white!important;',
    'border:2px solid #b99a5b;border-radius:30px;padding:10px 18px;',
    'font-size:14px;font-weight:bold;cursor:pointer;',
    'display:flex;align-items:center;gap:7px;',
    'box-shadow:0 4px 16px rgba(0,0,0,.35);',
    'transition:transform .2s,box-shadow .2s;',
    'width:auto!important;margin:0!important;margin-top:0!important;}',
    '#miembros-fab:hover{transform:translateY(-2px);box-shadow:0 7px 22px rgba(0,0,0,.45);',
    'background:linear-gradient(135deg,#1a1a1a,#8c6a32)!important;}',

    '#miembros-ov{position:fixed;inset:0;z-index:10002;',
    'background:rgba(0,0,0,.78);backdrop-filter:blur(8px);',
    'display:none;align-items:center;justify-content:center;}',
    '#miembros-ov.open{display:flex;}',

    '#miembros-modal{width:600px;max-width:96vw;max-height:92vh;',
    'background:#faf7f2;border-radius:22px;',
    'box-shadow:0 28px 80px rgba(0,0,0,.55);',
    'display:flex;flex-direction:column;overflow:hidden;',
    'animation:mPop .28s cubic-bezier(.34,1.56,.64,1);}',
    '@keyframes mPop{from{opacity:0;transform:scale(.88) translateY(20px)}to{opacity:1;transform:none}}',

    '#m-head{background:linear-gradient(120deg,#0d0d0d 0%,#4a3520 50%,#8c6532 80%,#b99a5b 100%);',
    'padding:20px 22px 0;flex-shrink:0;}',
    '#m-head-top{display:flex;align-items:center;gap:14px;margin-bottom:16px;}',
    '#m-av{width:50px;height:50px;border-radius:50%;',
    'display:flex;align-items:center;justify-content:center;',
    'font-size:19px;font-weight:bold;color:white;flex-shrink:0;',
    'box-shadow:0 3px 12px rgba(0,0,0,.3);}',
    '#m-info{flex:1;}',
    '#m-info strong{display:block;color:white;font-size:16px;}',
    '#m-info small{color:rgba(255,255,255,.6);font-size:12px;}',
    '#m-badge{display:inline-block;color:white;font-size:11px;font-weight:bold;',
    'padding:3px 12px;border-radius:20px;margin-top:5px;',
    'border:1px solid rgba(255,255,255,.3);}',
    '#m-close{background:rgba(255,255,255,.15)!important;border:none!important;',
    'color:white!important;width:32px!important;height:32px!important;',
    'border-radius:50%!important;cursor:pointer!important;font-size:15px!important;',
    'display:flex;align-items:center;justify-content:center;',
    'padding:0!important;margin:0!important;margin-top:0!important;',
    'flex-shrink:0;transition:background .2s!important;line-height:1;align-self:flex-start;}',
    '#m-close:hover{background:rgba(255,255,255,.3)!important;}',

    '#m-tabs{display:flex;gap:0;padding:0 22px;}',
    '.mtab{padding:10px 16px!important;background:rgba(255,255,255,.1)!important;',
    'border:none!important;border-radius:10px 10px 0 0!important;',
    'color:rgba(255,255,255,.6)!important;font-size:14px!important;font-weight:bold!important;',
    'cursor:pointer!important;transition:all .2s!important;',
    'margin:0!important;margin-top:0!important;width:auto!important;}',
    '.mtab.mon{background:white!important;color:#3a2b16!important;}',
    '.mtab:not(.mon):hover{background:rgba(255,255,255,.2)!important;color:white!important;}',

    '#m-body{flex:1;overflow-y:auto;min-height:0;}',

    '#mtab-chat{display:flex;flex-direction:column;height:340px;}',
    '#m-msgs{flex:1;overflow-y:auto;padding:16px;',
    'display:flex;flex-direction:column;gap:10px;background:#faf7f2;}',
    '.mpm{max-width:84%;padding:10px 14px;border-radius:14px;',
    'font-size:14px;line-height:1.5;word-break:break-word;}',
    '.mpm.bot{align-self:flex-start;background:#eadfcf;color:#2b2b2b;border-bottom-left-radius:4px;}',
    '.mpm.user{align-self:flex-end;background:#8c6a32;color:white;border-bottom-right-radius:4px;}',
    '.mpm.typing{color:#aaa;font-style:italic;background:#f0ebe2;}',
    '#m-inp-area{display:flex;padding:12px;gap:8px;border-top:1px solid #e8e0d5;',
    'background:white;align-items:center;flex-shrink:0;}',
    '#m-inp{flex:1;border:1.5px solid #e8e0d5;border-radius:20px;',
    'padding:10px 14px;font-size:14px;outline:none;',
    'margin:0!important;margin-top:0!important;width:auto!important;transition:border-color .2s;}',
    '#m-inp:focus{border-color:#b99a5b;}',
    '#m-send{background:linear-gradient(135deg,#6b5438,#b99a5b)!important;',
    'color:white!important;border:none!important;border-radius:20px!important;',
    'padding:10px 18px!important;cursor:pointer!important;font-size:14px!important;',
    'white-space:nowrap;width:auto!important;margin:0!important;margin-top:0!important;',
    'transition:opacity .2s!important;}',
    '#m-send:hover{opacity:.88!important;}',

    '#mtab-recursos{padding:16px;display:none;grid-template-columns:1fr 1fr;gap:12px;}',
    '.mrec{background:white;border-radius:14px;padding:16px;',
    'box-shadow:0 2px 10px rgba(0,0,0,.06);border-left:3px solid #b99a5b;',
    'display:flex;flex-direction:column;gap:5px;}',
    '.mrec-i{font-size:22px;}',
    '.mrec-t{font-size:14px;font-weight:bold;color:#3a2b16;}',
    '.mrec-d{font-size:12px;color:#888;line-height:1.4;}',

    '#m-app-footer{background:linear-gradient(120deg,#0d0d0d,#4a3520,#8c6532);',
    'padding:16px 22px;flex-shrink:0;',
    'display:flex;align-items:center;justify-content:space-between;gap:14px;}',
    '#m-app-footer p{margin:0;color:rgba(255,255,255,.8);font-size:13px;line-height:1.5;}',
    '#m-app-footer strong{color:white;display:block;font-size:14px;margin-bottom:2px;}',
    '.mapp-b{display:flex;gap:8px;flex-shrink:0;}',
    '.mapp-b span{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);',
    'color:white;border-radius:10px;padding:7px 13px;font-size:12px;font-weight:bold;white-space:nowrap;}',

    '#m-locked{text-align:center;padding:48px 32px;}',
    '#m-locked .mlk-ico{font-size:56px;margin-bottom:16px;}',
    '#m-locked h3{color:#3a2b16;font-size:21px;margin:0 0 10px;}',
    '#m-locked p{color:#888;font-size:15px;max-width:340px;margin:0 auto 24px;line-height:1.6;}',

    'body.dark-mode #miembros-modal{background:#252118;}',
    'body.dark-mode #m-msgs{background:#252118;}',
    'body.dark-mode .mpm.bot{background:#2d2318;color:#e0d5c5;}',
    'body.dark-mode .mpm.typing{background:#252118;color:#a0947d;}',
    'body.dark-mode #m-inp-area{background:#1e1c18;border-color:#3a2f20;}',
    'body.dark-mode #m-inp{background:#141210!important;color:#e0d5c5!important;border-color:#3a2f20!important;}',
    'body.dark-mode #mtab-recursos{background:#252118;}',
    'body.dark-mode .mrec{background:#2d2318;}',
    'body.dark-mode .mrec-t{color:#d4a96a;}',
    'body.dark-mode .mrec-d{color:#a0947d;}',
    'body.dark-mode #m-locked h3{color:#e0d5c5;}',
    'body.dark-mode #m-locked p{color:#a0947d;}',
    '@media(max-width:600px){#mtab-recursos{grid-template-columns:1fr;}',
    '#miembros-modal{height:92vh;}}'
  ].join('')
  document.head.appendChild(s)

  // ---- CREAR ELEMENTOS ----
  var fab = document.createElement('button')
  fab.id = 'miembros-fab'
  fab.title = 'Área de miembros'
  fab.innerHTML = '👑 Mi Área'

  var ov = document.createElement('div')
  ov.id = 'miembros-ov'
  ov.innerHTML = '<div id="miembros-modal"></div>'

  document.body.appendChild(ov)
  document.body.appendChild(fab)

  ov.addEventListener('click', function (e) { if (e.target === ov) cerrar() })

  // ---- LÓGICA ----
  function cerrar() { ov.classList.remove('open') }

  function abrir() {
    var session = getSession()
    var plan    = getActivePlan(session)
    var modal   = document.getElementById('miembros-modal')

    if (!plan) {
      modal.innerHTML = buildLocked(session)
      modal.querySelector('#m-close-lk').addEventListener('click', cerrar)
      ov.classList.add('open')
      return
    }

    var nombre   = session.name.split(' ')[0]
    var ini      = initials(session.name)
    var recursos = PLAN_RECURSOS[plan] || []
    var color    = planColor(plan)

    modal.innerHTML = buildModal(session, plan, nombre, ini, color, recursos)

    modal.querySelector('#m-close').addEventListener('click', cerrar)

    // Tabs
    modal.querySelectorAll('.mtab').forEach(function (t) {
      t.addEventListener('click', function () {
        modal.querySelectorAll('.mtab').forEach(function (x) { x.classList.remove('mon') })
        t.classList.add('mon')
        var chat = document.getElementById('mtab-chat')
        var rec  = document.getElementById('mtab-recursos')
        if (t.dataset.tab === 'chat') {
          chat.style.display = 'flex'; rec.style.display = 'none'
        } else {
          chat.style.display = 'none'; rec.style.display = 'grid'
        }
      })
    })

    // Renderizar historial previo
    window._miembrosHistory.forEach(function (m) {
      if (m.role === 'assistant') addMsg(m.content, 'bot')
      else if (m.role === 'user')  addMsg(m.content, 'user')
    })

    // Bienvenida (solo la primera vez)
    if (!window._miembrosInit) {
      window._miembrosInit = true
      var bienvenida = '¡Bienvenido/a al Área de Miembros, ' + nombre + '! 🌟 Soy tu asesora privada en M&M Studio. ' +
        'Tienes activo el ' + plan + ', así que estoy aquí para ayudarte con todo lo que incluye. ¿Por dónde quieres empezar?'
      addMsg(bienvenida, 'bot')
      window._miembrosHistory.push({ role: 'assistant', content: bienvenida })
    }

    // Chat eventos
    var sendBtn = document.getElementById('m-send')
    var inp     = document.getElementById('m-inp')
    sendBtn.addEventListener('click', function () { enviar(session, plan) })
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') enviar(session, plan) })

    ov.classList.add('open')
    inp.focus()
  }

  function addMsg(text, cls, id) {
    var box = document.getElementById('m-msgs')
    if (!box) return
    var el = document.createElement('div')
    el.className = 'mpm ' + cls
    el.textContent = text
    if (id) el.id = id
    box.appendChild(el)
    box.scrollTop = box.scrollHeight
    return el
  }

  function enviar(session, plan) {
    var inp  = document.getElementById('m-inp')
    var send = document.getElementById('m-send')
    var text = inp.value.trim()
    if (!text) return
    inp.value = ''; inp.disabled = true; send.disabled = true

    addMsg(text, 'user')
    window._miembrosHistory.push({ role: 'user', content: text })

    var tId = 'mpt' + Date.now()
    addMsg('Escribiendo…', 'typing', tId)

    var msgs = [{ role: 'system', content: systemPrompt(session, plan) }].concat(window._miembrosHistory)

    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
      body: JSON.stringify({ model: 'llama-3.1-8b-instant', max_tokens: 300, messages: msgs })
    })
    .then(function (r) { return r.json() })
    .then(function (d) {
      var el = document.getElementById(tId); if (el) el.remove()
      var reply = (d.choices && d.choices[0]) ? d.choices[0].message.content : 'Entendido, continúa cuando quieras.'
      addMsg(reply, 'bot')
      window._miembrosHistory.push({ role: 'assistant', content: reply })
    })
    .catch(function () {
      var el = document.getElementById(tId); if (el) el.remove()
      addMsg('Error de conexión. Inténtalo de nuevo.', 'bot')
    })
    .finally(function () {
      inp.disabled = false; send.disabled = false; inp.focus()
    })
  }

  // ---- CONSTRUCTORES HTML ----
  function buildLocked(session) {
    var msg = session
      ? 'Tu cuenta no tiene ningún plan activo. Contrata un plan para acceder a tu área privada con asesora personal y recursos exclusivos.'
      : 'Inicia sesión y contrata un plan para acceder a tu área privada con asesora personal y recursos exclusivos.'
    return '<div style="display:flex;align-items:center;justify-content:space-between;' +
      'padding:16px 20px;border-bottom:1px solid #eadfcf;">' +
      '<strong style="font-size:16px;color:#3a2b16">Área de Miembros</strong>' +
      '<button id="m-close-lk" style="background:rgba(0,0,0,.08)!important;border:none!important;' +
      'color:#555!important;width:32px!important;height:32px!important;border-radius:50%!important;' +
      'cursor:pointer!important;font-size:15px!important;display:flex;align-items:center;' +
      'justify-content:center;padding:0!important;margin:0!important;margin-top:0!important;">✕</button></div>' +
      '<div id="m-locked"><div class="mlk-ico">🔐</div>' +
      '<h3>Acceso exclusivo para miembros</h3><p>' + msg + '</p>' +
      '<a class="boton" href="servicios.html" style="display:inline-block;text-decoration:none">' +
      'Ver planes disponibles →</a></div>' +
      '<div id="m-app-footer"><p><strong>M&M Studio App</strong>Para disfrutar de todas las ventajas, contrata un plan y accede a tu app privada</p>' +
      '<div class="mapp-b"></div></div>'
  }

  function buildModal(session, plan, nombre, ini, color, recursos) {
    var cards = recursos.map(function (r) {
      return '<div class="mrec"><div class="mrec-i">' + r.icon + '</div>' +
        '<div class="mrec-t">' + r.titulo + '</div>' +
        '<div class="mrec-d">' + r.desc + '</div></div>'
    }).join('')

    return '<div id="m-head">' +
      '<div id="m-head-top">' +
      '<div id="m-av" style="background:' + color + '">' + ini + '</div>' +
      '<div id="m-info"><strong>' + session.name + '</strong>' +
      '<small>Miembro activo · M&M Studio</small><br>' +
      '<span id="m-badge" style="background:' + color + '">' + plan + '</span></div>' +
      '<button id="m-close">✕</button></div>' +
      '<div id="m-tabs">' +
      '<button class="mtab mon" data-tab="chat">💬 Asesora privada</button>' +
      '<button class="mtab" data-tab="recursos">⭐ Mis recursos</button>' +
      '</div></div>' +
      '<div id="m-body">' +
      '<div id="mtab-chat">' +
      '<div id="m-msgs"></div>' +
      '<div id="m-inp-area">' +
      '<input id="m-inp" type="text" placeholder="Pregunta a tu asesora privada…" maxlength="500">' +
      '<button id="m-send">Enviar</button></div></div>' +
      '<div id="mtab-recursos">' + cards + '</div>' +
      '</div>' +
      '<div id="m-app-footer">' +
      '<p><strong>M&M Studio App</strong>Accede a tu panel completo con todas las ventajas de tu ' + plan + '</p>' +
      '<div class="mapp-b"><a href="app.html" style="background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.4);' +
      'color:white;border-radius:10px;padding:8px 16px;font-size:13px;font-weight:bold;' +
      'text-decoration:none;white-space:nowrap;">Ir a mi App →</a></div></div>'
  }

  fab.addEventListener('click', abrir)
})()
