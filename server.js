'use strict'

// =============================================================
// DEPENDENCIAS — librerías externas que usa el servidor
// express       → framework para crear rutas y manejar peticiones HTTP
// https         → módulo de Node para hacer peticiones HTTPS (llamadas a Groq)
// mysql2/promise → cliente MySQL con soporte async/await
// bcryptjs      → para cifrar contraseñas antes de guardarlas en la BD
// jsonwebtoken  → para crear y verificar tokens JWT (sistema de sesión)
// cors          → permite que el navegador pueda hacer peticiones a la API
// =============================================================
const express = require('express')
const https   = require('https')
const mysql   = require('mysql2/promise')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const cors    = require('cors')

const app = express()

const JWT_SECRET = process.env.JWT_SECRET || 'mmstudio-secret-2025'
const GROQ_KEY   = process.env.GROQ_KEY   || 'TU_API_KEY_GROQ_AQUI'

app.use(express.json())
app.use(cors())

// Pool de conexiones MySQL. Se inicializa en initDB() antes de arrancar el servidor.
let pool

// =============================================================
// INICIO DE BASE DE DATOS
// MySQL tarda unos segundos en estar listo al arrancar el contenedor.
// Reintentamos la conexión hasta 10 veces con 3 segundos entre intentos.
// =============================================================
async function initDB() {
  for (let i = 0; i < 10; i++) {
    try {
      pool = mysql.createPool({
        host:               process.env.DB_HOST     || 'db',
        user:               process.env.DB_USER     || 'mmstudio',
        password:           process.env.DB_PASSWORD || 'mmstudio_pass',
        database:           process.env.DB_NAME     || 'mmstudio',
        waitForConnections: true,
        connectionLimit:    10
      })
      await pool.query('SELECT 1')
      console.log('Conectado a MySQL')
      break
    } catch (e) {
      console.log(`MySQL no disponible, reintentando... (${i + 1}/10)`)
      await new Promise(r => setTimeout(r, 3000))
      if (i === 9) throw new Error('No se pudo conectar a MySQL tras 10 intentos')
    }
  }

  // =============================================================
  // CREACIÓN DE TABLAS — se ejecuta al arrancar el servidor.
  // "CREATE TABLE IF NOT EXISTS" → solo crea la tabla si no existe,
  // nunca borra los datos existentes.
  // =============================================================

  // Tabla principal de usuarios del sistema
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id               INT AUTO_INCREMENT PRIMARY KEY,
      name             VARCHAR(255) NOT NULL,
      apellidos        VARCHAR(255) NOT NULL DEFAULT '',
      telefono         VARCHAR(50)  NOT NULL DEFAULT '',
      birthday         VARCHAR(20)  NOT NULL DEFAULT '',
      email            VARCHAR(255) UNIQUE NOT NULL,
      password         VARCHAR(255) NOT NULL,
      plan             VARCHAR(100) NOT NULL DEFAULT 'Sin plan activo',
      plan_requested   VARCHAR(100) NOT NULL DEFAULT '',
      joined           VARCHAR(20)  NOT NULL,
      is_admin         TINYINT(1)   NOT NULL DEFAULT 0,
      force_pwd_change TINYINT(1)   NOT NULL DEFAULT 0
    )
  `)

  // Tabla para registrar qué servicios IA ha usado cada miembro con plan activo
  await pool.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      user_id   INT          NOT NULL,
      service   VARCHAR(255) NOT NULL,
      summary   TEXT         NOT NULL,
      created   VARCHAR(20)  NOT NULL
    )
  `)

  // Tabla para guardar el historial de conversaciones con la IA por usuario
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_logs (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      user_id   INT          NOT NULL,
      service   VARCHAR(255) NOT NULL,
      role      VARCHAR(20)  NOT NULL,
      message   TEXT         NOT NULL,
      created   DATETIME     DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Tabla para las reseñas — pasan por moderación (approved=0) antes de ser visibles (approved=1)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      user_id   INT          NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      plan      VARCHAR(100) NOT NULL,
      stars     INT          NOT NULL DEFAULT 5,
      body      TEXT         NOT NULL,
      approved  TINYINT(1)   NOT NULL DEFAULT 0,
      created   VARCHAR(20)  NOT NULL
    )
  `)

  // =============================================================
  // DATOS INICIALES — solo se insertan si la base de datos está vacía
  // (es decir, en el primer arranque).
  // =============================================================

  const [[{ c }]] = await pool.query('SELECT COUNT(*) AS c FROM users')
  if (c === 0) {
    await pool.query(
      'INSERT INTO users (name, email, password, plan, joined, is_admin) VALUES (?,?,?,?,?,?)',
      ['Admin', 'admin@mmstudio.com', bcrypt.hashSync('admin123', 10), 'Sin plan activo', new Date().toLocaleDateString('es-ES'), 1]
    )
  }

  const [[greta]] = await pool.query('SELECT id FROM users WHERE email = ?', ['greta@mmstudio.com'])
  if (!greta) {
    await pool.query(
      'INSERT INTO users (name, apellidos, email, password, plan, joined) VALUES (?,?,?,?,?,?)',
      ['Greta', '', 'greta@mmstudio.com', bcrypt.hashSync('felicidades', 10), 'Plan Premium activo', new Date().toLocaleDateString('es-ES')]
    )
  }
}

// =============================================================
// MIDDLEWARE DE AUTENTICACIÓN — protege las rutas privadas.
// Lee el token del header "Authorization: Bearer <token>",
// lo verifica con JWT_SECRET y guarda los datos en req.user.
// =============================================================
function authMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No autenticado' })
  try { req.user = jwt.verify(token, JWT_SECRET); next() }
  catch { res.status(401).json({ error: 'Sesión expirada' }) }
}

// Construye el objeto de usuario que se devuelve al cliente.
// Nunca incluye el campo "password" para que el hash nunca salga del servidor.
function userPublic(u) {
  return {
    name: u.name, apellidos: u.apellidos || '', telefono: u.telefono || '',
    birthday: u.birthday || '', planRequested: u.plan_requested || '',
    email: u.email, plan: u.plan, joined: u.joined,
    isAdmin: u.is_admin, forcePwdChange: u.force_pwd_change === 1
  }
}

// =============================================================
// ENDPOINTS — rutas de la API REST
// =============================================================

// POST /api/register — registro de nuevo usuario
app.post('/api/register', async (req, res) => {
  const { name, apellidos, email, password } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'Faltan campos obligatorios.' })
  if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
  try {
    const joined = new Date().toLocaleDateString('es-ES')
    await pool.query(
      'INSERT INTO users (name, apellidos, email, password, joined) VALUES (?,?,?,?,?)',
      [name.trim(), (apellidos || '').trim(), email.trim().toLowerCase(), bcrypt.hashSync(password, 10), joined]
    )
    const [[user]] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()])
    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.is_admin }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: userPublic(user) })
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' })
    res.status(500).json({ error: 'Error del servidor.' })
  }
})

// POST /api/login — inicio de sesión
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Faltan campos obligatorios.' })
  const [[user]] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()])
  if (!user) return res.status(401).json({ error: 'Email no encontrado.' })
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Contraseña incorrecta.' })
  const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.is_admin }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: userPublic(user) })
})

// GET /api/me — devuelve los datos del usuario autenticado
app.get('/api/me', authMiddleware, async (req, res) => {
  const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id])
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
  res.json(userPublic(user))
})

// PATCH /api/me/profile — actualiza nombre, apellidos, teléfono y cumpleaños
app.patch('/api/me/profile', authMiddleware, async (req, res) => {
  const { name, apellidos, telefono, birthday } = req.body
  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'El nombre es obligatorio.' })
  await pool.query(
    'UPDATE users SET name = ?, apellidos = ?, telefono = ?, birthday = ? WHERE id = ?',
    [name.trim(), (apellidos || '').trim(), (telefono || '').trim(), (birthday || '').trim(), req.user.id]
  )
  const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id])
  res.json(userPublic(user))
})

// POST /api/change-password — cambia la contraseña del usuario autenticado
app.post('/api/change-password', authMiddleware, async (req, res) => {
  const { oldPassword, password } = req.body
  if (!oldPassword) return res.status(400).json({ error: 'Introduce la contraseña actual.' })
  if (!password || password.length < 6) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' })
  const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id])
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' })
  if (!bcrypt.compareSync(oldPassword, user.password)) return res.status(401).json({ error: 'La contraseña actual no es correcta.' })
  await pool.query(
    'UPDATE users SET password = ?, force_pwd_change = 0 WHERE id = ?',
    [bcrypt.hashSync(password, 10), req.user.id]
  )
  res.json({ ok: true })
})

// POST /api/plan/request — el usuario solicita un plan
app.post('/api/plan/request', authMiddleware, async (req, res) => {
  const { plan } = req.body
  const valid = ['Plan Normal', 'Plan Premium', 'Plan Exeltior']
  if (!valid.includes(plan)) return res.status(400).json({ error: 'Plan no válido.' })
  const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id])
  if (user.plan !== 'Sin plan activo') return res.status(400).json({ error: 'Ya tienes un plan activo.' })
  if (user.plan_requested) return res.status(400).json({ error: 'Ya tienes una solicitud pendiente.' })
  await pool.query('UPDATE users SET plan_requested = ? WHERE id = ?', [plan, req.user.id])
  const [[updated]] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id])
  res.json(userPublic(updated))
})

// =============================================================
// ENDPOINTS DE ADMINISTRADOR
// Todos pasan por authMiddleware y luego comprueban isAdmin.
// =============================================================

// GET /api/admin/users — lista todos los usuarios
app.get('/api/admin/users', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  const [users] = await pool.query(
    'SELECT id, name, apellidos, telefono, email, plan, plan_requested, joined, force_pwd_change FROM users ORDER BY id DESC'
  )
  res.json(users)
})

// PATCH /api/admin/plan-requests/:id/approve — aprueba la solicitud de plan
app.patch('/api/admin/plan-requests/:id/approve', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id])
  if (!user || !user.plan_requested) return res.status(404).json({ error: 'Solicitud no encontrada.' })
  await pool.query(
    'UPDATE users SET plan = ?, plan_requested = ? WHERE id = ?',
    [user.plan_requested + ' activo', '', req.params.id]
  )
  res.json({ ok: true })
})

// PATCH /api/admin/plan-requests/:id/reject — rechaza la solicitud de plan
app.patch('/api/admin/plan-requests/:id/reject', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  await pool.query('UPDATE users SET plan_requested = ? WHERE id = ?', ['', req.params.id])
  res.json({ ok: true })
})

// PATCH /api/admin/users/:id/plan — cambia el plan de un usuario directamente
app.patch('/api/admin/users/:id/plan', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  const { plan } = req.body
  await pool.query('UPDATE users SET plan = ?, plan_requested = ? WHERE id = ?', [plan, '', req.params.id])
  res.json({ ok: true })
})

// PATCH /api/admin/users/:id/password — el admin resetea la contraseña de un usuario
app.patch('/api/admin/users/:id/password', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  const { password, forceChange } = req.body
  if (!password || password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
  await pool.query(
    'UPDATE users SET password = ?, force_pwd_change = ? WHERE id = ?',
    [bcrypt.hashSync(password, 10), forceChange ? 1 : 0, req.params.id]
  )
  res.json({ ok: true })
})

// POST /api/groq — proxy hacia la API de inteligencia artificial (Groq)
// El cliente nunca llama directamente a Groq. Llama a este endpoint con su JWT,
// y el servidor es quien hace la petición real a Groq con la clave secreta.
// Si el body incluye "service", guarda el mensaje del usuario y la respuesta en chat_logs.
app.post('/api/groq', authMiddleware, (req, res) => {
  console.log('>> /api/groq recibido, user:', req.user.id, 'service:', req.body.service)
  if (!GROQ_KEY) {
    return res.status(503).json({ error: 'Servicio de IA no configurado.' })
  }
  const payload = JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    max_tokens: Number(req.body.max_tokens) || 500,
    messages: req.body.messages
  })
  const opts = {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + GROQ_KEY,
      'Content-Length': Buffer.byteLength(payload)
    }
  }
  const pr = https.request(opts, gr => {
    let data = ''
    gr.on('data', c => { data += c })
    gr.on('end', () => {
      try {
        const parsed = JSON.parse(data)
        res.json(parsed)
        // Guardar conversación si se indica el servicio
        const service = req.body.service
        if (service && parsed.choices && parsed.choices[0]) {
          const messages = req.body.messages || []
          const lastUser = [...messages].reverse().find(m => m.role === 'user')
          const aiReply = parsed.choices[0].message.content
          if (lastUser) {
            pool.query('INSERT INTO chat_logs (user_id, service, role, message) VALUES (?,?,?,?)',
              [req.user.id, service, 'user', lastUser.content])
              .then(() => console.log('Chat guardado [user]:', req.user.id, service))
              .catch(e => console.error('Error chat_log user:', e.message))
          }
          pool.query('INSERT INTO chat_logs (user_id, service, role, message) VALUES (?,?,?,?)',
            [req.user.id, service, 'assistant', aiReply])
            .then(() => console.log('Chat guardado [assistant]:', req.user.id, service))
            .catch(e => console.error('Error chat_log assistant:', e.message))
        }
      } catch (e) { res.status(500).json({ error: 'Respuesta inválida de Groq.' }) }
    })
  })
  pr.on('error', e => {
    console.error('Groq proxy error:', e.message)
    res.status(502).json({ error: 'No se pudo conectar con el servicio de IA.' })
  })
  pr.write(payload)
  pr.end()
})

// POST /api/activity — registra el uso de un servicio IA por parte de un miembro
app.post('/api/activity', authMiddleware, async (req, res) => {
  const { service, summary } = req.body
  if (!service) return res.status(400).json({ error: 'Falta el servicio.' })
  const [[user]] = await pool.query('SELECT plan FROM users WHERE id = ?', [req.user.id])
  if (!user || user.plan === 'Sin plan activo') return res.status(403).json({ error: 'Sin plan activo.' })
  await pool.query(
    'INSERT INTO activity_logs (user_id, service, summary, created) VALUES (?,?,?,?)',
    [req.user.id, service, (summary || '').substring(0, 300), new Date().toLocaleDateString('es-ES')]
  )
  res.json({ ok: true })
})

// GET /api/admin/users/:id/activity — el admin consulta la actividad de un usuario
app.get('/api/admin/users/:id/activity', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  const [logs] = await pool.query(
    'SELECT * FROM activity_logs WHERE user_id = ? ORDER BY id DESC LIMIT 50',
    [req.params.id]
  )
  res.json(logs)
})

// GET /api/chat-history — devuelve los últimos 30 mensajes del usuario para un servicio concreto
app.get('/api/chat-history', authMiddleware, async (req, res) => {
  const service = req.query.service
  if (!service) return res.json({ messages: [] })
  try {
    const [rows] = await pool.query(
      'SELECT role, message FROM (SELECT id, role, message FROM chat_logs WHERE user_id = ? AND service = ? ORDER BY id DESC LIMIT 30) sub ORDER BY id ASC',
      [req.user.id, service]
    )
    res.json({ messages: rows.map(r => ({ role: r.role, content: r.message })) })
  } catch (e) {
    res.json({ messages: [] })
  }
})

// POST /api/chat-log — guarda un mensaje individual de chat (usado por auth.js área de miembros)
app.post('/api/chat-log', authMiddleware, async (req, res) => {
  const { service, role, message } = req.body
  if (!service || !role || !message) return res.status(400).json({ error: 'Faltan datos.' })
  await pool.query(
    'INSERT INTO chat_logs (user_id, service, role, message) VALUES (?,?,?,?)',
    [req.user.id, service, role, message]
  )
  res.json({ ok: true })
})

// GET /api/admin/users/:id/chat — el admin ve el historial de conversaciones IA de un usuario
app.get('/api/admin/users/:id/chat', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  const [logs] = await pool.query(
    'SELECT service, role, message, created FROM chat_logs WHERE user_id = ? ORDER BY id ASC',
    [req.params.id]
  )
  res.json(logs)
})

// POST /api/reviews — el usuario envía una reseña
app.post('/api/reviews', authMiddleware, async (req, res) => {
  const { stars, body } = req.body
  if (!body || body.trim().length < 10) return res.status(400).json({ error: 'La reseña debe tener al menos 10 caracteres.' })
  const s = parseInt(stars)
  if (!s || s < 1 || s > 5) return res.status(400).json({ error: 'Valoración no válida.' })
  const [[user]] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id])
  if (!user || user.plan === 'Sin plan activo') return res.status(403).json({ error: 'Solo los usuarios con plan activo pueden publicar reseñas.' })
  const [[existing]] = await pool.query('SELECT id FROM reviews WHERE user_id = ?', [req.user.id])
  if (existing) return res.status(409).json({ error: 'Ya tienes una reseña enviada.' })
  await pool.query(
    'INSERT INTO reviews (user_id, user_name, plan, stars, body, created) VALUES (?,?,?,?,?,?)',
    [req.user.id, user.name, user.plan, s, body.trim(), new Date().toLocaleDateString('es-ES')]
  )
  res.json({ ok: true })
})

// GET /api/reviews — endpoint público con las reseñas aprobadas
app.get('/api/reviews', async (req, res) => {
  const [reviews] = await pool.query(
    'SELECT user_name, plan, stars, body, created FROM reviews WHERE approved = 1 ORDER BY id DESC'
  )
  res.json(reviews)
})

// GET /api/admin/reviews — el admin ve todas las reseñas
app.get('/api/admin/reviews', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  const [reviews] = await pool.query('SELECT * FROM reviews ORDER BY approved ASC, id DESC')
  res.json(reviews)
})

// PATCH /api/admin/reviews/:id/approve — aprueba una reseña
app.patch('/api/admin/reviews/:id/approve', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  await pool.query('UPDATE reviews SET approved = 1 WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

// DELETE /api/admin/reviews/:id — elimina una reseña
app.delete('/api/admin/reviews/:id', authMiddleware, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

// Conecta con MySQL, crea las tablas y arranca el servidor
initDB().then(() => {
  app.listen(3001, () => console.log('API MMStudio en puerto 3001'))
}).catch(e => {
  console.error('Error iniciando la base de datos:', e.message)
  process.exit(1)
})
