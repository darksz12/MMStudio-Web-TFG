;(function () {
  'use strict'

  // ---- CONFIGURACIÓN ----
  // Obtén tu API key gratuita en https://console.groq.com y ponla aquí
  const GROQ_API_KEY = 'TU_API_KEY_GROQ_AQUI'

  function getSystemPrompt() {
    var session = JSON.parse(localStorage.getItem('mm_session') || 'null')
    var nombreLinea = session ? 'El visitante se llama ' + session.name.split(' ')[0] + '. Puedes saludarle por su nombre.' : ''
    return 'Eres la asesora de orientación de M&M Studio, disponible para cualquier visitante de la web.' +
      ' Tu rol es responder dudas generales, explicar los servicios y ayudar a elegir el plan más adecuado.' +
      (nombreLinea ? ' ' + nombreLinea : '') + '\n\n' +
      'Responde preguntas sobre:\n' +
      '- Qué es M&M Studio y cómo funciona el servicio\n' +
      '- Diferencias entre los planes y cuál encaja con cada perfil\n' +
      '- Conceptos generales de imagen personal, redes sociales y personal branding\n' +
      '- Cómo empezar el proceso de solicitud\n\n' +
      'Planes disponibles:\n' +
      '• Plan Normal (150€/mes): fotos, biografía, privacidad, informe PDF.\n' +
      '• Plan Premium (400€/mes): todo lo anterior + seguimiento mensual, estrategia de crecimiento, backups, horarios óptimos.\n' +
      '• Plan Exeltior (1.500-2.500€/mes): consultoría estratégica, LinkedIn, sesiones fotográficas, reputación digital, huella digital.\n\n' +
      'Normas:\n' +
      '- Español, tono cercano y profesional\n' +
      '- Máximo 3 frases por respuesta\n' +
      '- Si alguien ya tiene un plan activo y pregunta por sus recursos específicos, indícale que acceda a su Área de Miembros (botón 👑 arriba a la izquierda) donde tiene una asesora privada dedicada\n' +
      '- No menciones que eres una IA'
  }

  const FALLBACK = [
    '¡Hola! Soy tu asesora virtual de M&M Studio. Puedo orientarte sobre imagen personal, marca digital y nuestros planes de asesoría. ¿En qué puedo ayudarte?',
    'En M&M Studio tenemos tres planes: el Normal (150€/mes) para mejorar tu perfil en redes, el Premium (400€/mes) para creadores de contenido, y el Exeltior (desde 1.500€/mes) para directivos y marcas. ¿Cuál se adapta mejor a tu situación?',
    'Para mejorar tu imagen online lo más importante es una buena foto de perfil, una biografía clara y coherencia en el contenido que publicas. Con el Plan Normal ya te ayudamos con todo eso.',
    'Si eres creador de contenido o quieres serlo, el Plan Premium incluye estrategia de crecimiento, informes mensuales y análisis de los mejores horarios de publicación.',
    'Para una valoración personalizada sin compromiso, puedes rellenar el formulario de contacto o pedir un diagnóstico inicial. Estaremos encantadas de ayudarte.',
    'La imagen personal va mucho más allá de la ropa: incluye cómo te presentas en redes, qué transmite tu perfil en los primeros segundos y la coherencia entre todos tus canales digitales.',
    'LinkedIn es clave para directivos y profesionales. Una foto actualizada, un titular potente y un "acerca de" bien redactado pueden multiplicar las oportunidades laborales. En el Plan Exeltior lo gestionamos todo.',
  ]

  let history = []
  let fallbackIdx = 0

  // ---- ESTILOS (se inyectan en <head>) ----
  const style = document.createElement('style')
  style.textContent = `
    #mm-chat-btn {
      position: fixed; bottom: 75px; right: 20px; z-index: 9998;
      width: 54px; height: 54px; border-radius: 50%;
      background: linear-gradient(135deg, #111111, #6b5438);
      border: 2px solid #b99a5b; cursor: pointer;
      box-shadow: 0 4px 18px rgba(0,0,0,.35);
      font-size: 22px; display: flex; align-items: center;
      justify-content: center; transition: transform .2s;
      padding: 0; margin: 0; width: 54px;
    }
    #mm-chat-btn:hover { transform: scale(1.1); background: linear-gradient(135deg, #1a1a1a, #8c6a32); }
    #mm-chat-panel {
      position: fixed; bottom: 140px; right: 20px; z-index: 9999;
      width: 320px; max-height: 450px;
      background: #faf7f2; border-radius: 18px;
      box-shadow: 0 8px 32px rgba(0,0,0,.22); border: 1px solid #d4b98a;
      display: none; flex-direction: column; overflow: hidden;
    }
    #mm-chat-panel.mm-open { display: flex; }
    #mm-chat-header {
      background: linear-gradient(120deg, #111111, #6b5438, #b99a5b);
      color: white; padding: 13px 16px;
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
    }
    #mm-chat-header-info { display: flex; align-items: center; gap: 8px; }
    #mm-chat-header-info span { font-weight: bold; font-size: 14px; }
    #mm-chat-header-info small { display: block; font-size: 11px; color: #f4ead7; font-weight: normal; }
    #mm-chat-close {
      background: transparent !important; border: none !important;
      color: white !important; cursor: pointer !important;
      font-size: 18px !important; padding: 0 !important; margin: 0 !important;
      margin-top: 0 !important; width: auto !important; line-height: 1;
      border-radius: 0 !important;
    }
    #mm-chat-close:hover { color: #f4d070 !important; background: transparent !important; }
    #mm-chat-messages {
      flex: 1; overflow-y: auto; padding: 12px 12px 8px 12px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .mm-msg {
      max-width: 86%; padding: 9px 13px; border-radius: 14px;
      font-size: 13px; line-height: 1.5; word-break: break-word;
    }
    .mm-msg.mm-user {
      align-self: flex-end;
      background: #8c6a32; color: white;
      border-bottom-right-radius: 4px;
    }
    .mm-msg.mm-bot {
      align-self: flex-start;
      background: #eadfcf; color: #2b2b2b;
      border-bottom-left-radius: 4px;
    }
    .mm-msg.mm-typing { color: #999; font-style: italic; background: #f0ebe2; }
    #mm-chat-input-area {
      display: flex; padding: 10px; gap: 7px;
      border-top: 1px solid #e0d4c0; background: #fff;
      align-items: center;
    }
    #mm-chat-input {
      flex: 1; border: 1px solid #ccc; border-radius: 20px;
      padding: 8px 13px; font-size: 13px; outline: none;
      resize: none; margin: 0 !important; margin-top: 0 !important;
      width: auto !important; min-width: 0;
    }
    #mm-chat-input:focus { border-color: #8c6a32; }
    #mm-chat-send {
      background: #8c6a32 !important; color: white !important;
      border: none !important; border-radius: 20px !important;
      padding: 8px 14px !important; cursor: pointer !important;
      font-size: 13px !important; white-space: nowrap;
      width: auto !important; margin: 0 !important; margin-top: 0 !important;
    }
    #mm-chat-send:hover { background: #5b421e !important; }
    #mm-chat-footer {
      text-align: center; font-size: 10px; color: #bbb;
      padding: 4px 0 8px; background: #fff;
    }
  `
  document.head.appendChild(style)

  // ---- HTML DEL WIDGET ----
  const btn = document.createElement('button')
  btn.id = 'mm-chat-btn'
  btn.title = 'Asesora de imagen IA'
  btn.innerHTML = '💬'

  const panel = document.createElement('div')
  panel.id = 'mm-chat-panel'
  panel.innerHTML = `
    <div id="mm-chat-header">
      <div id="mm-chat-header-info">
        <div>
          <span>✨ Asesora M&M Studio</span>
          <small>Imagen personal y marca digital</small>
        </div>
      </div>
      <button id="mm-chat-close" title="Cerrar">✕</button>
    </div>
    <div id="mm-chat-messages"></div>
    <div id="mm-chat-input-area">
      <input id="mm-chat-input" type="text" placeholder="¿En qué puedo ayudarte?" maxlength="400" />
      <button id="mm-chat-send">Enviar</button>
    </div>
    <div id="mm-chat-footer">M&M Studio · Asesora virtual de imagen</div>
  `

  document.body.appendChild(panel)
  document.body.appendChild(btn)

  const messagesEl = panel.querySelector('#mm-chat-messages')
  const inputEl = panel.querySelector('#mm-chat-input')
  const sendBtn = panel.querySelector('#mm-chat-send')
  const closeBtn = panel.querySelector('#mm-chat-close')

  // ---- FUNCIONES ----

  function appendMsg(text, role) {
    const div = document.createElement('div')
    div.className = 'mm-msg mm-' + role
    div.textContent = text
    messagesEl.appendChild(div)
    messagesEl.scrollTop = messagesEl.scrollHeight
    return div
  }

  function openChat() {
    panel.classList.add('mm-open')
    if (messagesEl.children.length === 0) {
      var session = JSON.parse(localStorage.getItem('mm_session') || 'null')
      var nombre = session ? session.name.split(' ')[0] : null
      var greeting = nombre
        ? '¡Hola, ' + nombre + '! Soy tu asesora virtual de M&M Studio. Puedo orientarte sobre imagen personal, marca digital y nuestros planes. ¿En qué puedo ayudarte? 😊'
        : '¡Hola! Soy tu asesora virtual de M&M Studio. Puedo orientarte sobre imagen personal, marca digital y nuestros planes. ¿En qué puedo ayudarte? 😊'
      appendMsg(greeting, 'bot')
    }
    setTimeout(() => inputEl.focus(), 50)
  }

  function closeChat() {
    panel.classList.remove('mm-open')
  }

  async function sendMessage() {
    const text = inputEl.value.trim()
    if (!text) return
    inputEl.value = ''
    inputEl.disabled = true
    sendBtn.disabled = true

    appendMsg(text, 'user')
    history.push({ role: 'user', content: text })

    const typingEl = appendMsg('Escribiendo…', 'typing')

    let reply
    try {
      if (GROQ_API_KEY) {
        reply = await callGroq()
      } else {
        await delay(750)
        reply = FALLBACK[fallbackIdx % FALLBACK.length]
        fallbackIdx++
      }
    } catch {
      reply = 'Ha ocurrido un error. Por favor, inténtalo de nuevo.'
    }

    typingEl.remove()
    appendMsg(reply, 'bot')
    history.push({ role: 'assistant', content: reply })

    inputEl.disabled = false
    sendBtn.disabled = false
    inputEl.focus()
  }

  async function callGroq() {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 220,
        messages: [{ role: 'system', content: getSystemPrompt() }, ...history],
      }),
    })
    const data = await res.json()
    return (
      data.choices?.[0]?.message?.content ||
      'Lo siento, no he podido procesar tu pregunta. Inténtalo de nuevo.'
    )
  }

  function delay(ms) {
    return new Promise((r) => setTimeout(r, ms))
  }

  // ---- EVENTOS ----
  btn.addEventListener('click', () =>
    panel.classList.contains('mm-open') ? closeChat() : openChat()
  )
  closeBtn.addEventListener('click', closeChat)
  sendBtn.addEventListener('click', sendMessage)
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  })
})()
