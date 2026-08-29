import type { ButtonHTMLAttributes } from 'react'
export function Button({ className = '', variant, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'outline' | 'default' }) {
  const base = variant === 'outline'
    ? 'inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition'
    : 'inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition'
  return <button {...p} className={`${base} ${className}`} />
}
