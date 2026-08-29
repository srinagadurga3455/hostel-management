export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}{onRetry && <button onClick={onRetry} className="ml-3 underline">Retry</button>}</div>
}
