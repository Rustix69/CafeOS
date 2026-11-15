import { cn, initials } from '../../utils/formatters.js'

const HUES = [150, 261, 212, 245, 75, 25, 190, 300]
export default function Avatar({ name, size = 'md', className }) {
  const h = HUES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % HUES.length]
  const sz = { xs: 'size-6 text-[10px]', sm: 'size-8 text-xs', md: 'size-9 text-xs', lg: 'size-12 text-base', xl: 'size-16 text-xl' }[size]
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-full font-bold', sz, className)}
      style={{ background: `oklch(0.93 0.05 ${h})`, color: `oklch(0.42 0.11 ${h})` }}>
      {initials(name)}
    </span>
  )
}
