import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { compact, inr, num } from '../../utils/formatters.js'

export const PALETTE = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'oklch(0.78 0.13 75)', 'oklch(0.7 0.12 330)', 'oklch(0.6 0.05 250)', 'oklch(0.7 0.1 20)']
const axis = { fontSize: 11, fill: 'var(--muted-foreground)' }

function Tip({ active, payload, label, money, labels }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-bold">{label ?? payload[0].payload.name}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: p.color || p.payload.fill }} />
          {labels?.[p.dataKey] || p.name}: <b className="tnum text-foreground">{money === true || (Array.isArray(money) && money.includes(p.dataKey)) ? inr(p.value) : num(p.value)}</b>
        </p>
      ))}
    </div>
  )
}

export function RevenueChart({ data, height = 260, xKey = 'label', yKey = 'revenue', money = true }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={axis} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={(v) => (money ? compact(v) : num(v))} width={52} />
        <Tooltip content={<Tip money={money} labels={{ [yKey]: money ? 'Revenue' : 'Orders' }} />} cursor={{ stroke: 'var(--border)' }} />
        <Area type="monotone" dataKey={yKey} stroke="var(--chart-1)" strokeWidth={2.2} fill="url(#rev)" dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function LineTrend({ data, height = 220, lines, xKey = 'label' }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={axis} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={axis} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<Tip />} />
        {lines.map((l, i) => <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={PALETTE[i + 1]} strokeWidth={2} dot={false} />)}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function SalesBars({ data, height = 240, xKey = 'label', yKey = 'value', money = false, color = 'var(--chart-2)', radius = 4, highlight }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tick={axis} axisLine={false} tickLine={false} interval={0} />
        <YAxis tick={axis} axisLine={false} tickLine={false} tickFormatter={(v) => (money ? compact(v) : num(v))} width={52} />
        <Tooltip content={<Tip money={money} labels={{ [yKey]: money ? 'Sales' : 'Orders' }} />} cursor={{ fill: 'var(--muted)', opacity: 0.4 }} />
        <Bar dataKey={yKey} radius={[radius, radius, 0, 0]} maxBarSize={36}>
          {data.map((d, i) => <Cell key={i} fill={highlight !== undefined && i === highlight ? 'var(--chart-1)' : color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function Donut({ data, height = 190, money = false, centerLabel, centerValue }) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="92%" paddingAngle={2} stroke="none">
            {data.map((d, i) => <Cell key={d.name} fill={d.color || PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip content={<Tip money={money} />} />
        </PieChart>
      </ResponsiveContainer>
      {centerValue !== undefined && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div><p className="tnum text-xl font-extrabold leading-none">{centerValue}</p><p className="mt-1 text-[11px] font-medium text-muted-foreground">{centerLabel}</p></div>
        </div>
      )}
    </div>
  )
}

export function Legend({ data, money, total }) {
  const t = total ?? data.reduce((s, d) => s + d.value, 0)
  return (
    <ul className="space-y-2">
      {data.map((d, i) => (
        <li key={d.name} className="flex items-center gap-2.5 text-[13px]">
          <span className="size-2.5 rounded-sm" style={{ background: d.color || PALETTE[i % PALETTE.length] }} />
          <span className="flex-1 font-medium">{d.name}</span>
          <span className="tnum font-semibold">{money ? inr(d.value) : num(d.value)}</span>
          <span className="tnum w-11 text-right text-xs text-muted-foreground">{t ? ((d.value / t) * 100).toFixed(0) : 0}%</span>
        </li>
      ))}
    </ul>
  )
}
