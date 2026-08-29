export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex items-start justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight">{title}</h1>{desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}</div>{action}</div>
}
