import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './auth'
import type { Asset, AssetStatus, DB, HistoryEntry, HistoryType } from './types'

interface Store {
  db: DB
  loading: boolean
  error: string
  addAsset: (a: Omit<Asset, 'id' | 'status'>) => string | null
  updateAsset: (id: string, data: Omit<Asset, 'id' | 'status' | 'holder'>) => string | null
  addAssets: (list: Omit<Asset, 'id' | 'status'>[]) => void
  handover: (assetId: string, person: string, note: string) => void
  returnAsset: (assetId: string, note: string) => void
  sendRepair: (assetId: string, note: string) => void
  finishRepair: (assetId: string, note: string) => void
  retire: (assetId: string, note: string) => void
}

const Ctx = createContext<Store>(null!)
export const useStore = () => useContext(Ctx)
const uid = () => Math.random().toString(36).slice(2, 10)
const today = () => new Date().toISOString().slice(0, 10)

async function save(db: DB, token: string, onDenied: () => void, onError: (m: string) => void) {
  try {
    const r = await fetch('/api/db', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(db) })
    if (r.status === 401) return onDenied()
    if (!r.ok) onError(((await r.json().catch(() => ({}))) as { error?: string }).error ?? 'บันทึกข้อมูลไม่สำเร็จ')
  } catch {
    onError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ข้อมูลล่าสุดอาจยังไม่ถูกบันทึก')
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { token, logout } = useAuth()
  const [db, setDb] = useState<DB>({ assets: [], history: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/db', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (r.status === 401) throw 'auth'
        if (!r.ok) throw ((await r.json().catch(() => ({}))) as { error?: string }).error ?? 'โหลดข้อมูลไม่สำเร็จ'
        return r.json()
      })
      .then(setDb)
      .catch((e) => (e === 'auth' ? logout() : setError(typeof e === 'string' ? e : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้')))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const commit = (next: DB) => { setError(''); setDb(next); save(next, token, logout, setError) }

  // เปลี่ยนสถานะ asset พร้อมบันทึกประวัติในครั้งเดียว
  const change = (assetId: string, status: AssetStatus, type: HistoryType, person?: string, note?: string) => {
    const entry: HistoryEntry = { id: uid(), assetId, type, date: today(), person, note }
    commit({
      assets: db.assets.map((a) => (a.id === assetId ? { ...a, status, holder: status === 'in_use' ? person : undefined } : a)),
      history: [...db.history, entry],
    })
  }

  const addAsset: Store['addAsset'] = (data) => {
    if (db.assets.some((a) => a.tag.toLowerCase() === data.tag.toLowerCase())) return 'รหัสทรัพย์สินนี้มีอยู่แล้ว'
    const asset: Asset = { ...data, id: uid(), status: 'available' }
    commit({
      assets: [...db.assets, asset],
      history: [...db.history, { id: uid(), assetId: asset.id, type: 'register', date: today(), note: 'ลงทะเบียนครั้งแรก' }],
    })
    return null
  }

  const addAssets: Store['addAssets'] = (list) => {
    const assets: Asset[] = list.map((d) => ({ ...d, id: uid(), status: 'available' }))
    const history: HistoryEntry[] = assets.map((a) => ({ id: uid(), assetId: a.id, type: 'register', date: today(), note: 'นำเข้าจากไฟล์ CSV' }))
    commit({ assets: [...db.assets, ...assets], history: [...db.history, ...history] })
  }

  const updateAsset: Store['updateAsset'] = (id, data) => {
    const old = db.assets.find((a) => a.id === id)
    if (!old) return 'ไม่พบทรัพย์สิน'
    if (db.assets.some((a) => a.id !== id && a.tag.toLowerCase() === data.tag.toLowerCase())) return 'รหัสทรัพย์สินนี้มีอยู่แล้ว'
    const labels = { tag: 'รหัส', name: 'ชื่อ', category: 'ประเภท', brand: 'ยี่ห้อ', serial: 'Serial', purchaseDate: 'วันที่ซื้อ', price: 'ราคา', warrantyExpiry: 'วันหมดประกัน' } as const
    const changed = (Object.keys(labels) as (keyof typeof labels)[]).filter((k) => old[k] !== data[k]).map((k) => labels[k])
    if (!changed.length) return null
    commit({
      assets: db.assets.map((a) => (a.id === id ? { ...a, ...data } : a)),
      history: [...db.history, { id: uid(), assetId: id, type: 'edit', date: today(), note: `แก้ไข: ${changed.join(', ')}` }],
    })
    return null
  }

  const value: Store = {
    db, loading, error, addAsset, addAssets, updateAsset,
    handover: (id, person, note) => change(id, 'in_use', 'handover', person, note),
    returnAsset: (id, note) => change(id, 'available', 'return', db.assets.find((a) => a.id === id)?.holder, note),
    sendRepair: (id, note) => change(id, 'repair', 'repair_send', undefined, note),
    finishRepair: (id, note) => change(id, 'available', 'repair_done', undefined, note),
    retire: (id, note) => change(id, 'retired', 'retire', undefined, note),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
