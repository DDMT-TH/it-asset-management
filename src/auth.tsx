import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export interface User { username: string; name: string; role: string }
interface Auth {
  user: User | null
  token: string
  checking: boolean
  login: (username: string, password: string) => Promise<string | null>
  logout: () => void
}

const KEY = 'itam_token'
const Ctx = createContext<Auth>(null!)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(KEY) ?? '')
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(!!token)

  const clear = () => { localStorage.removeItem(KEY); setToken(''); setUser(null) }

  // กู้ session เดิมเมื่อเปิดหน้าใหม่
  useEffect(() => {
    if (!token) return setChecking(false)
    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setUser)
      .catch(clear)
      .finally(() => setChecking(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login: Auth['login'] = async (username, password) => {
    try {
      const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
      const data = await r.json()
      if (!r.ok) return data.error ?? 'เข้าสู่ระบบไม่สำเร็จ'
      localStorage.setItem(KEY, data.token)
      setToken(data.token); setUser(data.user)
      return null
    } catch {
      return 'เชื่อมต่อ API ไม่ได้ — ต้องรันด้วย npm start (หรือ npm run dev) ไม่ใช่เปิดไฟล์ใน dist โดยตรง'
    }
  }

  const logout = () => {
    fetch('/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    clear()
  }

  return <Ctx.Provider value={{ user, token, checking, login, logout }}>{children}</Ctx.Provider>
}
