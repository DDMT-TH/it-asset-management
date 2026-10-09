import { useState, type FormEvent } from 'react'
import { useStore } from '../store'
import { ActionPanel, AssetPicker, Field, Notice, PageHeader } from '../components'

export default function ReturnAsset() {
  const { db, returnAsset } = useStore()
  const [id, setId] = useState('')
  const [note, setNote] = useState('')
  const [msg, setMsg] = useState('')
  const inUse = db.assets.filter((a) => a.status === 'in_use')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    returnAsset(id, note)
    setMsg('รับคืนแล้ว ทรัพย์สินกลับเป็นสถานะพร้อมใช้งาน')
    setId(''); setNote('')
  }

  return (
    <>
      <PageHeader title="รับคืน Asset" desc="เลือกทรัพย์สินที่ถูกส่งมอบอยู่จากตาราง เพื่อรับคืน" />
      <Notice text={msg} />
      <form onSubmit={submit} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <AssetPicker assets={inUse} value={id} onChange={setId} showHolder emptyText="ไม่มีทรัพย์สินที่รอรับคืน" />
        <ActionPanel title="รายละเอียดการรับคืน" asset={inUse.find((a) => a.id === id)}>
          <Field label="สภาพเครื่อง / หมายเหตุ"><textarea className="input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <button className="btn w-full" disabled={!id}>รับคืน</button>
        </ActionPanel>
      </form>
    </>
  )
}
