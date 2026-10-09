import { useRef, useState, type FormEvent } from 'react'
import { useStore } from '../store'
import { Empty, Field, Notice, PageHeader, Pagination, StatusBadge, WarrantyBadge } from '../components'
import { CATEGORIES, STATUS_LABEL, type Asset, type AssetStatus } from '../types'
import ImportPanel from './ImportPanel'

const today = () => new Date().toISOString().slice(0, 10)
const blank = () => ({ tag: '', name: '', category: CATEGORIES[0], brand: '', serial: '', purchaseDate: today(), price: '', warrantyExpiry: '' })
const fromAsset = (a: Asset) => ({
  tag: a.tag, name: a.name, category: a.category, brand: a.brand, serial: a.serial,
  purchaseDate: a.purchaseDate, price: a.price === undefined ? '' : String(a.price), warrantyExpiry: a.warrantyExpiry ?? '',
})

const Section = ({ title }: { title: string }) => (
  <h3 className="border-b border-line pb-1.5 text-xs font-semibold tracking-wide text-slate-500">{title}</h3>
)

export default function RegisterAsset() {
  const { db, addAsset, updateAsset } = useStore()
  const [tab, setTab] = useState<'single' | 'csv'>('single')
  const [f, setF] = useState(blank())
  const [editId, setEditId] = useState('')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [st, setSt] = useState<AssetStatus | ''>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const set = (k: keyof ReturnType<typeof blank>) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const editing = db.assets.find((a) => a.id === editId)

  const startEdit = (a: Asset) => {
    setEditId(a.id); setF(fromAsset(a)); setErr(''); setMsg('')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) // จอเล็ก: เลื่อนไปที่ฟอร์ม
  }
  const reset = () => { setEditId(''); setF(blank()); setErr('') }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (f.warrantyExpiry && f.warrantyExpiry < f.purchaseDate) return setErr('วันหมดประกันต้องไม่ก่อนวันที่ซื้อ')
    const data = { ...f, price: f.price === '' ? undefined : Number(f.price), warrantyExpiry: f.warrantyExpiry || undefined }
    const error = editId ? updateAsset(editId, data) : addAsset(data)
    setErr(error ?? '')
    if (!error) { setMsg(editId ? `บันทึกการแก้ไข ${f.tag} แล้ว` : `ลงทะเบียน ${f.tag} แล้ว`); reset() }
  }

  const categories = [...new Set(db.assets.map((a) => a.category))]
  const rows = db.assets.filter((a) =>
    (!cat || a.category === cat) && (!st || a.status === st) &&
    [a.tag, a.name, a.serial, a.brand, a.category].join(' ').toLowerCase().includes(q.toLowerCase()))
  const filtered = q || cat || st
  const curPage = Math.min(page, Math.max(1, Math.ceil(rows.length / pageSize)))
  const pageRows = rows.slice((curPage - 1) * pageSize, curPage * pageSize)
  const tabCls = (t: string) => `border-b-2 px-4 py-2 text-sm font-medium ${tab === t ? 'border-brand text-brand' : 'border-transparent text-slate-500 hover:text-ink'}`

  return (
    <>
      <PageHeader title="ลงทะเบียน Asset" desc="เพิ่มทรัพย์สินใหม่ แก้ไขข้อมูลเดิม หรือนำเข้าหลายรายการจากไฟล์ CSV" />
      <div role="tablist" className="mb-5 flex border-b border-line">
        <button role="tab" aria-selected={tab === 'single'} className={tabCls('single')} onClick={() => { setTab('single'); setMsg('') }}>ลงทะเบียน / แก้ไข</button>
        <button role="tab" aria-selected={tab === 'csv'} className={tabCls('csv')} onClick={() => { setTab('csv'); setMsg('') }}>Import จาก CSV</button>
      </div>

      {tab === 'csv' ? <ImportPanel /> : (
        <>
          <Notice text={msg} />
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
            {/* ===== รายการทรัพย์สิน ===== */}
            <section className="card min-w-0 overflow-hidden">
              <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[minmax(0,1fr)_10rem_10rem]">
                <input className="input" placeholder="ค้นหา รหัส ชื่อ ยี่ห้อ Serial" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
                <select aria-label="กรองตามประเภท" className="input" value={cat} onChange={(e) => { setCat(e.target.value); setPage(1) }}>
                  <option value="">ทุกประเภท</option>{categories.map((c) => <option key={c}>{c}</option>)}
                </select>
                <select aria-label="กรองตามสถานะ" className="input" value={st} onChange={(e) => { setSt(e.target.value as AssetStatus | ''); setPage(1) }}>
                  <option value="">ทุกสถานะ</option>
                  {(Object.keys(STATUS_LABEL) as AssetStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2 text-xs text-slate-500">
                <span>{filtered ? `พบ ${rows.length} จาก ${db.assets.length} รายการ` : `ทั้งหมด ${db.assets.length} รายการ`}</span>
                {filtered && <button type="button" className="font-medium text-brand hover:underline" onClick={() => { setQ(''); setCat(''); setSt(''); setPage(1) }}>ล้างตัวกรอง</button>}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-line text-left text-xs font-medium text-slate-500">
                    <tr>
                      <th className="px-4 py-3">ทรัพย์สิน</th><th className="px-3">ประเภท</th><th className="px-3">Serial / วันที่ซื้อ</th>
                      <th className="px-3 text-right">ราคา (บาท)</th><th className="px-3">หมดประกัน</th><th className="px-3">สถานะ</th><th className="px-4"><span className="sr-only">จัดการ</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {pageRows.map((a) => (
                      <tr key={a.id} className={a.id === editId ? 'bg-brand/10' : 'hover:bg-slate-50'}>
                        <td className="px-4 py-3.5"><div className="font-semibold">{a.tag}</div><div className="text-slate-600">{a.name}</div></td>
                        <td className="px-3"><div>{a.category}</div><div className="text-xs text-slate-500">{a.brand || '-'}</div></td>
                        <td className="px-3"><div>{a.serial}</div><div className="text-xs text-slate-500">{a.purchaseDate}</div></td>
                        <td className="whitespace-nowrap px-3 text-right tabular-nums">{a.price !== undefined ? a.price.toLocaleString('th-TH') : '-'}</td>
                        <td className="px-3"><WarrantyBadge date={a.warrantyExpiry} /></td>
                        <td className="px-3"><StatusBadge status={a.status} /></td>
                        <td className="px-4 text-right">
                          <button type="button" aria-label={`แก้ไข ${a.tag}`} onClick={() => startEdit(a)}
                            className="rounded-md border border-line px-3 py-1 text-xs font-medium text-brand hover:border-brand hover:bg-brand/5">แก้ไข</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length === 0 && <Empty text={db.assets.length ? 'ไม่พบรายการที่ตรงกับเงื่อนไข' : 'ยังไม่มีทรัพย์สิน'} />}
              </div>
              <Pagination page={curPage} pageSize={pageSize} total={rows.length} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1) }} />
            </section>

            {/* ===== ฟอร์ม ===== */}
            <form ref={formRef} onSubmit={submit} className="card overflow-hidden scroll-mt-6 xl:sticky xl:top-8">
              <div className={`flex items-center justify-between gap-3 border-b border-line px-5 py-4 ${editing ? 'bg-brand/5' : ''}`}>
                <div>
                  <h2 className="text-lg font-semibold">{editing ? `แก้ไข ${editing.tag}` : 'ลงทะเบียนใหม่'}</h2>
                  <p className="text-xs text-slate-500">{editing ? 'ปรับข้อมูลแล้วกดบันทึก' : 'กรอกข้อมูลทรัพย์สินที่ต้องการเพิ่ม'}</p>
                </div>
                {editing && <StatusBadge status={editing.status} />}
              </div>

              <div className="grid gap-5 p-5">
                {err && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

                <div className="grid gap-3">
                  <Section title="ข้อมูลทั่วไป" />
                  <Field label="รหัสทรัพย์สิน"><input required className="input" value={f.tag} onChange={set('tag')} placeholder="เช่น NB-0002" /></Field>
                  <Field label="ชื่อทรัพย์สิน"><input required className="input" value={f.name} onChange={set('name')} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="ประเภท"><select className="input" value={f.category} onChange={set('category')}>{[...new Set([...CATEGORIES, f.category])].map((c) => <option key={c}>{c}</option>)}</select></Field>
                    <Field label="ยี่ห้อ"><input className="input" value={f.brand} onChange={set('brand')} /></Field>
                  </div>
                  <Field label="Serial Number"><input required className="input" value={f.serial} onChange={set('serial')} /></Field>
                </div>

                <div className="grid gap-3">
                  <Section title="การซื้อและประกัน" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="วันที่ซื้อ"><input type="date" required className="input" value={f.purchaseDate} onChange={set('purchaseDate')} /></Field>
                    <Field label="วันหมดประกัน"><input type="date" className="input" value={f.warrantyExpiry} onChange={set('warrantyExpiry')} /></Field>
                  </div>
                  <Field label="ราคา (บาท)"><input type="number" min="0" step="0.01" className="input" value={f.price} onChange={set('price')} placeholder="0.00" /></Field>
                </div>
              </div>

              <div className="border-t border-line bg-slate-50 px-5 py-4">
                <div className="flex gap-2">
                  <button className="btn flex-1">{editing ? 'บันทึกการแก้ไข' : 'บันทึกทรัพย์สิน'}</button>
                  {editing && <button type="button" className="rounded-md border border-line bg-white px-4 py-2 text-sm hover:bg-paper" onClick={reset}>ยกเลิก</button>}
                </div>
                {editing && <p className="mt-3 text-xs text-slate-500">สถานะและผู้ถือครองเปลี่ยนผ่านเมนูส่งมอบ / รับคืน / ส่งซ่อม การแก้ไขจะถูกบันทึกในประวัติ</p>}
              </div>
            </form>
          </div>
        </>
      )}
    </>
  )
}
