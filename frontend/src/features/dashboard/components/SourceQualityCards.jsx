import { COLORS } from '../../marketing/utils/leadStats';

const SOURCE_STYLE = {
  meta: { letter: 'M', color: COLORS.facebook },
  google: { letter: 'G', color: COLORS.google },
  website: { letter: 'W', color: COLORS.website },
  other: { letter: 'O', color: '#7a6f80' },
};

const PLATFORM_COLORS = { Facebook: COLORS.facebook, Instagram: COLORS.instagram };

const number = (value) => value.toLocaleString('en-IN');
const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : null);

function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <span className="rounded-full bg-gradient-to-r from-[#ee7b3e] to-[#b04a4f] px-3 py-1 text-center text-[0.65rem] font-bold uppercase leading-tight tracking-wide text-white">
        #1 Quality
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[#f3ece6] px-3 py-1 text-center text-[0.65rem] font-semibold leading-tight text-[#6b7188]" title={rank ? undefined : 'Under 10 leads: too few to rank'}>
      {rank ? `Rank #${rank}` : 'Too few leads'}
    </span>
  );
}

function Stat({ label, children }) {
  return (
    <div>
      <p className="text-xs text-[#6b7188]">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums">{children}</p>
    </div>
  );
}

function SourceCard({ source, selected, onSelect }) {
  const { letter, color } = SOURCE_STYLE[source.key] ?? SOURCE_STYLE.other;
  const stillActive = percent(source.activeCreators, source.creators);
  const ofLeads = percent(source.creators, source.leads);
  const avgActions = source.apps > 0 ? Math.round(source.actions / source.apps) : null;
  const shaky = source.rank === null;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      title={selected ? 'Click to show all sources again' : `Show only ${source.label} below`}
      className={`flex cursor-pointer flex-col rounded-2xl border bg-white p-5 text-left shadow-[0_1px_3px_rgba(20,33,61,0.06)] transition hover:shadow-[0_6px_18px_rgba(80,40,60,0.12)] ${
        selected ? 'border-[#e8793f] ring-2 ring-[#e8793f]/30' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ background: color }} aria-hidden="true">
          {letter}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{source.label}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {source.platforms.map((name) => (
              <span key={name} className="inline-flex items-center gap-1.5 rounded-full bg-[#f8ece4] px-2 py-0.5 text-[0.7rem] font-medium text-[#3a3f55]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: PLATFORM_COLORS[name] ?? COLORS.other }} />
                {name}
              </span>
            ))}
          </div>
        </div>
        <RankBadge rank={source.rank} />
      </div>

      <div className={`mt-5 ${shaky ? 'opacity-60' : ''}`}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-[#3a3f55]">Apps still active</p>
          <p className="text-3xl font-bold tabular-nums tracking-tight">{stillActive === null ? '—' : `${stillActive}%`}</p>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-[#f3ece6]">
          <div className="h-full rounded-full" style={{ width: `${stillActive ?? 0}%`, background: color }} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
        <Stat label="Leads">{number(source.leads)}</Stat>
        <Stat label="Apps created">
          {number(source.creators)}
          {ofLeads !== null && <span className="ml-1.5 text-xs font-medium text-[#7b8196]">({ofLeads}%)</span>}
        </Stat>
        <Stat label="Avg. actions / app">{avgActions === null ? '—' : number(avgActions)}</Stat>
        <Stat label="Logged in">{number(source.loggedIn)}</Stat>
      </div>
    </button>
  );
}

/**
 * One card per ad source, ranked by active apps per 100 leads. Selecting a card narrows the lead sections of the
 * dashboard (funnel, campaigns, sources, conversion) to that source; selecting it again shows everything.
 */
function SourceQualityCards({ sources, selected, onSelect, loading }) {
  return (
    <section className="rounded-2xl border border-[#ebe0d7] bg-[#f7efe9] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Ad Source Quality</h3>
          <p className="mt-0.5 text-xs text-[#6b7188]">How many came, built an app and kept using it · click a source to filter the lead sections below</p>
        </div>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="cursor-pointer rounded-full bg-white px-3 py-1 text-xs font-medium text-[#b04a4f] shadow-sm hover:underline"
          >
            Showing: {sources?.find((s) => s.key === selected)?.label} · Clear
          </button>
        )}
      </div>

      {loading && !sources ? (
        <div className="mt-4 h-52 animate-pulse rounded-2xl bg-white/60" />
      ) : sources.length === 0 ? (
        <p className="mt-4 rounded-xl bg-white/60 px-4 py-8 text-center text-sm text-[#7b8196]">No leads in this period</p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sources.map((source) => (
            <SourceCard key={source.key} source={source} selected={selected === source.key} onSelect={() => onSelect(selected === source.key ? null : source.key)} />
          ))}
        </div>
      )}
    </section>
  );
}

export default SourceQualityCards;
