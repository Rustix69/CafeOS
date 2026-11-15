export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon && <div className="mb-3 grid size-12 place-items-center rounded-full bg-muted/70 text-muted-foreground"><Icon className="size-5" /></div>}
      <h3 className="text-sm font-bold">{title}</h3>
      {message && <p className="mt-1 max-w-xs text-[13px] text-muted-foreground">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
