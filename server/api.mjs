import { route } from './core.mjs'

const ROUTES = { '/api/login': 'login', '/api/logout': 'logout', '/api/me': 'me', '/api/db': 'db' }
const readBody = (req) => new Promise((resolve) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => resolve(b)) })

export async function handleApi(req, res, next) {
  const url = (req.url ?? '').split('?')[0]
  // ห้ามเข้าถึงไฟล์ข้อมูล/โค้ดฝั่งเซิร์ฟเวอร์โดยตรง
  if (/^\/(data|scripts|server|api)\//.test(url) && !ROUTES[url]) {
    res.statusCode = 404
    return res.end('{"error":"not found"}')
  }
  const name = ROUTES[url]
  if (!name) return next()
  const body = req.method === 'POST' || req.method === 'PUT' ? await readBody(req) : ''
  const { status, data } = await route(name, { method: req.method, headers: req.headers, body })
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(data))
}
