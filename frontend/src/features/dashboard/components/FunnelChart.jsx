const MIN_FILL = 1.5; // % of the track, so a very small stage is still visible

const STAGES = [
  { key: 'leads', label: 'Ad Leads', color: '#f2a77c' },
  { key: 'loggedIn', label: 'Logged In', color: '#e8793f' },
  { key: 'creators', label: 'Apps Created', color: '#b04a4f' },
  { key: 'activeCreators', label: 'Active Apps', color: '#5b2650' },
];

const number = (value) => value.toLocaleString('en-IN');

/**
 * Lead-to-app funnel as horizontal bars, one row per stage. Each stage is a subset of the one before and its bar is
 * sized against the first. The badge says what share of the previous stage reached it (green from 60%, amber below).
 */
function FunnelChart({ funnel, loading, scope, control }) {
  const ready = Boolean(funnel) && !loading;

  const descriptions = funnel && {
    leads: `Enquiries received${funnel.withMobile < funnel.leads ? ` · ${number(funnel.withMobile)} with a number` : ''}`,
    loggedIn: 'Joined and signed in to the app',
    creators: `Built their own app · ${number(funnel.apps)} app${funnel.apps === 1 ? '' : 's'}`,
    activeCreators: `Their app has activity · ${number(funnel.activeApps)} app${funnel.activeApps === 1 ? '' : 's'}`,
  };

  const overall = funnel && funnel.leads > 0 ? Math.round((funnel.activeCreators / funnel.leads) * 100) : null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,33,61,0.06)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">Lead to App Funnel{scope ? ` · ${scope}` : ''}</h3>
        {control}
      </div>
      <p className="mt-1 text-xs text-[#7b8196]">Leads received in this period, followed through to their apps · matched by mobile number</p>

      <ol className="mt-5 space-y-4">
        {STAGES.map((stage, i) => {
          const value = funnel?.[stage.key];
          const previous = i > 0 ? funnel?.[STAGES[i - 1].key] : null;
          const first = funnel?.leads ?? 0;
          const share = previous ? Math.round((value / previous) * 100) : null;
          const width = first > 0 ? Math.max(MIN_FILL, (value / first) * 100) : 0;

          return (
            <li key={stage.key} className="grid items-center gap-x-5 gap-y-1.5 md:grid-cols-[11rem_1fr_6.5rem]">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{stage.label}</p>
                <p className="text-xs leading-4 text-[#7b8196]">{descriptions?.[stage.key]}</p>
              </div>

              <div className="flex h-9 items-center rounded-xl bg-[#f8ece4] p-1">
                {ready ? (
                  <div
                    className="flex h-full items-center justify-end rounded-lg pr-3 transition-[width] duration-500"
                    style={{ width: `${width}%`, background: stage.color }}
                    role="img"
                    aria-label={`${stage.label}: ${value}`}
                  >
                    {width >= 12 && <span className="text-sm font-bold tabular-nums text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">{number(value)}</span>}
                  </div>
                ) : (
                  <div className="h-full w-full animate-pulse rounded-lg bg-[#f0e1d6]" />
                )}
                {ready && width < 12 && <span className="ml-2.5 text-sm font-bold tabular-nums">{number(value)}</span>}
              </div>

              <div className="md:text-right">
                {share !== null && ready && (
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold ${
                      share >= 60 ? 'bg-[#dff3e5] text-[#1f6b34]' : 'bg-[#fdeccf] text-[#9a5b12]'
                    }`}
                  >
                    {share}% from prev.
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {ready && overall !== null && (
        <p className="mt-5 border-t border-dashed border-[#ebe0d7] pt-3 text-xs text-[#7b8196]">
          Overall: <span className="font-semibold text-[#14213d]">{number(funnel.activeCreators)}</span> of {number(funnel.leads)} leads ({overall}%) ended up with an app that is in use
        </p>
      )}
    </section>
  );
}

export default FunnelChart;
