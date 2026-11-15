import { useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, SearchX } from 'lucide-react'
import { cn } from '../../utils/formatters.js'
import EmptyState from './EmptyState.jsx'
import Button from './Button.jsx'

/**
 * columns: [{ key, header, render?(row), sortValue?(row), align, className, hideBelow: 'md'|'lg', mobileLabel }]
 */
export default function DataTable({ columns, rows, rowKey = 'id', onRowClick, pageSize = 10, empty, loading, dense, defaultSort }) {
  const [sort, setSort] = useState(defaultSort || null)
  const [page, setPage] = useState(0)
  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    const val = (r) => (col.sortValue ? col.sortValue(r) : r[col.key])
    return [...rows].sort((a, b) => {
      const x = val(a), y = val(b)
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''))
      return sort.dir === 'asc' ? c : -c
    })
  }, [rows, sort, columns])
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const cur = Math.min(page, pages - 1)
  const slice = pageSize ? sorted.slice(cur * pageSize, cur * pageSize + pageSize) : sorted
  const hide = { md: 'hidden md:table-cell', lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' }

  const toggle = (c) => {
    if (c.sortable === false || (!c.sortValue && !c.header)) return
    setSort((s) => (s?.key === c.key ? (s.dir === 'asc' ? { key: c.key, dir: 'desc' } : null) : { key: c.key, dir: 'asc' }))
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-max text-left text-[13px]">
          <thead>
            <tr className="border-b bg-muted/30">
              {columns.map((c) => (
                <th key={c.key} onClick={() => c.sortable !== false && c.header && toggle(c)}
                  className={cn('select-none whitespace-nowrap px-4 py-2.5 text-xs font-semibold text-muted-foreground', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', c.sortable !== false && c.header && 'cursor-pointer hover:text-foreground', hide[c.hideBelow])}>
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {sort?.key === c.key && (sort.dir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b last:border-0">
                {columns.map((c) => <td key={c.key} className={cn('px-4 py-3.5', hide[c.hideBelow])}><div className="h-3.5 animate-pulse rounded bg-muted/70" style={{ width: `${50 + ((i * 17 + c.key.length * 9) % 45)}%` }} /></td>)}
              </tr>
            ))}
            {!loading && slice.map((r) => (
              <tr key={r[rowKey]} onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cn('border-b transition-colors last:border-0', onRowClick && 'cursor-pointer hover:bg-muted/30')}>
                {columns.map((c) => (
                  <td key={c.key} className={cn(dense ? 'px-4 py-2' : 'px-4 py-3', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', hide[c.hideBelow], c.className)}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && sorted.length === 0 && (empty || <EmptyState icon={SearchX} title="Nothing found" message="Try changing your search or filters." />)}
      {pageSize && sorted.length > pageSize && (
        <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground">
          <span>Showing {cur * pageSize + 1}–{Math.min(sorted.length, (cur + 1) * pageSize)} of {sorted.length}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}><ChevronLeft className="size-4" /></Button>
            <span className="px-2 font-semibold text-foreground">{cur + 1} / {pages}</span>
            <Button variant="outline" size="icon-sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}><ChevronRight className="size-4" /></Button>
          </div>
        </div>
      )}
    </div>
  )
}
