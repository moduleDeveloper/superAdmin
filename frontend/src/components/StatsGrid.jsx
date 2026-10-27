import { Link } from 'react-router-dom';

// Hairlines between cells: a 2 × 2 grid normally, one row of four once the area is wide enough (≥ 42rem).
const DIVIDERS = [
  '',
  'border-l',
  'border-t @2xl:border-t-0 @2xl:border-l',
  'border-l border-t @2xl:border-t-0',
];

// Three in a row once there is room (≥ 42rem), otherwise stacked.
const DIVIDERS_OF_THREE = ['', 'border-t @2xl:border-t-0 @2xl:border-l', 'border-t @2xl:border-t-0 @2xl:border-l'];

const DIVIDERS_OF_FIVE = [
  '',
  'border-l',
  'border-t @2xl:border-t-0 @2xl:border-l',
  'border-l border-t @2xl:border-t-0',
  'border-t @2xl:border-t-0 @2xl:border-l',
];

function Stat({ marker, label, value, hint, percent, loading, divider, to }) {
  const Wrapper = to && !loading ? Link : 'div';
  return (
    <Wrapper
      {...(Wrapper === Link ? { to, title: `Open ${label}` } : {})}
      className={`block min-w-0 border-(--c-border) px-4 py-5 @md:px-6 ${divider} ${Wrapper === Link ? 'transition hover:bg-white/60' : ''}`}
    >
      <p className="flex min-h-8 items-start gap-2 text-xs font-medium uppercase leading-4 tracking-[0.08em] text-(--c-muted) @md:min-h-0">
        <span className="mt-[4px] h-2 w-2 shrink-0 rounded-[2px]" style={{ background: marker }} aria-hidden="true" />
        <span>{label}</span>
      </p>

      {loading ? (
        <div className="mt-3 h-8 w-20 animate-pulse rounded bg-(--c-track)" />
      ) : (
        <p className="mt-2 flex items-baseline gap-2.5 text-2xl font-semibold leading-9 tracking-tight tabular-nums text-(--c-text) @md:text-[1.75rem]">
          <span className="truncate">{value}</span>
          {percent && (
            <span className="shrink-0 rounded-full bg-(--c-accent-soft) px-3 py-0.5 text-base font-bold leading-7 tracking-normal text-(--c-link) @md:text-lg">
              {percent}
            </span>
          )}
        </p>
      )}

      <p className="mt-1 truncate text-[0.8rem] text-(--c-muted)" title={loading ? undefined : hint}>
        {loading ? ' ' : hint}
      </p>
    </Wrapper>
  );
}

/**
 * Headline numbers as a quiet, divided grid that sits directly on an overview panel.
 * `stats` is [{ marker (colour), label, value, hint, percent (optional small tag next to the value), to (optional link) }]: four (2 × 2 / one row) or three (one row).
 */
function StatsGrid({ stats, loading }) {
  const three = stats.length === 3;
  const five = stats.length === 5;

  return (
    <div className="@container flex items-center">
      <div className={`stagger grid w-full ${three ? 'grid-cols-1 @2xl:grid-cols-3' : five ? 'grid-cols-2 @2xl:grid-cols-5' : 'grid-cols-2 @2xl:grid-cols-4'}`}>
        {stats.map((stat, i) => (
          <Stat key={stat.label} {...stat} loading={loading} divider={(three ? DIVIDERS_OF_THREE : five ? DIVIDERS_OF_FIVE : DIVIDERS)[i]} />
        ))}
      </div>
    </div>
  );
}

export default StatsGrid;
