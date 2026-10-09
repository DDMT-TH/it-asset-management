export type AssetStatus = 'available' | 'in_use' | 'repair' | 'retired'
export type HistoryType = 'register' | 'handover' | 'return' | 'repair_send' | 'repair_done' | 'edit' | 'retire'

export interface Asset {
  id: string
  tag: string
  name: string
  category: string
  brand: string
  serial: string
  purchaseDate: string
  price?: number
  warrantyExpiry?: string
  status: AssetStatus
  holder?: string
}

export interface HistoryEntry {
  id: string
  assetId: string
  type: HistoryType
  date: string
  person?: string
  note?: string
}

export interface DB { assets: Asset[]; history: HistoryEntry[] }

export const STATUS_LABEL: Record<AssetStatus, string> = {
  available: 'พร้อมใช้งาน', in_use: 'ใช้งานอยู่', repair: 'ส่งซ่อม', retired: 'จำหน่ายออก',
}
export const STATUS_STYLE: Record<AssetStatus, string> = {
  available: 'bg-emerald-50 text-emerald-800', in_use: 'bg-sky-50 text-sky-800',
  repair: 'bg-amber-50 text-amber-800', retired: 'bg-slate-100 text-slate-600',
}
export const HISTORY_LABEL: Record<HistoryType, string> = {
  register: 'ลงทะเบียน', handover: 'ส่งมอบ', return: 'รับคืน', repair_send: 'ส่งซ่อม', repair_done: 'ซ่อมเสร็จ', edit: 'แก้ไขข้อมูล', retire: 'จำหน่ายออก',
}
export const CATEGORIES = ['Notebook', 'Desktop', 'Monitor', 'Printer', 'Network', 'Mobile', 'อื่นๆ']
