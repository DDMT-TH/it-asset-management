import { NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import RegisterAsset from './pages/RegisterAsset'
import Handover from './pages/Handover'
import ReturnAsset from './pages/ReturnAsset'
import Repair from './pages/Repair'
import History from './pages/History'
import Dispose from './pages/Dispose'
import { StoreProvider, useStore } from './store'
import { useAuth } from './auth'
import Login from './pages/Login'

const NAV = [
  { to: '/', label: 'แดชบอร์ด' },
  { to: '/register', label: 'ลงทะเบียน Asset' },
  { to: '/handover', label: 'ส่งมอบ Asset' },
  { to: '/return', label: 'รับคืน Asset' },
  { to: '/repair', label: 'ส่งซ่อม / รับกลับ' },
  { to: '/dispose', label: 'จำหน่ายออก' },
  { to: '/history', label: 'ประวัติทั้งหมด' },
]

function Shell() {
  const { loading } = useStore()
  const { user, logout } = useAuth()
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col bg-ink text-white md:w-60 md:shrink-0">
        <div className="px-5 py-5 text-lg font-semibold">IT Asset Management</div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:pb-0">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => `whitespace-nowrap rounded-md px-3 py-2 text-sm ${isActive ? 'bg-brand font-medium' : 'text-white/75 hover:bg-white/10'}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto hidden border-t border-white/10 p-4 text-sm md:block">
          <div className="font-medium">{user?.name}</div>
          <div className="mb-2 text-white/60">{user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'}</div>
          <button onClick={logout} className="text-white/75 underline hover:text-white">ออกจากระบบ</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 md:p-8">
        {loading ? <p>กำลังโหลดข้อมูล…</p> : (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/register" element={<RegisterAsset />} />
            <Route path="/handover" element={<Handover />} />
            <Route path="/return" element={<ReturnAsset />} />
            <Route path="/repair" element={<Repair />} />
            <Route path="/dispose" element={<Dispose />} />
            <Route path="/history" element={<History />} />
          </Routes>
        )}
      </main>
    </div>
  )
}

export default function App() {
  const { user, checking } = useAuth()
  if (checking) return <p className="p-8">กำลังตรวจสอบสิทธิ์…</p>
  if (!user) return <Login />
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
