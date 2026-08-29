import { Badge } from './Badge'
export function StatusBadge({ status }: { status: string }) {
  const u = status.toUpperCase()
  const t =
    u === 'APPROVED' || u === 'RESOLVED' || u === 'PRESENT'
      ? 'green'
      : u === 'REJECTED' || u === 'ABSENT'
        ? 'red'
        : u === 'PENDING' || u === 'IN_PROGRESS'
          ? 'yellow'
          : 'slate'
  return <Badge tone={t as never}>{status}</Badge>
}
