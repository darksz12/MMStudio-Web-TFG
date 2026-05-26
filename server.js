'use strict'

const express = require('express')
const https   = require('https')
const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const app = express()
const JWT_SECRET = process.env.JWT_SECRET || 'mmstudio-secret-2025'
const GROQ_KEY   = process.env.GROQ_KEY   || 'TU_API_KEY_GROQ_AQUI'
const db = new Database('/data/mmstudio.db')

app.use(express.json())
app.use(cors())

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT    NOT NULL,
    apellidos        TEXT    NOT NULL DEFAULT '',
    telefono         TEXT    NOT NULL DEFAULT '',
    birthday         TEXT    NOT NULL DEFAULT '',
    email            TEXT    UNIQUE NOT NULL,
    password         TEXT    NOT NULL,
    plan             TEXT    NOT NULL DEFAULT 'Sin plan activo',
    plan_requested   TEXT    NOT NULL DEFAULT '',
    joined           TEXT    NOT NULL,
    is_admin         INTEGER NOT NULL DEFAULT 0,
    force_pwd_change INTEGER NOT NULL DEFAULT 0
  )
`)

// Migraciones para bases de datos existentes
;[
  'ALTER TABLE users ADD COLUMN apellidos TEXT NOT NULL DEFAULT \'\'',
  'ALTER TABLE users ADD COLUMN telefono TEXT NOT NULL DEFAULT \'\'',
  'ALTER TABLE users ADD COLUMN birthday TEXT NOT NULL DEFAULT \'\'',
  'ALTER TABLE users ADD COLUMN plan_requested TEXT NOT NULL DEFAULT \'\'',
  'ALTER TABLE users ADD COLUMN force_pwd_change INTEGER NOT NULL DEFAULT 0'
].forEach(function(sql) { try { db.exec(sql) } catch(e) {} })

db.exec(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL,
    service   TEXT NOT NULL,
    summary   TEXT NOT NULL DEFAULT '',
    created   TEXT NOT NULL
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    plan      TEXT NOT NULL,
    stars     INTEGER NOT NULL DEFAULT 5,
    body      TEXT NOT NULL,
    approved  INTEGER NOT NULL DEFAULT 0,
    created   TEXT NOT NULL
  )
`)

const count = db.prepare('SELECT COUNT(*) as c FROM users').get()
if (count.c === 0) {
  db.prepare('INSERT INTO users (name, email, password, plan, joined, is_admin) VALUES (?,?,?,?,?,?)')
    .run('Admin', 'admin@mmstudio.com', bcrypt.hashSync('admin123', 10), 'Sin plan activo', new Date().toLocaleDateString('es-ES'), 1)
}

// Easter egg — cuenta de Greta
if (!db.prepare('SELECT id FROM users WHERE email = ?').get('greta@mmstudio.com')) {
  db.prepare('INSERT INTO users (name, apellidos, email, password, plan, joined) VALUES (?,?,?,?,?,?)')
    .run('Greta', '', 'greta@mmstudio.com', bcrypt.hashSync('felicidades', 10), 'Plan Premium activo', new Date().toLocaleDateString('es-ES'))
}

function authMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No autenticado' })
  try { req.user = jwt.verify(token, JWT_SECRET); next() }
  catch { res.status(401).json({ error: 'Sesión expirada' }) }
}

function userPublic(u) {
  return {
    name: u.name, apellidos: u.apellidos || '', telefono: u.telefono || '',
    birthday: u.birthday || '', planRequested: u.plan_requested || '',
    email: u.email, plan: u.plan, joined: u.joined,
    isAdmin: u.is_admin, forcePwdChange: u.force_pwd_change === 1
  }
}

// POST /api/register
app.post('/api/register', (req, res) => {
  const { name, apellidos, email, password } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'Faltan campos obligatorios.' })
  if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
  try {
    const joined = new Date().toLocaleDateString('es-ES')
    db.prepare('INSERT INTO users (name, apellidos, email, password, joined) VALUES (?,?,?,?,?)')
      .run(name.trim(), (apellidos || '').trim(), email.trim().toLowerCase(), bcrypt.hashSync(password, 10), joined)
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase())
    const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.is_admin }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: userPublic(user) })
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' })
    res.status(500).json({ error: 'Error del servidor.' })
  }
})

// POST /api/login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Faltan campos obligatorios.' })
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase())
  if (!user) return res.status(401).json({ error: 'Email no encontrado.' })
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Contraseña incorrecta.' })
  const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.is_admin }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: userPublic(user) })
})

// GET /api/me
app.get('/api/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
  res.json(userPublic(user))
})

// PATCH /api/me/profile
app.patch('/api/me/profile', authMiddleware, (req, res) => {
  const { name, apellidos, telefono, birthday } = req.body
  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'El nombre es obligatorio.' })
  db.prepare('UPDATE users SET name = ?, apellidos = ?, telefono = ?, birthday = ? WHERE id = ?')
    .run(name.trim(), (apellidos || '').trim(), (telefono || '').trim(), (birthday || '').trim(), req.user.id)
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  res.json(userPublic(user))
})

// POST /api/change-password
app.post('/api/change-password', authMiddleware, (req, res) => {
  const { oldPassword, password } = req.body
  if (!oldPassword) return res.status(400).json({ error: 'Introduce la contraseña actual.' })
  if (!password || password.length < 6) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' })
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' })
  if (!bcrypt.compareSync(oldPassword, user.password)) return res.status(401).json({ error: 'La contraseña actual no es correcta.' })
  db.prepare('UPDATE users SET password = ?, force_pwd_change = 0 WHERE id = ?')
    .run(bcrypt.hashSync(password, 10), req.user.id)
  res.json({ ok: true })
})

// POST /api/plan/request
app.post('/api/plan/request', authMiddleware, (req, res) => {
  const { plan } = req.body
  const valid = ['Plan Normal', 'Plan Premium', 'Plan Exeltior']
  if (!valid.includes(plan)) return res.status(400).json({ error: 'Plan no válido.' })
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (user.plan !== 'Sin plan activo') return res.status(400).json({ error: 'Ya tienes un plan activo.' })
  if (user.plan_requested) return res.status(400).json({ error: 'Ya tienes una solicitud pendiente.' })
  db.prepare('UPDATE users SET plan_requested = ? WHERE id = ?').run(plan, req.user.id)
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  res.json(userPublic(updated))
})

// GET /api/admin/users
app.get('/api/admin/users', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  const users = db.prepare('SELECT id, name, apellidos, telefono, email, plan, plan_requested, joined, force_pwd_change FROM users ORDER BY id DESC').all()
  res.json(users)
})

// PATCH /api/admin/plan-requests/:id/approve
app.patch('/api/admin/plan-requests/:id/approve', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id)
  if (!user || !user.plan_requested) return res.status(404).json({ error: 'Solicitud no encontrada.' })
  db.prepare('UPDATE users SET plan = ?, plan_requested = ? WHERE id = ?')
    .run(user.plan_requested + ' activo', '', req.params.id)
  res.json({ ok: true })
})

// PATCH /api/admin/plan-requests/:id/reject
app.patch('/api/admin/plan-requests/:id/reject', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  db.prepare('UPDATE users SET plan_requested = ? WHERE id = ?').run('', req.params.id)
  res.json({ ok: true })
})

// PATCH /api/admin/users/:id/plan
app.patch('/api/admin/users/:id/plan', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  const { plan } = req.body
  db.prepare('UPDATE users SET plan = ?, plan_requested = ? WHERE id = ?').run(plan, '', req.params.id)
  res.json({ ok: true })
})

// PATCH /api/admin/users/:id/password
app.patch('/api/admin/users/:id/password', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  const { password, forceChange } = req.body
  if (!password || password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' })
  db.prepare('UPDATE users SET password = ?, force_pwd_change = ? WHERE id = ?')
    .run(bcrypt.hashSync(password, 10), forceChange ? 1 : 0, req.params.id)
  res.json({ ok: true })
})

// POST /api/groq  — proxy autenticado hacia Groq
app.post('/api/groq', authMiddleware, (req, res) => {
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
      try { res.json(JSON.parse(data)) }
      catch (e) { res.status(500).json({ error: 'Respuesta inválida de Groq.' }) }
    })
  })
  pr.on('error', e => {
    console.error('Groq proxy error:', e.message)
    res.status(502).json({ error: 'No se pudo conectar con el servicio de IA.' })
  })
  pr.write(payload)
  pr.end()
})

// POST /api/activity
app.post('/api/activity', authMiddleware, (req, res) => {
  const { service, summary } = req.body
  if (!service) return res.status(400).json({ error: 'Falta el servicio.' })
  const user = db.prepare('SELECT plan FROM users WHERE id = ?').get(req.user.id)
  if (!user || user.plan === 'Sin plan activo') return res.status(403).json({ error: 'Sin plan activo.' })
  db.prepare('INSERT INTO activity_logs (user_id, service, summary, created) VALUES (?,?,?,?)')
    .run(req.user.id, service, (summary || '').substring(0, 300), new Date().toLocaleDateString('es-ES'))
  res.json({ ok: true })
})

// GET /api/admin/users/:id/activity
app.get('/api/admin/users/:id/activity', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  const logs = db.prepare('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY id DESC LIMIT 50').all(req.params.id)
  res.json(logs)
})

// POST /api/reviews
app.post('/api/reviews', authMiddleware, (req, res) => {
  const { stars, body } = req.body
  if (!body || body.trim().length < 10) return res.status(400).json({ error: 'La reseña debe tener al menos 10 caracteres.' })
  const s = parseInt(stars)
  if (!s || s < 1 || s > 5) return res.status(400).json({ error: 'Valoración no válida.' })
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!user || user.plan === 'Sin plan activo') return res.status(403).json({ error: 'Solo los usuarios con plan activo pueden publicar reseñas.' })
  const existing = db.prepare('SELECT id FROM reviews WHERE user_id = ?').get(req.user.id)
  if (existing) return res.status(409).json({ error: 'Ya tienes una reseña enviada.' })
  db.prepare('INSERT INTO reviews (user_id, user_name, plan, stars, body, created) VALUES (?,?,?,?,?,?)')
    .run(req.user.id, user.name, user.plan, s, body.trim(), new Date().toLocaleDateString('es-ES'))
  res.json({ ok: true })
})

// GET /api/reviews — público, solo aprobadas
app.get('/api/reviews', (req, res) => {
  const reviews = db.prepare('SELECT user_name, plan, stars, body, created FROM reviews WHERE approved = 1 ORDER BY id DESC').all()
  res.json(reviews)
})

// GET /api/admin/reviews
app.get('/api/admin/reviews', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  const reviews = db.prepare('SELECT * FROM reviews ORDER BY approved ASC, id DESC').all()
  res.json(reviews)
})

// PATCH /api/admin/reviews/:id/approve
app.patch('/api/admin/reviews/:id/approve', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  db.prepare('UPDATE reviews SET approved = 1 WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// DELETE /api/admin/reviews/:id
app.delete('/api/admin/reviews/:id', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

app.listen(3001, () => console.log('API MMStudio en puerto 3001'))
