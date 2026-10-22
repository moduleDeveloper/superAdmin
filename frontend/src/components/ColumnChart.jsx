/**
 * Column chart for a fixed set of categories. `columns` is [{ label, title, value }];
 * `labelEvery` shows the label under every n-th column. Hover a column for its exact count.
 */
function ColumnChart({
  title,
  columns,
  loading,
  color = 'var(--c-c1)',
  noun = 'lead',
  labelEvery = 3,
  emptyText = 'No data in this period',
  height = 140,
}) {
  const peak = Math.max(0, ...columns.map((column) => column.value));

  return (
    <div className="flex h-full min-w-0 flex-col">
      <h3 className="truncate text-sm font-semibold">{title}</h3>

      {loading && peak === 0 ? (
        <div className="mt-3 animate-pulse rounded-xl bg-gray-50" style={{ height: height + 20 }} />
      ) : peak === 0 ? (
        <p className="mt-3 flex items-center justify-center text-sm text-(--c-muted)" style={{ height: height + 20 }}>
          {emptyText}
        </p>
      ) : (
        <div className="mt-6 flex items-stretch gap-[3px]" style={{ height: height + 20 }}>
          {columns.map((column, i) => (
            <div
              key={column.title}
              className="group relative flex min-w-0 flex-1 flex-col"
              title={`${column.title}: ${column.value} ${column.value === 1 ? noun : `${noun}s`}`}
            >
              <div className="flex flex-1 items-end">
                <div
                  className="w-full rounded-t-[3px] opacity-80 transition-opacity group-hover:opacity-100"
                  style={{ height: `${(column.value / peak) * 100}%`, minHeight: column.value > 0 ? 3 : 0, background: color }}
                />
              </div>
              <span className="mt-1 h-4 whitespace-nowrap text-center text-[0.65rem] text-(--c-muted)">
                {i % labelEvery === 0 ? column.label : ''}
              </span>
              {column.value > 0 && (
                <span className="pointer-events-none absolute -top-5 left-1/2 hidden -translate-x-1/2 rounded bg-(--c-text) px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums text-white group-hover:block">
                  {column.value}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ColumnChart;
