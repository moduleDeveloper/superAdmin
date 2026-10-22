/**
 * Horizontal bars for a ranked list. `items` is [{ label, value }], already sorted; the longest bar is the biggest value.
 */
function BarList({ title, items, loading, color = 'var(--c-accent)', noun = 'lead', emptyText = 'No data in this period' }) {
  const peak = Math.max(1, ...items.map((item) => item.value));
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex h-full min-w-0 flex-col">
      <h3 className="truncate text-sm font-semibold">{title}</h3>

      {loading && items.length === 0 ? (
        <div className="mt-3 h-40 animate-pulse rounded-xl bg-gray-50" />
      ) : items.length === 0 ? (
        <p className="mt-3 flex h-40 items-center justify-center text-sm text-(--c-muted)">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.label} title={`${item.label}: ${item.value} ${item.value === 1 ? noun : `${noun}s`}`}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-(--c-text-2)">{item.label}</span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {item.value.toLocaleString('en-IN')}
                  <span className="ml-1.5 text-xs font-normal text-(--c-muted)">{Math.round((item.value / total) * 100)}%</span>
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-(--c-track)">
                <div className="h-2 rounded-full" style={{ width: `${(item.value / peak) * 100}%`, background: color }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BarList;
