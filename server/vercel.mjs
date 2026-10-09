import { route } from './core.mjs'

// แปลง request/response ของ Vercel Node Function ให้เรียก route() เดียวกับ local
export const vercelHandler = (name) => async (req, res) => {
  const body = typeof req.body === 'string' ? req.body : req.body ? JSON.stringify(req.body) : ''
  const { status, data } = await route(name, { method: req.method, headers: req.headers, body })
  res.setHeader('Cache-Control', 'no-store')
  res.status(status).json(data)
}
