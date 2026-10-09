import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth'
import { Field } from '../components'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError((await login(username, password)) ?? '')
    setBusy(false)
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink p-10 text-white md:flex">
        <div className="text-lg font-semibold">IT Asset Management</div>
        <p className="max-w-sm text-3xl font-semibold leading-snug">รู้ว่าอุปกรณ์ทุกชิ้นอยู่กับใคร และผ่านการซ่อมมากี่ครั้ง</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-semibold">เข้าสู่ระบบ</h1>
          {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Field label="ชื่อผู้ใช้"><input required autoFocus autoComplete="username" className="input" value={username} onChange={(e) => setUsername(e.target.value)} /></Field>
          <Field label="รหัสผ่าน"><input required type="password" autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <button className="btn w-full" disabled={busy}>{busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</button>
        </form>
      </div>
    </div>
  )
}
