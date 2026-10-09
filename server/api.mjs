// API ใช้ร่วมกันทั้ง vite dev/preview และ server.mjs (production)
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DB_FILE = path.join(ROOT, 'data/db.json')
const USERS_FILE = path.join(ROOT, 'data/users.json')
const SESSION_MS = 8 * 60 * 60 * 1000
const sessions = new Map()

const readBody = (req) =>
  new Promise((resolve) => {
    let b = ''
    req.on('data', (c) => (b += c))
    req.on('end', () => resolve(b))
  })

const send = (res, code, data) => {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':')
  if (!salt || !hash) return false
  const test = crypto.scryptSync(password, salt, 64)
  return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'))
}

function getSession(req) {
  const token = String(req.headers.authorization ?? '').replace('Bearer ', '')
  const s = sessions.get(token)
  if (!s) return null
  if (s.exp < Date.now()) { sessions.delete(token); return null }
  return s
}

export async function handleApi(req, res, next) {
  const url = (req.url ?? '').split('?')[0]

  // ห้ามเข้าถึงไฟล์ข้อมูล/สคริปต์โดยตรง
  if (url.startsWith('/data') || url.startsWith('/scripts') || url.startsWith('/server')) return send(res, 404, { error: 'not found' })

  if (url === '/api/login' && req.method === 'POST') {
    try {
      const { username, password } = JSON.parse(await readBody(req))
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
      const u = users.find((x) => x.username === username)
      if (!u || !verifyPassword(String(password), u.password)) return send(res, 401, { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })
      const token = crypto.randomBytes(32).toString('hex')
      sessions.set(token, { username: u.username, name: u.name, role: u.role, exp: Date.now() + SESSION_MS })
      return send(res, 200, { token, user: { username: u.username, name: u.name, role: u.role } })
    } catch (e) {
      console.error('[login]', e)
      return send(res, 400, { error: 'อ่านข้อมูลผู้ใช้ไม่ได้ ตรวจสอบไฟล์ data/users.json' })
    }
  }

  if (url === '/api/logout' && req.method === 'POST') {
    sessions.delete(String(req.headers.authorization ?? '').replace('Bearer ', ''))
    return send(res, 200, { ok: true })
  }

  if (url === '/api/me' || url === '/api/db') {
    const s = getSession(req)
    if (!s) return send(res, 401, { error: 'unauthorized' })
    if (url === '/api/me') return send(res, 200, { username: s.username, name: s.name, role: s.role })
    if (req.method === 'GET') { res.setHeader('Content-Type', 'application/json'); return res.end(fs.readFileSync(DB_FILE, 'utf-8')) }
    if (req.method === 'PUT') {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(JSON.parse(await readBody(req)), null, 2))
        return send(res, 200, { ok: true })
      } catch {
        return send(res, 400, { ok: false })
      }
    }
  }
  return next()
}
