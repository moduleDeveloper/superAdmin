import { useState } from 'react';

const SIZE = 150;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Donut chart with a legend. `slices` is [{ label, value, color }]; empty slices are left out.
 * The middle shows the total, or the hovered slice (hover a slice or its legend row).
 */
function DonutChart({ title, slices, loading, noun = 'lead', emptyText = 'No data in this period' }) {
  const [active, setActive] = useState(null);

  const shown = slices.filter((slice) => slice.value > 0);
  const total = shown.reduce((sum, slice) => sum + slice.value, 0);
  const hovered = active === null ? null : shown[active];

  // Each arc starts where the previous one ends.
  const arcs = shown.map((slice, i) => ({
    ...slice,
    length: (slice.value / total) * CIRCUMFERENCE,
    offset: (shown.slice(0, i).reduce((sum, s) => sum + s.value, 0) / total) * CIRCUMFERENCE,
  }));

  return (
    <div className="flex h-full min-w-0 flex-col">
      <h3 className="truncate text-sm font-semibold">{title}</h3>

      {loading && total === 0 ? (
        <div className="mt-3 h-[150px] animate-pulse rounded-xl bg-gray-50" />
      ) : total === 0 ? (
        <p className="mt-3 flex h-[150px] items-center justify-center text-sm text-(--c-muted)">{emptyText}</p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
          <div className="relative h-[150px] w-[150px] shrink-0">
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="h-full w-full -rotate-90"
              role="img"
              aria-label={`${title}: ${total} ${total === 1 ? noun : `${noun}s`}`}
            >
              <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--c-track)" strokeWidth={STROKE} />
              {arcs.map((arc, i) => (
                <circle
                  key={arc.label}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={active === i ? STROKE + 4 : STROKE}
                  strokeDasharray={`${Math.max(arc.length - (arcs.length > 1 ? 1.5 : 0), 0)} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-arc.offset}
                  opacity={active === null || active === i ? 1 : 0.35}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold leading-none tabular-nums">{(hovered?.value ?? total).toLocaleString('en-IN')}</span>
              <span className="mt-1 max-w-[80px] truncate text-[0.7rem] text-(--c-muted)">
                {hovered ? `${Math.round((hovered.value / total) * 100)}% · ${hovered.label}` : 'Total'}
              </span>
            </div>
          </div>

          <ul className="min-w-[9rem] space-y-1.5 text-sm">
            {shown.map((slice, i) => (
              <li
                key={slice.label}
                className={`flex items-center gap-2 transition-opacity ${active === null || active === i ? '' : 'opacity-40'}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: slice.color }} />
                <span className="min-w-0 flex-1 truncate text-(--c-text-2)">{slice.label}</span>
                <span className="font-semibold tabular-nums">{slice.value.toLocaleString('en-IN')}</span>
                <span className="w-9 text-right text-xs tabular-nums text-(--c-muted)">{Math.round((slice.value / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DonutChart;
