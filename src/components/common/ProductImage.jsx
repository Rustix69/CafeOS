import { useState } from 'react'
import { Cake, Coffee, CupSoda, Beef, Pizza, Sandwich, Cookie, Leaf } from 'lucide-react'
import { cn } from '../../utils/formatters.js'

const CAT = {
  Coffee: { icon: Coffee, hue: 55 }, Tea: { icon: Leaf, hue: 145 }, Beverages: { icon: CupSoda, hue: 215 }, Burgers: { icon: Beef, hue: 40 },
  Sandwiches: { icon: Sandwich, hue: 85 }, Pizza: { icon: Pizza, hue: 28 }, Desserts: { icon: Cake, hue: 340 }, Snacks: { icon: Cookie, hue: 70 },
}
export default function ProductImage({ item, className, iconClass }) {
  const [bad, setBad] = useState(false)
  if (item.image && !bad) return <img src={item.image} alt={item.name} loading="lazy" onError={() => setBad(true)} className={cn('object-cover', className)} />
  const c = CAT[item.category] || { icon: Coffee, hue: 150 }
  const Icon = c.icon
  const shift = ([...item.name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % 24) - 12
  return (
    <div className={cn('grid place-items-center', className)}
      style={{ background: `linear-gradient(135deg, oklch(0.95 0.045 ${c.hue + shift}), oklch(0.9 0.07 ${c.hue + shift + 14}))`, color: `oklch(0.45 0.1 ${c.hue + shift})` }}>
      <Icon className={cn('size-1/3 opacity-90', iconClass)} strokeWidth={1.6} />
    </div>
  )
}
