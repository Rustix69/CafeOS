import { useMemo, useState } from 'react'
import { Download, FileText, IndianRupee, Percent, ReceiptText, RotateCcw, ShoppingBag, Tag } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import { useToast } from '../components/common/Toast.jsx'
import PageHeader from '../components/common/PageHeader.jsx'
import StatCard from '../components/common/StatCard.jsx'
import Button from '../components/common/Button.jsx'
import { Card, CardHeader, Input, Segmented } from '../components/common/Form.jsx'
import { Donut, Legend, LineTrend, PALETTE, RevenueChart, SalesBars } from '../components/charts/charts.jsx'
import { daysInRange, rangeBounds, sumDays, topProducts } from '../utils/analytics.js'
import { DAY, delta, downloadCSV, fmtDate, fmtShortDate, inr, inr2, isoDay, num } from '../utils/formatters.js'

const RANGES = [{ value: 'today', label: 'Today' }, { value: 'yesterday', label: 'Yesterday' }, { value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }, { value: 'custom', label: 'Custom' }]
const hourLabel = (h) => (h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`)

export default function Reports() {
  const { orders, history, menu } = useStore()
  const toast = useToast()
  const [range, setRange] = useState('7d')
  const [custom, setCustom] = useState({ start: isoDay(Date.now() - 13 * DAY), end: isoDay(Date.now()) })
  const [start, end] = rangeBounds(range, custom)
  const nDays = Math.round((end - start) / DAY) + 1

  const days = useMemo(() => daysInRange(start, end, history, orders), [start, end, history, orders])
  const prevDays = useMemo(() => daysInRange(start - nDays * DAY, start - DAY, history, orders), [start, nDays, history, orders])
  const s = useMemo(() => sumDays(days), [days])
  const p = useMemo(() => sumDays(prevDays), [prevDays])
  const single = days.length === 1
  const trend = days.map((d) => ({ label: fmtShortDate(d.ts), revenue: d.revenue, orders: d.orders, aov: d.orders ? Math.round(d.revenue / d.orders) : 0 }))
  const hourly = s.hourly.map((v, h) => ({ label: hourLabel(h), value: v, h })).filter((x) => x.h >= 7 && x.h <= 23)
  const hourlyOrd = s.hourlyOrders.map((v, h) => ({ label: hourLabel(h), value: v, h })).filter((x) => x.h >= 7 && x.h <= 23)
  const peak = hourly.reduce((a, b) => (b.value > a.value ? b : a), hourly[0])
  const pay = [{ name: 'UPI', value: s.payments.upi, color: PALETTE[0] }, { name: 'Cash', value: s.payments.cash, color: PALETTE[1] }, { name: 'Card', value: s.payments.card, color: PALETTE[2] }, { name: 'Split', value: s.payments.split, color: PALETTE[4] }]
  const cats = Object.entries(s.byCategory).sort((a, b) => b[1] - a[1]).map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }))
  const best = topProducts(s.byProduct, menu, 8)
  const net = s.revenue - s.refunds
  const taxable = s.revenue - s.tax
  const types = [{ name: 'Dine-in', value: s.dineIn, color: PALETTE[0] }, { name: 'Takeaway', value: s.takeaway, color: PALETTE[1] }, { name: 'Delivery', value: s.delivery, color: PALETTE[2] }]
  const label = RANGES.find((r) => r.value === range).label

  const exportCsv = () => {
    downloadCSV(`cafeos-report-${isoDay(start)}_${isoDay(end)}.csv`, [
      ['CafeOS sales report', `${fmtDate(start)} – ${fmtDate(end)}`], [],
      ['Date', 'Orders', 'Revenue', 'Avg order value', 'Tax', 'Discounts', 'Refunds'],
      ...days.map((d) => [d.date, d.orders, d.revenue, d.orders ? Math.round(d.revenue / d.orders) : 0, d.tax, d.discounts, d.refunds]), [],
      ['Totals', s.orders, s.revenue, Math.round(s.aov), Math.round(s.tax), Math.round(s.discounts), s.refunds], [],
      ['Product', 'Category', 'Units sold', 'Est. revenue'], ...topProducts(s.byProduct, menu, 50).map((b) => [b.name, b.category, b.qty, b.revenue]), [],
      ['Payment method', 'Amount'], ...pay.map((x) => [x.name, x.value]),
    ])
    toast('CSV report downloaded')
  }
  const exportPdf = () => {
    toast('Preparing PDF report…', { type: 'info', desc: 'Choose “Save as PDF” in the print dialog.' })
    document.body.classList.add('print-report')
    setTimeout(() => { window.print(); document.body.classList.remove('print-report') }, 350)
  }

  return (
    <>
      <PageHeader title="Reports & Analytics" description={`${label} · ${fmtDate(start)}${single ? '' : ' – ' + fmtDate(end)}`}
        actions={<><Button variant="outline" icon={Download} onClick={exportCsv}>Export CSV</Button><Button variant="outline" icon={FileText} onClick={exportPdf}>Export PDF</Button></>}>
        <div className="no-print flex w-full flex-wrap items-center gap-3"><div className="no-scrollbar max-w-full overflow-x-auto"><Segmented value={range} onChange={setRange} options={RANGES} size="lg" /></div>
          {range === 'custom' && <div className="flex items-center gap-2"><Input type="date" className="w-40" value={custom.start} max={custom.end} onChange={(e) => setCustom({ ...custom, start: e.target.value })} /><span className="text-muted-foreground">to</span><Input type="date" className="w-40" value={custom.end} min={custom.start} max={isoDay(Date.now())} onChange={(e) => setCustom({ ...custom, end: e.target.value })} /></div>}</div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Revenue" value={inr(s.revenue)} icon={IndianRupee} change={delta(s.revenue, p.revenue)} hint="vs prev." />
        <StatCard label="Orders" value={num(s.orders)} icon={ShoppingBag} tone="secondary" change={delta(s.orders, p.orders)} hint="vs prev." />
        <StatCard label="Avg. Order Value" value={inr(s.aov)} icon={ReceiptText} tone="accent" change={delta(s.aov, p.aov)} hint="vs prev." />
        <StatCard label="Tax Collected" value={inr(s.tax)} icon={Percent} tone="secondary" hint="GST (CGST + SGST)" />
        <StatCard label="Discounts" value={inr(s.discounts)} icon={Tag} tone="warning" hint={`${((s.discounts / (s.revenue + s.discounts || 1)) * 100).toFixed(1)}% of gross`} />
        <StatCard label="Refunds" value={inr(s.refunds)} icon={RotateCcw} tone="danger" hint={`${((s.refunds / (s.revenue || 1)) * 100).toFixed(1)}% of sales`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader title={single ? 'Sales by hour' : 'Sales trend'} desc={single ? 'Revenue through the day' : 'Daily revenue including GST'} />
          <div className="px-2 pb-3 pt-2 sm:px-4">{single ? <RevenueChart data={hourly} xKey="label" yKey="value" /> : <RevenueChart data={trend} />}</div></Card>
        <Card><CardHeader title="Revenue overview" desc="From gross sales to net" />
          <dl className="space-y-2.5 px-4 pb-4 pt-3 text-[13px]">
            {[['Taxable sales', taxable], ['GST collected', s.tax], ['Gross revenue', s.revenue]].map(([k, v], i) => <div key={k} className={`flex justify-between ${i === 2 ? 'border-t pt-2.5 font-bold' : ''}`}><dt className="text-muted-foreground">{k}</dt><dd className="tnum font-semibold text-foreground">{inr(v)}</dd></div>)}
            <div className="flex justify-between"><dt className="text-muted-foreground">Refunds</dt><dd className="tnum font-semibold text-destructive">−{inr(s.refunds)}</dd></div>
            <div className="flex justify-between rounded-lg bg-primary/8 px-3 py-2.5 text-sm font-extrabold"><dt>Net revenue</dt><dd className="tnum text-primary">{inr(net)}</dd></div>
            <div className="flex justify-between text-xs text-muted-foreground"><dt>Discounts given (not in revenue)</dt><dd className="tnum">{inr(s.discounts)}</dd></div>
          </dl></Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card><CardHeader title="Order volume" desc={single ? 'Orders per hour' : 'Orders per day'} />
          <div className="px-2 pb-3 pt-2 sm:px-4"><SalesBars data={single ? hourlyOrd : trend.map((d) => ({ label: d.label, value: d.orders }))} color="var(--chart-2)" /></div></Card>
        <Card><CardHeader title="Average order value" desc={single ? 'Selected day' : 'Daily average bill'} action={<p className="tnum text-lg font-extrabold">{inr(s.aov)}</p>} />
          <div className="px-2 pb-3 pt-2 sm:px-4">{single ? <div className="grid h-[220px] place-items-center text-center text-[13px] text-muted-foreground"><div><p className="tnum text-4xl font-extrabold text-foreground">{inr(s.aov)}</p><p className="mt-1">{num(s.orders)} orders · {inr(s.revenue)}</p></div></div> : <LineTrend data={trend} lines={[{ key: 'aov', name: 'Avg. order value' }]} />}</div></Card>
        <Card><CardHeader title="Payment methods" desc="Collected by mode" />
          <div className="px-4 pb-4 pt-2"><Donut data={pay} money height={160} /><div className="mt-3"><Legend data={pay} money /></div></div></Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader title="Hourly sales distribution" desc={`Peak hour: ${peak?.label?.replace('a', ' AM').replace('p', ' PM')} · ${inr(peak?.value || 0)}`} />
          <div className="px-2 pb-3 pt-2 sm:px-4"><SalesBars data={hourly} money color="var(--chart-3)" highlight={hourly.indexOf(peak)} /></div></Card>
        <Card><CardHeader title="Category-wise sales" />
          <div className="px-4 pb-4 pt-2"><Donut data={cats} money height={160} /><div className="mt-3"><Legend data={cats} money /></div></div></Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader title="Best-selling products" desc="Top 8 by units sold" />
          <div className="scroll-thin overflow-x-auto px-2 pb-2 pt-2"><table className="w-full min-w-[480px] text-[13px]"><thead><tr className="text-left text-xs text-muted-foreground"><th className="px-3 py-2 font-semibold">#</th><th className="px-3 py-2 font-semibold">Product</th><th className="px-3 py-2 font-semibold">Category</th><th className="px-3 py-2 text-right font-semibold">Units</th><th className="px-3 py-2 text-right font-semibold">Revenue</th><th className="w-32 px-3 py-2 font-semibold">Share</th></tr></thead>
            <tbody>{best.map((b, i) => <tr key={b.id} className="border-t"><td className="tnum px-3 py-2.5 text-muted-foreground">{i + 1}</td><td className="px-3 py-2.5 font-bold">{b.name}</td><td className="px-3 py-2.5 text-muted-foreground">{b.category}</td><td className="tnum px-3 py-2.5 text-right font-semibold">{num(b.qty)}</td><td className="tnum px-3 py-2.5 text-right font-bold">{inr(b.revenue)}</td><td className="px-3 py-2.5"><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(b.qty / best[0].qty) * 100}%` }} /></div></td></tr>)}</tbody></table></div></Card>
        <div className="space-y-4">
          <Card><CardHeader title="Tax collection" desc="GST slab summary" />
            <table className="mt-2 w-full text-[13px]"><thead><tr className="text-left text-xs text-muted-foreground"><th className="px-4 py-1.5 font-semibold">Component</th><th className="px-4 py-1.5 text-right font-semibold">Amount</th></tr></thead>
              <tbody><tr className="border-t"><td className="px-4 py-2.5">Taxable value</td><td className="tnum px-4 py-2.5 text-right font-semibold">{inr2(taxable)}</td></tr><tr className="border-t"><td className="px-4 py-2.5">CGST @ 2.5%</td><td className="tnum px-4 py-2.5 text-right font-semibold">{inr2(s.tax / 2)}</td></tr><tr className="border-t"><td className="px-4 py-2.5">SGST @ 2.5%</td><td className="tnum px-4 py-2.5 text-right font-semibold">{inr2(s.tax / 2)}</td></tr><tr className="border-t bg-muted/30"><td className="px-4 py-2.5 font-bold">Total GST</td><td className="tnum px-4 py-2.5 text-right font-extrabold">{inr2(s.tax)}</td></tr></tbody></table></Card>
          <Card><CardHeader title="Order channels" /><div className="px-4 pb-4 pt-3"><Legend data={types} /></div></Card>
        </div>
      </div>
    </>
  )
}
