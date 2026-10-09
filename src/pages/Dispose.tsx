import { useState, type FormEvent } from 'react'
import { useStore } from '../store'
import { ActionPanel, AssetPicker, Field, Notice, PageHeader } from '../components'

const REASONS = ['เสื่อมสภาพ / หมดอายุการใช้งาน', 'ชำรุด ซ่อมไม่คุ้มค่า', 'สูญหาย', 'ขาย', 'บริจาค', 'อื่นๆ']

export default function Dispose() {
  const { db, retire } = useStore()
  const [id, setId] = useState('')
  const [reason, setReason] = useState(REASONS[0])
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState('')
  // เครื่องที่ถูกส่งมอบอยู่ต้องรับคืนก่อน จึงไม่แสดงในตารางนี้
  const eligible = db.assets.filter((a) => a.status === 'available' || a.status === 'repair')
  const picked = eligible.find((a) => a.id === id)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!picked || !window.confirm(`ยืนยันจำหน่ายออก ${picked.tag} – ${picked.name} ?\nเครื่องจะไม่สามารถส่งมอบหรือส่งซ่อมได้อีก`)) return
    retire(id, note ? `${reason} – ${note}` : reason)
    setMsg(`จำหน่ายออก ${picked.tag} แล้ว`)
    setId(''); setNote(''); setReason(REASONS[0])
  }

  const inUse = db.assets.filter((a) => a.status === 'in_use').length

  return (
    <>
      <PageHeader title="จำหน่ายออก" desc="ตัดทรัพย์สินที่ไม่ใช้งานแล้วออกจากระบบ ข้อมูลและประวัติเดิมจะยังคงอยู่" />
      <Notice text={msg} />
      <form onSubmit={submit} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="min-w-0">
          <AssetPicker assets={eligible} value={id} onChange={setId} showStatus emptyText="ไม่มีทรัพย์สินที่จำหน่ายออกได้" />
          {inUse > 0 && <p className="mt-3 text-sm text-slate-500">มี {inUse} รายการที่กำลังถูกใช้งานอยู่ ต้องรับคืนก่อนจึงจะจำหน่ายออกได้</p>}
        </div>
        <ActionPanel title="รายละเอียดการจำหน่ายออก" asset={picked}>
          <Field label="เหตุผล">
            <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select>
          </Field>
          <Field label="หมายเหตุ"><textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <button className="w-full rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50" disabled={!id}>จำหน่ายออก</button>
        </ActionPanel>
      </form>
    </>
  )
}
