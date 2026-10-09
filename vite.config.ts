import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const DB_FILE = path.resolve(__dirname, 'data/db.json')
const USERS_FILE = path.resolve(__dirname, 'data/users.json')
const SESSION_MS = 8 * 60 * 60 * 1000

interface Session { username: string; name: string; role: string; exp: number }
const sessions = new Map<string, Session>()

const readBody = (req: any) =>
  new Promise<string>((resolve) => {
    let b = ''
    req.on('data', (c: Buffer) => (b += c))
    req.on('end', () => resolve(b))
  })

const send = (res: any, code: number, data: unknown) => {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':')
  const test = crypto.scryptSync(password, salt, 64)
  return crypto.timingSafeEqual(test, Buffer.from(hash, 'hex'))
}

function getSession(req: any): Session | null {
  const token = String(req.headers.authorization ?? '').replace('Bearer ', '')
  const s = sessions.get(token)
  if (!s) return null
  if (s.exp < Date.now()) { sessions.delete(token); return null }
  return s
}

function api(): Plugin {
  const handler = async (req: any, res: any, next: () => void) => {
    const url: string = req.url ?? ''

    // ห้ามเข้าถึงไฟล์ข้อมูลโดยตรง
    if (url.startsWith('/data') || url.startsWith('/scripts')) return send(res, 404, { error: 'not found' })

    if (url === '/api/login' && req.method === 'POST') {
      try {
        const { username, password } = JSON.parse(await readBody(req))
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'))
        const u = users.find((x: any) => x.username === username)
        if (!u || !verifyPassword(String(password), u.password)) return send(res, 401, { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })
        const token = crypto.randomBytes(32).toString('hex')
        const session = { username: u.username, name: u.name, role: u.role, exp: Date.now() + SESSION_MS }
        sessions.set(token, session)
        return send(res, 200, { token, user: { username: u.username, name: u.name, role: u.role } })
      } catch {
        return send(res, 400, { error: 'ข้อมูลไม่ถูกต้อง' })
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
    next()
  }
  return {
    name: 'asset-api',
    configureServer: (s) => void s.middlewares.use(handler),
    configurePreviewServer: (s) => void s.middlewares.use(handler),
  }
}

export default defineConfig({ plugins: [react(), tailwindcss(), api()] })
