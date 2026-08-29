import type { SelectHTMLAttributes } from 'react'
export function Select({ className = '', children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 ${className}`}>{children}</select>
}
