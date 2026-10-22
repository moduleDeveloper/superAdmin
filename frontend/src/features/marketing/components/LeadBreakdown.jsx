const number = (value) => value.toLocaleString('en-IN');
const share = (value, total) => (total > 0 ? Math.round((value / total) * 100) : 0);

function Chevron() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-(--c-muted) transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m7 4 6 6-6 6" />
    </svg>
  );
}

/** One collapsible section: a heading row with a small summary on the right. */
function Section({ title, note, defaultOpen = true, children }) {
  return (
    <details open={defaultOpen} className="group border-b border-gray-200 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center gap-3 py-4 [&::-webkit-details-marker]:hidden">
        <Chevron />
        <span className="flex-1 text-sm font-semibold">{title}</span>
        {note && <span className="text-xs text-(--c-muted)">{note}</span>}
      </summary>
      <div className="pb-5 pl-7">{children}</div>
    </details>
  );
}

/** A label with a bar, its count and its share of the total. */
function BarRow({ label, value, total, max, color }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-24 shrink-0 truncate" title={label}>
        {label}
      </span>
      <span className="h-2 flex-1 rounded-full bg-(--c-track)">
        <span className="block h-full rounded-full" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, background: color ?? 'var(--c-accent)' }} />
      </span>
      <span className="w-8 text-right font-semibold tabular-nums">{number(value)}</span>
      <span className="w-10 text-right text-xs text-(--c-muted) tabular-nums">{share(value, total)}%</span>
    </div>
  );
}

function Skeleton() {
  return <div className="m-5 h-48 animate-pulse rounded-xl bg-gray-50" />;
}

/**
 * The marketing breakdowns in one card: where leads come from (with each source's share), paid vs organic, the top
 * campaigns and the hours leads arrive. Each section folds away.
 */
function LeadBreakdown({ channels, paid, campaigns, hours, loading }) {
  if (loading && channels.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(20,33,61,0.06)]">
        <Skeleton />
      </section>
    );
  }

  const sourceTotal = channels.reduce((sum, slice) => sum + slice.value, 0);
  const paidTotal = paid.reduce((sum, slice) => sum + slice.value, 0);
  const campaignTotal = campaigns.reduce((sum, bar) => sum + bar.value, 0);
  const peak = Math.max(0, ...hours.map((hour) => hour.value));

  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-5 shadow-[0_1px_3px_rgba(20,33,61,0.06)]">
      <Section title="Lead source" note={`${channels.length} source${channels.length === 1 ? '' : 's'}`}>
        {channels.length === 0 ? (
          <p className="text-sm text-(--c-muted)">No leads in this period</p>
        ) : (
          <div className="flex flex-col gap-3 pr-1">
            {channels.map((slice) => (
              <BarRow key={slice.label} label={slice.label} value={slice.value} total={sourceTotal} max={channels[0].value} color={slice.color} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Paid vs organic" note={paidTotal > 0 ? `${number(paidTotal)} leads` : undefined}>
        {paidTotal === 0 ? (
          <p className="text-sm text-(--c-muted)">No leads in this period</p>
        ) : (
          <div className="flex flex-col gap-3 pr-1">
            {paid
              .filter((slice) => slice.value > 0)
              .map((slice) => (
                <BarRow key={slice.label} label={slice.label} value={slice.value} total={paidTotal} max={paidTotal} color={slice.color} />
              ))}
          </div>
        )}
      </Section>

      <Section title="Top campaigns" note={`${campaigns.length} campaign${campaigns.length === 1 ? '' : 's'}`}>
        {campaigns.length === 0 ? (
          <p className="text-sm text-(--c-muted)">No leads in this period</p>
        ) : (
          <ul className="flex flex-col gap-3 pr-1 text-sm">
            {campaigns.map((campaign) => (
              <li key={campaign.label} className="flex items-baseline justify-between gap-4">
                <span className="min-w-0">{campaign.label}</span>
                <span className="flex shrink-0 items-baseline gap-3">
                  <span className="font-semibold tabular-nums">{number(campaign.value)}</span>
                  <span className="w-10 text-right text-xs text-(--c-muted) tabular-nums">{share(campaign.value, campaignTotal)}%</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="When leads arrive" note="by hour of the day" defaultOpen={false}>
        {peak === 0 ? (
          <p className="text-sm text-(--c-muted)">No leads in this period</p>
        ) : (
          <div className="pr-1">
            <div className="flex h-24 items-end gap-1.5" role="img" aria-label="Leads received per hour of the day">
              {hours.map((hour) => (
                <span
                  key={hour.label}
                  title={`${hour.title}: ${number(hour.value)} lead${hour.value === 1 ? '' : 's'}`}
                  className="flex-1 rounded-t"
                  style={{ height: `${Math.max(4, (hour.value / peak) * 100)}%`, background: hour.value === peak ? 'var(--c-accent)' : 'var(--c-accent-soft)' }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[0.7rem] text-(--c-muted)">
              <span>12am</span>
              <span>6am</span>
              <span>12pm</span>
              <span>6pm</span>
              <span>11pm</span>
            </div>
          </div>
        )}
      </Section>
    </section>
  );
}

export default LeadBreakdown;
