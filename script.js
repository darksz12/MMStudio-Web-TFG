function scrollToTop(){window.scrollTo({top:0,behavior:'smooth'});}

// ---- MENÚ HAMBURGUESA (móvil) ----
;(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var nav = document.querySelector('header nav')
    if (!nav) return
    var btn = document.createElement('button')
    btn.className = 'nav-hamburger'
    btn.innerHTML = '☰ Menú'
    btn.setAttribute('aria-label', 'Abrir menú de navegación')
    btn.addEventListener('click', function() {
      var open = nav.classList.toggle('open')
      btn.innerHTML = open ? '✕ Cerrar' : '☰ Menú'
    })
    nav.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        nav.classList.remove('open')
        btn.innerHTML = '☰ Menú'
      })
    })
    nav.parentNode.insertBefore(btn, nav)
  })
})();
function mensajeFormulario(){alert('Formulario recibido. En una web real se enviaría al correo de la empresa.');return false;}

// ---- BOTÓN FLOTANTE DE CONTACTO (top-right) ----
;(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var a = document.createElement('a')
    a.id = 'contact-fab'
    a.href = 'contacto.html'
    a.title = 'Contactar con M&M Studio'
    a.innerHTML = '<span style="font-size:15px">✉️</span> Contacto'
    document.body.appendChild(a)
  })
})();

// ---- MODO OSCURO (botón fijo flotante) ----
;(function(){
  var KEY = 'mmDarkMode'

  function applyTheme(dark){
    document.body.classList.toggle('dark-mode', dark)
    var btn = document.getElementById('mm-dark-btn')
    if(btn) btn.textContent = dark ? '☀️' : '🌙'
  }

  function injectBtn(){
    var btn = document.createElement('button')
    btn.id = 'mm-dark-btn'
    btn.className = 'mm-dark-toggle'
    btn.title = 'Cambiar modo claro/oscuro'
    btn.textContent = localStorage.getItem(KEY) === '1' ? '☀️' : '🌙'
    btn.onclick = function(){
      var dark = !document.body.classList.contains('dark-mode')
      localStorage.setItem(KEY, dark ? '1' : '0')
      applyTheme(dark)
    }
    document.body.appendChild(btn)
  }

  document.addEventListener('DOMContentLoaded', function(){
    injectBtn()
    applyTheme(localStorage.getItem(KEY) === '1')
  })
})();

// ---- ANIMACIONES DE SCROLL ----
;(function(){
  if(!window.IntersectionObserver) return
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('visible'); observer.unobserve(e.target) }
    })
  }, {threshold: 0.1})
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.tarjeta, .paso, .bloque, .opinion, .alerta, .nota, .stat-item').forEach(function(el){
      el.classList.add('animate-on-scroll')
      observer.observe(el)
    })
  })
})();

// ---- CONTADORES ANIMADOS ----
;(function(){
  if(!window.IntersectionObserver) return
  function animateCount(el){
    var target = parseInt(el.dataset.count, 10)
    var suffix = el.dataset.suffix || ''
    var duration = 1600
    var start = performance.now()
    function step(now){
      var p = Math.min((now - start) / duration, 1)
      var ease = 1 - Math.pow(1 - p, 3)
      el.textContent = Math.floor(ease * target) + suffix
      if(p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }
  var cObs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ animateCount(e.target); cObs.unobserve(e.target) } })
  }, {threshold: 0.5})
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('[data-count]').forEach(function(el){
      el.textContent = '0' + (el.dataset.suffix || '')
      cObs.observe(el)
    })
  })
})();
