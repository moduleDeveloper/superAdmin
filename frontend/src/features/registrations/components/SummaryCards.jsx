import { formatPercent, percentOf } from '../../../utils/percent';

const ICONS = {
  registrations: <path d="M16 11a4 4 0 1 0-8 0M4 20c.7-3.6 3.6-6 8-6s7.3 2.4 8 6M19 8v6M22 11h-6" />,
  leads: <path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" />,
  loggedIn: <path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5M10 8l4 4-4 4M14 12H3" />,
  apps: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <path d="M17.25 14v6.5M14 17.25h6.5" />
    </>
  ),
};

const TONES = {
  registrations: { tile: 'from-teal-400 to-cyan-600', ring: 'hover:shadow-[0_12px_28px_rgba(13,148,136,0.22)]', bar: 'bg-teal-500' },
  leads: { tile: 'from-blue-400 to-indigo-600', ring: 'hover:shadow-[0_12px_28px_rgba(79,70,229,0.2)]', bar: 'bg-indigo-500' },
  loggedIn: { tile: 'from-emerald-400 to-green-600', ring: 'hover:shadow-[0_12px_28px_rgba(22,163,74,0.2)]', bar: 'bg-green-500' },
  apps: { tile: 'from-amber-400 to-orange-500', ring: 'hover:shadow-[0_12px_28px_rgba(245,158,11,0.24)]', bar: 'bg-amber-500' },
};

const num = (value) => (value ?? 0).toLocaleString('en-IN');
const percent = (part, whole) => percentOf(part, whole) ?? 0;

function Card({ tone, label, value, note, share, loading }) {
  const style = TONES[tone];
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,33,61,0.06)] transition duration-200 hover:-translate-y-0.5 ${style.ring}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-(--c-muted)">{label}</p>
          {loading ? <div className="mt-2 h-9 w-24 animate-pulse rounded bg-gray-100" /> : <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">{value}</p>}
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm ${style.tile}`}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {ICONS[tone]}
          </svg>
        </span>
      </div>
      <p className="mt-2 min-h-5 text-sm text-(--c-text-3)">{loading ? '' : note}</p>
      {share !== undefined && !loading && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100" role="presentation">
          <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${Math.min(100, share)}%` }} />
        </div>
      )}
    </div>
  );
}

/** Leads for the period, and how many of those leads logged in and created an app. */
function SummaryCards({ summary, loading }) {
  const s = summary ?? {};
  return (
    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card tone="leads" label="Leads" value={num(s.leads)} note="Enquiries received from ads and the website" loading={loading} />
      <Card
        tone="loggedIn"
        label="Logged in"
        value={num(s.loggedIn)}
        note={`Out of ${num(s.leads)} leads · ${formatPercent(percent(s.loggedIn, s.leads))}%`}
        share={percent(s.loggedIn, s.leads)}
        loading={loading}
      />
      <Card
        tone="apps"
        label="Apps created"
        value={num(s.apps)}
        note={`${num(s.creators)} ${s.creators === 1 ? 'person' : 'people'} · ${formatPercent(percent(s.creators, s.leads))}% of leads`}
        share={percent(s.creators, s.leads)}
        loading={loading}
      />
    </div>
  );
}

export default SummaryCards;
