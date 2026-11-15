import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ChefHat, Clock, IndianRupee, ReceiptText, ShoppingBag, Table2, TrendingUp, Plus } from 'lucide-react'
import { useStore } from '../context/StoreContext.jsx'
import PageHeader from '../components/common/PageHeader.jsx'
import StatCard from '../components/common/StatCard.jsx'
import Button from '../components/common/Button.jsx'
import StatusBadge from '../components/common/StatusBadge.jsx'
import { Card, CardHeader } from '../components/common/Form.jsx'
import { Donut, Legend, RevenueChart, SalesBars, PALETTE } from '../components/charts/charts.jsx'
import { dayAggregate, isToday, topProducts } from '../utils/analytics.js'
import { delta, fmtTime, inr, mmss, num, startOfDay } from '../utils/formatters.js'

export default function Overview() {
  const { orders, history, menu, tables, me } = useStore()
  const nav = useNavigate()
  const today = useMemo(() => dayAggregate(orders.filter((o) => isToday(o.createdAt))), [orders])
  const yest = history[history.length - 1]
  const week = useMemo(() => {
    const days = [...history.slice(-6), { ...today, ts: startOfDay() }]
    return days.map((d, i) => ({ label: i === 6 ? 'Today' : new Date(d.ts).toLocaleDateString('en-IN', { weekday: 'short' }), revenue: d.revenue, orders: d.orders }))
  }, [history, today])
  const aov = today.orders ? today.revenue / today.orders : 0
  const pending = orders.filter((o) => o.status === 'pending').length
  const occupied = tables.filter((t) => t.status === 'occupied' && !t.mergedInto).length
  const type = [{ name: 'Dine-in', value: today.dineIn, color: PALETTE[0] }, { name: 'Takeaway', value: today.takeaway, color: PALETTE[1] }, { name: 'Delivery', value: today.delivery, color: PALETTE[2] }]
  const best = topProducts(today.byProduct, menu, 5)
  const maxQ = best[0]?.qty || 1
  const cats = Object.entries(today.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value], i) => ({ name, value, color: PALETTE[i] }))
  const catTotal = cats.reduce((s, c) => s + c.value, 0)
  const live = ['pending', 'preparing', 'ready'].map((s) => ({ s, n: orders.filter((o) => o.status === s).length }))
  const recent = orders.filter((o) => o.status !== 'cancelled').slice(0, 7).sort((a, b) => b.createdAt - a.createdAt)
  const liveList = orders.filter((o) => ['pending', 'preparing', 'ready'].includes(o.status)).sort((a, b) => a.createdAt - b.createdAt).slice(0, 5)
  const hr = new Date().getHours()

  return (
    <>
      <PageHeader title={`Good ${hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening'}, ${me.name.split(' ')[0]}`} description="Here's how The Coffee House is performing today."
        actions={<><Button variant="outline" icon={TrendingUp} onClick={() => nav('/reports')}>View reports</Button><Button icon={Plus} onClick={() => nav('/pos')}>New order</Button></>} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Today's Revenue" value={inr(today.revenue)} icon={IndianRupee} change={delta(today.revenue, yest.revenue * 0.78)} hint="vs same time yesterday" />
        <StatCard label="Total Orders" value={num(today.orders)} icon={ShoppingBag} tone="secondary" change={delta(today.orders, yest.orders * 0.8)} hint="vs yesterday" />
        <StatCard label="Average Order Value" value={inr(aov)} icon={ReceiptText} tone="accent" change={delta(aov, yest.revenue / yest.orders)} hint="vs yesterday" />
        <StatCard label="Active Tables" value={`${occupied}/${tables.length}`} icon={Table2} tone="secondary" hint={`${tables.filter((t) => t.status === 'reserved').length} reserved`} />
        <StatCard label="Pending Orders" value={pending} icon={Clock} tone="warning" hint="awaiting kitchen" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue — last 7 days" desc="Daily gross sales including GST" action={<div className="text-right"><p className="tnum text-lg font-extrabold">{inr(week.reduce((s, d) => s + d.revenue, 0))}</p><p className="text-xs text-muted-foreground">7-day total</p></div>} />
          <div className="px-2 pb-3 pt-2 sm:px-4"><RevenueChart data={week} /></div>
        </Card>
        <Card>
          <CardHeader title="Order types" desc="Today's distribution" />
          <div className="px-4 pb-4 pt-2"><Donut data={type} centerValue={num(today.orders)} centerLabel="orders" /><div className="mt-3"><Legend data={type} /></div></div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Orders trend" desc="Orders per day" />
          <div className="px-2 pb-3 pt-2 sm:px-4"><SalesBars data={week.map((d) => ({ label: d.label, value: d.orders }))} highlight={6} /></div>
        </Card>
        <Card>
          <CardHeader title="Best-selling products" desc="By units sold today" action={<Link to="/reports" className="text-xs font-semibold text-primary hover:underline">All</Link>} />
          <ul className="space-y-3.5 px-4 pb-4 pt-3">
            {best.map((p, i) => (
              <li key={p.id}><div className="mb-1 flex items-center gap-2 text-[13px]"><span className="tnum w-4 text-xs font-bold text-muted-foreground">{i + 1}</span><span className="flex-1 truncate font-semibold">{p.name}</span><span className="tnum font-bold">{p.qty}</span><span className="tnum w-16 text-right text-xs text-muted-foreground">{inr(p.revenue)}</span></div>
                <div className="ml-6 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(p.qty / maxQ) * 100}%` }} /></div></li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Top categories" desc="Share of today's sales" />
          <ul className="space-y-3 px-4 pb-4 pt-3">
            {cats.map((c) => (
              <li key={c.name}><div className="mb-1 flex justify-between text-[13px]"><span className="flex items-center gap-2 font-semibold"><span className="size-2.5 rounded-sm" style={{ background: c.color }} />{c.name}</span><span className="tnum"><b>{inr(c.value)}</b> <span className="text-xs text-muted-foreground">· {((c.value / catTotal) * 100).toFixed(0)}%</span></span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(c.value / cats[0].value) * 100}%`, background: c.color }} /></div></li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent transactions" desc="Latest orders across all channels" action={<Link to="/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View all<ArrowRight className="size-3" /></Link>} />
          <div className="scroll-thin overflow-x-auto px-2 pb-2 pt-2">
            <table className="w-full min-w-[520px] text-[13px]">
              <thead><tr className="text-left text-xs text-muted-foreground"><th className="px-3 py-2 font-semibold">Order</th><th className="px-3 py-2 font-semibold">Customer</th><th className="px-3 py-2 font-semibold">Type</th><th className="px-3 py-2 font-semibold">Time</th><th className="px-3 py-2 text-right font-semibold">Amount</th><th className="px-3 py-2 font-semibold">Payment</th></tr></thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} onClick={() => nav(`/orders?q=${o.id}`)} className="cursor-pointer border-t hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-bold">{o.id}</td><td className="px-3 py-2.5">{o.customerName}</td><td className="px-3 py-2.5 capitalize text-muted-foreground">{o.type}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{fmtTime(o.createdAt)}</td><td className="tnum px-3 py-2.5 text-right font-bold">{inr(o.totals.total)}</td><td className="px-3 py-2.5"><StatusBadge status={o.payment.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <CardHeader title="Live kitchen" desc="Orders in progress" action={<Link to="/kitchen" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><ChefHat className="size-3.5" />Open KDS</Link>} />
          <div className="grid grid-cols-3 gap-2 px-4 pt-3">
            {live.map(({ s, n }) => <div key={s} className="rounded-lg border p-2.5 text-center"><p className="tnum text-xl font-extrabold">{n}</p><StatusBadge status={s} className="mt-1" /></div>)}
          </div>
          <ul className="divide-y px-4 pb-2 pt-2">
            {liveList.map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-2.5 text-[13px]">
                <div className="min-w-0 flex-1"><p className="font-bold">{o.id}<span className="ml-2 text-xs font-medium capitalize text-muted-foreground">{o.table || o.type}</span></p><p className="truncate text-xs text-muted-foreground">{o.items.map((l) => `${l.qty}× ${l.name}`).join(', ')}</p></div>
                <span className="tnum text-xs font-semibold text-muted-foreground">{mmss(Date.now() - o.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}
