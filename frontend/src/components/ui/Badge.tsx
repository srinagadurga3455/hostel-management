export function Badge({ children, tone = 'slate' }: { children: string; tone?: 'green' | 'red' | 'yellow' | 'slate' | 'blue' | 'indigo' | 'amber' }) {
  const dot: Record<string, string> = {
    green: 'bg-emerald-500',
    red: 'bg-red-500',
    yellow: 'bg-amber-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    indigo: 'bg-slate-500',
    slate: 'bg-slate-400',
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium tracking-tight text-slate-700">
      <span className={`h-2 w-2 rounded-full ${dot[tone] ?? dot.slate}`} />
      {children}
    </span>
  )
}
