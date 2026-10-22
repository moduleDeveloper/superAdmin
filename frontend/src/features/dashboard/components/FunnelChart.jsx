const MIN_FILL = 1.5; // % of the track, so a very small stage is still visible

/** `badge` says in plain words what the percentage means: the share of the step right above that reached this one. */
const STAGES = [
  { key: 'leads', label: 'Leads', color: 'var(--c-c3)' },
  { key: 'loggedIn', label: 'Logged In', color: 'var(--c-c1)', badge: (share) => `${share}% logged in` },
  { key: 'creators', label: 'Built an App', color: 'var(--c-c4)', badge: (share) => `${share}% built an app` },
  { key: 'activeCreators', label: 'App Has Activity', color: 'var(--c-c2)', badge: (share) => `${share}% active` },
];

const number = (value) => value.toLocaleString('en-IN');
const people = (count) => `${number(count)} ${count === 1 ? 'person' : 'people'}`;
const apps = (count) => `${number(count)} app${count === 1 ? '' : 's'}`;

/**
 * Lead-to-app funnel as horizontal bars, one row per stage (counted as people). Each stage is a subset of the one before
 * and its bar is sized against the first. The badge says what share of the step above reached it (green from 60%, amber below).
 */
function FunnelChart({ funnel, loading, scope, control, embedded = false }) {
  const ready = Boolean(funnel) && !loading;

  const descriptions = funnel && {
    leads: `Enquiries${funnel.withMobile < funnel.leads ? ` · ${number(funnel.withMobile)} with mobile` : ''}`,
    loggedIn: 'Signed in to the app',
    creators: `Built an app · ${apps(funnel.apps)}`,
    activeCreators: `App in use · ${apps(funnel.activeApps)}`,
  };

  const overall = funnel && funnel.leads > 0 ? Math.round((funnel.activeCreators / funnel.leads) * 100) : null;

  return (
    <section className={embedded ? '' : 'rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,33,61,0.06)]'}>
      {!embedded && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold">Lead to App Funnel{scope ? ` · ${scope}` : ''}</h3>
            {control}
          </div>
          <p className="mt-1 text-xs text-(--c-muted)">Leads received in this period, followed through to their apps · matched by mobile number</p>
        </>
      )}

      <p className="text-xs text-(--c-muted)">Numbers are people. Each % is the share of the step above.</p>

      <ol className="mt-4 space-y-4">
        {STAGES.map((stage, i) => {
          const value = funnel?.[stage.key];
          const previous = i > 0 ? funnel?.[STAGES[i - 1].key] : null;
          const first = funnel?.leads ?? 0;
          const share = previous ? Math.round((value / previous) * 100) : null;
          const width = first > 0 ? Math.max(MIN_FILL, (value / first) * 100) : 0;

          return (
            <li key={stage.key} className="grid items-center gap-x-5 gap-y-1.5 md:grid-cols-[11rem_1fr_8rem]">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{stage.label}</p>
                <p className="text-xs leading-4 text-(--c-muted)">{descriptions?.[stage.key]}</p>
              </div>

              <div className="flex h-9 items-center rounded-xl bg-(--c-band) p-1">
                {ready ? (
                  <div
                    className="flex h-full items-center justify-end rounded-lg pr-3 transition-[width] duration-500"
                    style={{ width: `${width}%`, background: stage.color }}
                    role="img"
                    aria-label={`${stage.label}: ${people(value)}`}
                  >
                    {width >= 12 && <span className="text-sm font-bold tabular-nums text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">{number(value)}</span>}
                  </div>
                ) : (
                  <div className="h-full w-full animate-pulse rounded-lg bg-(--c-track)" />
                )}
                {ready && width < 12 && <span className="ml-2.5 text-sm font-bold tabular-nums">{number(value)}</span>}
              </div>

              <div className="md:text-right">
                {share !== null && ready && (
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-[0.7rem] font-semibold leading-tight ${
                      share >= 60 ? 'bg-(--c-good-bg) text-(--c-good-text)' : 'bg-(--c-warn-bg) text-(--c-warn-text)'
                    }`}
                  >
                    {stage.badge(share)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {ready && overall !== null && (
        <p className="mt-5 border-t border-dashed border-(--c-border) pt-3 text-xs text-(--c-muted)">
          Overall: <span className="font-semibold text-(--c-text)">{overall} of every 100 leads</span> ({number(funnel.activeCreators)} of {number(funnel.leads)}) have an app in use
        </p>
      )}
    </section>
  );
}

export default FunnelChart;
