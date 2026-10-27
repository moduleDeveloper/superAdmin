import { STATUS } from '../utils/targetMath';

/** Clickable chips with counts: pick a colour to show only those campaigns; pick it again (or "Show all") to clear. */
function StatusLegend({ counts, active, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status colour">
      {Object.entries(STATUS).map(([key, status]) => {
        const on = active === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? null : key)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--c-accent) ${
              on ? 'border-(--c-accent) bg-(--c-accent-soft) text-(--c-link)' : 'border-gray-300 text-(--c-text-2) hover:bg-gray-50'
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: status.color }} aria-hidden="true" />
            {status.short}
            <span className="rounded-full bg-gray-100 px-1.5 text-[0.65rem] font-bold tabular-nums">{counts[key]}</span>
          </button>
        );
      })}
      {active && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold text-(--c-link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--c-accent)"
        >
          Show all
        </button>
      )}
    </div>
  );
}

export default StatusLegend;
