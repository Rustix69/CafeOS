import { forwardRef } from 'react'
import { cn } from '../../utils/formatters.js'

const VARIANTS = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-xs',
  outline: 'border bg-card hover:bg-muted/50 shadow-xs',
  ghost: 'hover:bg-muted/60',
  soft: 'bg-primary/10 text-primary hover:bg-primary/15',
  danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs',
  'danger-soft': 'bg-destructive/10 text-destructive hover:bg-destructive/15',
}
const SIZES = {
  xs: 'h-7 px-2 text-xs gap-1',
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
  xl: 'h-12 px-6 text-base gap-2.5',
  icon: 'size-9',
  'icon-sm': 'size-8',
}

const Button = forwardRef(function Button({ variant = 'primary', size = 'md', icon: Icon, className, children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md font-semibold transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant], SIZES[size], className
      )}
      {...rest}
    >
      {Icon && <Icon className={size === 'xs' ? 'size-3.5' : 'size-4'} />}
      {children}
    </button>
  )
})
export default Button
