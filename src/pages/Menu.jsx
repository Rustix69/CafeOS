import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ImagePlus, Pencil, Plus, Trash2, UtensilsCrossed, X, Tags } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { useToast } from '../components/common/Toast.jsx'
import PageHeader from '../components/common/PageHeader.jsx'
import SearchInput from '../components/common/SearchInput.jsx'
import DataTable from '../components/common/DataTable.jsx'
import Button from '../components/common/Button.jsx'
import Modal from '../components/common/Modal.jsx'
import Tabs from '../components/common/Tabs.jsx'
import ProductImage from '../components/common/ProductImage.jsx'
import ConfirmDialog from '../components/common/ConfirmDialog.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import StatusBadge from '../components/common/StatusBadge.jsx'
import { Field, Input, Select, Textarea, Toggle, Card } from '../components/common/Form.jsx'
import { cn, inr, uid } from '../utils/formatters.js'

const blank = (cat) => ({ id: '', name: '', category: cat, price: '', gst: 5, veg: true, desc: '', image: '', available: true, variants: [], addons: [] })

function resizeImage(file, max = 360) {
  return new Promise((resolve) => {
    const fr = new FileReader()
    fr.onload = () => {
      const img = new Image()
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL('image/jpeg', 0.8))
      }
      img.src = fr.result
    }
    fr.readAsDataURL(file)
  })
}

function ProductForm({ item, categories, onClose, onSave }) {
  const [f, setF] = useState(item)
  const [err, setErr] = useState({})
  const file = useRef(null)
  const set = (p) => setF((x) => ({ ...x, ...p }))
  const submit = () => {
    const e = {}
    if (!f.name.trim()) e.name = 'Name is required'
    if (!(Number(f.price) > 0)) e.price = 'Enter a valid price'
    setErr(e)
    if (Object.keys(e).length) return
    onSave({ ...f, id: f.id || uid('m'), name: f.name.trim(), price: Number(f.price), gst: Number(f.gst), variants: f.variants.filter((v) => v.name.trim()).map((v) => ({ name: v.name.trim(), delta: Number(v.delta) || 0 })), addons: f.addons.filter((a) => a.name.trim()).map((a) => ({ name: a.name.trim(), price: Number(a.price) || 0 })) })
  }
  const list = (key, shape, label, valKey, valLabel) => (
    <div>
      <div className="mb-2 flex items-center justify-between"><h4 className="text-[13px] font-bold">{label}</h4><Button variant="ghost" size="xs" icon={Plus} onClick={() => set({ [key]: [...f[key], shape] })}>Add</Button></div>
      {f[key].length === 0 ? <p className="rounded-lg border border-dashed py-3 text-center text-xs text-muted-foreground">None added</p> : (
        <div className="space-y-2">{f[key].map((row, i) => (
          <div key={i} className="flex gap-2"><Input placeholder="Name" value={row.name} onChange={(e) => set({ [key]: f[key].map((r, j) => (j === i ? { ...r, name: e.target.value } : r)) })} /><Input className="w-28" type="number" placeholder={valLabel} value={row[valKey]} onChange={(e) => set({ [key]: f[key].map((r, j) => (j === i ? { ...r, [valKey]: e.target.value } : r)) })} /><Button variant="ghost" size="icon" onClick={() => set({ [key]: f[key].filter((_, j) => j !== i) })}><X className="size-4" /></Button></div>
        ))}</div>
      )}
    </div>
  )
  return (
    <Modal open onClose={onClose} size="lg" title={item.id ? 'Edit product' : 'Add new product'} description="Changes reflect immediately in the Point of Sale."
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit}>{item.id ? 'Save changes' : 'Add product'}</Button></>}>
      <div className="grid gap-5 md:grid-cols-[180px_1fr]">
        <div>
          <ProductImage item={f.name ? f : { ...f, name: 'New' }} className="aspect-square w-full rounded-xl border" />
          <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const fl = e.target.files?.[0]; if (fl) set({ image: await resizeImage(fl) }); e.target.value = '' }} />
          <div className="mt-2 grid gap-1.5"><Button variant="outline" size="sm" icon={ImagePlus} onClick={() => file.current.click()}>{f.image ? 'Change image' : 'Upload image'}</Button>{f.image && <Button variant="ghost" size="sm" onClick={() => set({ image: '' })}>Remove</Button>}</div>
        </div>
        <div className="space-y-3.5">
          <Field label="Product name" required error={err.name}><Input value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Hazelnut Latte" autoFocus /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Category"><Select value={f.category} onChange={(e) => set({ category: e.target.value })} options={categories} /></Field><Field label="Price (₹)" required error={err.price}><Input type="number" min="0" value={f.price} onChange={(e) => set({ price: e.target.value })} /></Field></div>
          <div className="grid grid-cols-2 gap-3"><Field label="GST rate"><Select value={f.gst} onChange={(e) => set({ gst: e.target.value })} options={[{ value: 0, label: '0% (exempt)' }, { value: 5, label: '5%' }, { value: 12, label: '12%' }, { value: 18, label: '18%' }]} /></Field><Field label="Food type"><Select value={f.veg ? 'veg' : 'non'} onChange={(e) => set({ veg: e.target.value === 'veg' })} options={[{ value: 'veg', label: 'Vegetarian' }, { value: 'non', label: 'Non-vegetarian' }]} /></Field></div>
          <Field label="Description"><Textarea rows={2} value={f.desc} onChange={(e) => set({ desc: e.target.value })} placeholder="Short description shown on POS" /></Field>
        </div>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {list('variants', { name: '', delta: 0 }, 'Variants / sizes', 'delta', '± Price')}
        {list('addons', { name: '', price: 0 }, 'Add-ons', 'price', 'Price')}
      </div>
      <div className="mt-5 rounded-lg border p-3.5"><Toggle checked={f.available} onChange={(v) => set({ available: v })} label="Available for sale" desc="Turn off to hide the item from ordering without deleting it." /></div>
    </Modal>
  )
}

export default function Menu() {
  const { menu, categories, actions } = useStore()
  const toast = useToast()
  const [params] = useSearchParams()
  const [tab, setTab] = useState('products')
  const [q, setQ] = useState(params.get('q') || '')
  const [cat, setCat] = useState('all')
  const [edit, setEdit] = useState(null)
  const [del, setDel] = useState(null)
  const [catModal, setCatModal] = useState(null)
  const [catName, setCatName] = useState('')
  const [catDel, setCatDel] = useState(null)

  const rows = useMemo(() => menu.filter((m) => (cat === 'all' || m.category === cat) && (!q || m.name.toLowerCase().includes(q.toLowerCase()))), [menu, cat, q])
  const cols = [
    { key: 'name', header: 'Product', render: (m) => (
      <div className="flex items-center gap-3"><ProductImage item={m} className="size-11 shrink-0 rounded-lg" /><div className="min-w-0"><p className="flex items-center gap-1.5 font-bold"><span className={cn('size-2 rounded-full', m.veg ? 'bg-primary' : 'bg-destructive')} />{m.name}</p><p className="max-w-[260px] truncate text-xs text-muted-foreground">{m.desc || '—'}</p></div></div>) },
    { key: 'category', header: 'Category', hideBelow: 'md', render: (m) => <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold">{m.category}</span> },
    { key: 'price', header: 'Price', align: 'right', render: (m) => <span className="tnum font-bold">{inr(m.price)}</span> },
    { key: 'gst', header: 'GST', hideBelow: 'lg', align: 'right', render: (m) => <span className="tnum text-muted-foreground">{m.gst}%</span> },
    { key: 'variants', header: 'Variants', hideBelow: 'xl', sortable: false, render: (m) => <span className="text-muted-foreground">{m.variants.length ? m.variants.map((v) => v.name).join(', ') : '—'}</span> },
    { key: 'addons', header: 'Add-ons', hideBelow: 'xl', sortValue: (m) => m.addons.length, render: (m) => <span className="text-muted-foreground">{m.addons.length || '—'}</span> },
    { key: 'available', header: 'Available', align: 'center', sortValue: (m) => +m.available, render: (m) => <div className="flex justify-center" onClick={(e) => e.stopPropagation()}><Toggle checked={m.available} onChange={() => { actions.toggleAvailability(m.id); toast(`${m.name} ${m.available ? 'disabled' : 'enabled'}`, { type: 'info', duration: 1800 }) }} /></div> },
    { key: 'actions', header: '', sortable: false, align: 'right', render: (m) => <div className="flex justify-end gap-0.5" onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon-sm" onClick={() => setEdit(m)}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10" onClick={() => setDel(m)}><Trash2 className="size-4" /></Button></div> },
  ]
  const saveCat = () => {
    const n = catName.trim(); if (!n) return
    if (categories.some((c) => c.toLowerCase() === n.toLowerCase() && c !== catModal.name)) { toast('Category already exists', { type: 'error' }); return }
    catModal.name ? actions.renameCategory(catModal.name, n) : actions.addCategory(n); setCatModal(null)
  }

  return (
    <>
      <PageHeader title="Menu Management" description={`${menu.length} products across ${categories.length} categories · ${menu.filter((m) => !m.available).length} unavailable`}
        actions={<><Button variant="outline" icon={Tags} onClick={() => { setCatName(''); setCatModal({ name: '' }) }}>Add category</Button><Button icon={Plus} onClick={() => setEdit(blank(categories[0]))}>Add product</Button></>} />
      <Tabs className="mb-4" value={tab} onChange={setTab} tabs={[{ value: 'products', label: 'Products', count: menu.length }, { value: 'categories', label: 'Categories', count: categories.length }]} />
      {tab === 'products' ? (<>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search products…" className="w-full sm:w-72" />
          <div className="w-44"><Select value={cat} onChange={(e) => setCat(e.target.value)} options={[{ value: 'all', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))]} /></div>
        </div>
        <DataTable columns={cols} rows={rows} pageSize={10} onRowClick={setEdit} empty={<EmptyState icon={UtensilsCrossed} title="No products found" message="Try another search, or add a new product." action={<Button icon={Plus} onClick={() => setEdit(blank(categories[0]))}>Add product</Button>} />} />
      </>) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => { const items = menu.filter((m) => m.category === c); return (
            <Card key={c} className="p-4">
              <div className="flex items-start justify-between"><div><h3 className="text-[15px] font-bold">{c}</h3><p className="text-xs text-muted-foreground">{items.length} product{items.length !== 1 && 's'} · {items.filter((m) => !m.available).length} unavailable</p></div>
                <div className="flex gap-0.5"><Button variant="ghost" size="icon-sm" onClick={() => { setCatName(c); setCatModal({ name: c }) }}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10" onClick={() => setCatDel(c)}><Trash2 className="size-4" /></Button></div></div>
              <div className="mt-3 flex -space-x-2">{items.slice(0, 5).map((m) => <ProductImage key={m.id} item={m} className="size-9 rounded-full border-2 border-card" />)}{items.length > 5 && <span className="grid size-9 place-items-center rounded-full border-2 border-card bg-muted text-xs font-bold">+{items.length - 5}</span>}</div>
              <Button variant="soft" size="sm" className="mt-3.5 w-full" onClick={() => { setCat(c); setTab('products') }}>View products</Button>
            </Card>) })}
          <button onClick={() => { setCatName(''); setCatModal({ name: '' }) }} className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"><Plus className="size-5" />New category</button>
        </div>
      )}
      {edit && <ProductForm item={{ ...edit, price: edit.price }} categories={categories} onClose={() => setEdit(null)} onSave={(m) => { actions.saveMenuItem(m); setEdit(null) }} />}
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} title={`Delete ${del?.name}?`} message="This product will be removed from the menu and the POS. Past orders are not affected." confirmLabel="Delete product" onConfirm={() => actions.deleteMenuItem(del.id)} />
      <Modal open={!!catModal} onClose={() => setCatModal(null)} size="sm" title={catModal?.name ? 'Rename category' : 'New category'} footer={<><Button variant="outline" onClick={() => setCatModal(null)}>Cancel</Button><Button onClick={saveCat}>Save</Button></>}>
        <Field label="Category name"><Input autoFocus value={catName} onChange={(e) => setCatName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveCat()} placeholder="e.g. Breakfast" /></Field>
      </Modal>
      <ConfirmDialog open={!!catDel} onClose={() => setCatDel(null)} title={`Delete category "${catDel}"?`} message={menu.some((m) => m.category === catDel) ? `This category still has ${menu.filter((m) => m.category === catDel).length} product(s). They will stay in the menu but need a new category.` : 'This empty category will be removed.'} confirmLabel="Delete category" onConfirm={() => actions.deleteCategory(catDel)} />
    </>
  )
}
