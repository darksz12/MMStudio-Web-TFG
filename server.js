'use strict'

const express = require('express')
const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const app = express()
const JWT_SECRET = process.env.JWT_SECRET || 'mmstudio-secret-2025'
const db = new Database('/data/mmstudio.db')

app.use(express.json())
app.use(cors())

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT    NOT NULL,
    apellidos        TEXT    NOT NULL DEFAULT '',
    telefono         TEXT    NOT NULL DEFAULT '',
    email            TEXT    UNIQUE NOT NULL,
    password         TEXT    NOT NULL,
    plan             TEXT    NOT NULL DEFAULT 'Sin plan activo',
    joined           TEXT    NOT NULL,
    is_admin         INTEGER NOT NULL DEFAULT 0,
    force_pwd_change INTEGER NOT NULL DEFAULT 0
  )
`)

// Migraciones para bases de datos existentes
;[
  'ALTER TABLE users ADD COLUMN apellidos TEXT NOT NULL DEFAULT \'\'',
  'ALTER TABLE users ADD COLUMN telefono TEXT NOT NULL DEFAULT \'\'',
  'ALTER TABLE users ADD COLUMN force_pwd_change INTEGER NOT NULL DEFAULT 0'
].forEach(function(sql) { try { db.exec(sql) } catch(e) {} })

const count = db.prepare('SELECT COUNT(*) as c FROM users').get()
if (count.c === 0) {
  db.prepare('INSERT INTO users (name, email, password, plan, joined, is_admin) VALUES (?,?,?,?,?,?)')
    .run('Admin', 'admin@mmstudio.com', bcrypt.hashSync('admin123', 10), 'Sin plan activo', new Date().toLocaleDateString('es-ES'), 1)
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
  const { name, apellidos, telefono } = req.body
  if (!name || name.trim().length < 2) return res.status(400).json({ error: 'El nombre es obligatorio.' })
  db.prepare('UPDATE users SET name = ?, apellidos = ?, telefono = ? WHERE id = ?')
    .run(name.trim(), (apellidos || '').trim(), (telefono || '').trim(), req.user.id)
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

// GET /api/admin/users
app.get('/api/admin/users', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  const users = db.prepare('SELECT id, name, apellidos, telefono, email, plan, joined, force_pwd_change FROM users ORDER BY id DESC').all()
  res.json(users)
})

// PATCH /api/admin/users/:id/plan
app.patch('/api/admin/users/:id/plan', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Acceso denegado' })
  const { plan } = req.body
  db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, req.params.id)
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

app.listen(3001, () => console.log('API MMStudio en puerto 3001'))
