import { SOURCES } from '../utils/sources';
import SourceIcon from './SourceIcon';

const EMPTY = { leads: 0, creators: 0, activeCreators: 0, apps: 0, actions: 0, loggedIn: 0, platforms: [], rank: null };
const number = (value) => value.toLocaleString('en-IN');
const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : null);

/** The two steps shown on each card, each as a share of all leads. */
const STAGES = [
  { key: 'loggedIn', label: 'Logged in', verb: 'logged in' },
  { key: 'creators', label: 'Built an app', verb: 'built an app' },
];

function SourceCard({ meta, source, wide, onSelect }) {
  const s = source ?? EMPTY;
  const empty = s.leads === 0;
  const avgActions = s.apps > 0 ? Math.round(s.actions / s.apps) : null;

  // With one source chosen its card is just a summary (not a button); with all five shown, a card picks its source.
  const Card = wide ? 'div' : 'button';
  const behaviour = wide
    ? { className: 'border-(--c-accent)/40' }
    : {
        type: 'button',
        onClick: onSelect,
        title: `Show only ${meta.label}`,
        className: 'cursor-pointer border-gray-200 transition hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(15,148,136,0.18)]',
      };

  return (
    <Card {...behaviour} className={`flex flex-col rounded-2xl border bg-white p-4 text-left shadow-[0_1px_3px_rgba(20,33,61,0.06)] ${behaviour.className}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: meta.color }} aria-hidden="true">
          <SourceIcon sourceKey={meta.key} letter={meta.letter} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{meta.label}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {s.platforms.map((name) => (
              <span key={name} className="rounded-full bg-(--c-band) px-2 py-0.5 text-[0.65rem] font-medium text-(--c-text-2)">{name}</span>
            ))}
          </div>
        </div>
      </div>

      {empty ? (
        <p className="mt-4 text-sm text-(--c-muted)">No leads in this period</p>
      ) : (
        <div className="mt-4 space-y-3.5">
          {STAGES.map((stage) => {
            const share = percent(s[stage.key], s.leads) ?? 0;
            return (
              <div key={stage.key}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-(--c-text)">{stage.label}</p>
                  <span className="rounded-full px-2 py-0.5 text-[0.7rem] font-bold tabular-nums text-white" style={{ background: meta.color }}>
                    {share}%
                  </span>
                </div>
                <p className="text-xs text-(--c-muted)">
                  {number(s[stage.key])} of {number(s.leads)} leads {stage.verb}
                </p>
                <div className="mt-1.5 h-2.5 rounded-full bg-(--c-track)">
                  <div className="animate-grow h-full origin-left rounded-full" style={{ width: `${share}%`, background: meta.color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-3.5 text-xs text-(--c-muted)">
        {empty || s.apps === 0 ? 'No apps created yet' : `${number(s.creators)} ${s.creators === 1 ? 'person' : 'people'} built ${number(s.apps)} app${s.apps === 1 ? '' : 's'}${avgActions !== null ? ` · ${number(avgActions)} actions per app on average` : ''}`}
      </p>
    </Card>
  );
}

/** Five cards, one per lead source, always in the same order. Clicking one filters the whole dashboard. */
function SourceQualityCards({ sources, selected, onSelect, loading, embedded = false }) {
  const chosen = SOURCES.find((meta) => meta.key === selected) ?? null; // one source picked: show only its card

  const body = loading && !sources ? (
    <div className="h-52 animate-pulse rounded-2xl bg-(--c-band)" />
  ) : (
    <>
      {!chosen && <p className="mb-3 text-xs text-(--c-muted)">Click a source to filter the whole dashboard.</p>}
      <div className={`stagger grid gap-4 ${chosen ? '' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'}`}>
        {(chosen ? [chosen] : SOURCES).map((meta) => (
          <SourceCard key={meta.key} meta={meta} source={sources?.find((s) => s.key === meta.key)} wide={Boolean(chosen)} onSelect={() => onSelect(meta.key)} />
        ))}
      </div>
    </>
  );

  if (embedded) return body;
  return (
    <section className="rounded-2xl border border-(--c-border) bg-(--c-band) p-4 sm:p-5">
      <h3 className="mb-1 text-sm font-semibold">Lead Source Quality</h3>
      {body}
    </section>
  );
}

export default SourceQualityCards;
