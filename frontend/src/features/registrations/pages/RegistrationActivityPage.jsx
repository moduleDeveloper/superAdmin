import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';

import BackLink from '../../../components/BackLink';
import { formatDateTime } from '../../../utils/formatDate';
import { useRegistrationTimeline } from '../hooks/useRegistrations';

const KINDS = {
  registered: 'bg-(--c-accent)',
  login: 'bg-green-500',
  logout: 'bg-gray-400',
  app_created: 'bg-amber-500',
  app_clicked: 'bg-blue-500',
  app_launched: 'bg-blue-500',
  create_new_app_clicked: 'bg-amber-400',
  app_creation_started: 'bg-amber-400',
  launch_failed: 'bg-red-500',
};

const STAGES = {
  registered: { label: 'Registered only', hint: 'Signed up but has never logged in.', className: 'bg-gray-100 text-(--c-text-2)' },
  loggedIn: { label: 'Logged in', hint: 'Logged in but has not created an app yet.', className: 'bg-blue-50 text-blue-700' },
  appCreated: { label: 'App created', hint: 'Created an app but has not used it yet.', className: 'bg-amber-50 text-amber-700' },
  active: { label: 'Active', hint: 'Created an app and is using it.', className: 'bg-green-50 text-green-700' },
};

const PANELS = { app: 'App', user_panel: 'User Panel' };
const PANEL_STYLE = { app: 'bg-blue-50 text-blue-700', user_panel: 'bg-violet-50 text-violet-700' };
// The page's sections, as shortcuts in the top bar: each scrolls to its card.
const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'last-activity', label: 'Last Activity' },
  { id: 'app-actions', label: 'App Actions' },
  { id: 'timeline', label: 'Timeline' },
];
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'app', label: 'App' },
  { value: 'user_panel', label: 'User Panel' },
  { value: 'session', label: 'Logins' },
];

const card = 'rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(20,33,61,0.06)] sm:p-5';
const dash = <span className="text-(--c-faint)">—</span>;

/** "5 minutes ago", "3 days ago": how long ago something happened. */
function timeAgo(value) {
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const units = [
    [60, 'minute'],
    [3600, 'hour'],
    [86400, 'day'],
  ];
  let [size, name] = units[0];
  for (const unit of units) if (seconds >= unit[0]) [size, name] = unit;
  const n = Math.floor(seconds / size);
  return `${n} ${name}${n === 1 ? '' : 's'} ago`;
}

function Detail({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-(--c-muted)">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium">{children || dash}</dd>
    </div>
  );
}

/** One person's whole journey: who they are, where they were last seen, how often they went to each app / page, and every step. */
function RegistrationActivityPage() {
  const { memberId } = useParams();
  const { data, loading, error } = useRegistrationTimeline(memberId);
  const [filter, setFilter] = useState('all');

  const [slot, setSlot] = useState(null);
  useEffect(() => {
    setSlot(document.getElementById('topbar-slot'));
    window.scrollTo(0, 0);
  }, []);

  const events = useMemo(() => {
    if (!data) return [];
    if (filter === 'all') return data.events;
    if (filter === 'session') return data.events.filter((e) => ['login', 'logout', 'session', 'registered'].includes(e.kind));
    return data.events.filter((e) => e.panel === filter);
  }, [data, filter]);

  // the apps they created (even if unused), with what they did in each. What they did in the other apps they used (like Setu AI)
  // is added to the App side of the newest app they created; with no app of their own those apps are listed on their own.
  const appRows = useMemo(() => {
    if (!data) return [];
    const visits = new Map(data.appVisits.map((v) => [v.id, v]));
    const owned = (data.ownedApps ?? []).map((app) => {
      const v = visits.get(app.id);
      visits.delete(app.id);
      return { id: app.id, name: app.name, owned: true, createdAt: app.createdAt, opens: app.opens, logins: v?.logins ?? 0, actions: app.actions, lastAt: app.lastAt, pages: v?.pages ?? [] };
    });
    const others = [...visits.values()].map((v) => ({ ...v, owned: false, createdAt: null }));
    if (owned.length === 0) return others;

    const [first, ...rest] = owned;
    const platformPages = others.flatMap((other) => other.pages.filter((page) => page.panel === 'app').map((page) => ({ ...page, from: other.name })));
    const sum = (key) => others.reduce((n, other) => n + other[key], 0);
    return [
      { ...first, opens: first.opens + sum('opens'), logins: first.logins + sum('logins'), actions: first.actions + sum('actions'), platformPages },
      ...rest,
    ];
  }, [data]);

  const member = data?.member;
  const summary = data?.summary;
  const stage = STAGES[data?.stage] ?? STAGES.registered;
  const last = data?.lastActivity;
  const lastByPanel = data?.lastByPanel; // newest step in the App and in the User Panel
  // which section is on screen, so its shortcut in the top bar is highlighted
  const [current, setCurrent] = useState('profile');
  const ready = Boolean(data);
  useEffect(() => {
    if (!ready) return undefined;
    const seen = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => seen.set(entry.target.id, entry.isIntersecting));
        const first = SECTIONS.find(({ id }) => seen.get(id));
        if (first) setCurrent(first.id);
      },
      { rootMargin: '-80px 0px -55% 0px' }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ready]);
  const goTo = (id) => {
    setCurrent(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const location = member && [member.city, member.state, member.country].filter(Boolean).join(', ');
  const displayName = member ? member.name || member.mobile || 'Unnamed user' : 'User activity';

  return (
    <div className="mx-auto max-w-5xl">
      {slot &&
        createPortal(
          <div className="shrink-0 whitespace-nowrap">
            <BackLink to="/registrations" label="Back to Registrations" button />
          </div>,
          slot
        )}
      {slot &&
        data &&
        createPortal(
          <nav className="scrollbar-none hidden min-w-0 flex-1 items-center justify-center gap-6 overflow-x-auto sm:gap-8 md:flex" aria-label="Sections of this page">
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                aria-current={current === id ? 'true' : undefined}
                className={`h-10 shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-1 text-sm font-medium transition-colors ${
                  current === id ? 'border-(--c-accent) font-semibold text-(--c-link)' : 'border-transparent text-(--c-text-2) hover:border-gray-300 hover:text-(--c-text)'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>,
          slot
        )}

      {data && (
        <nav className="scrollbar-none sticky top-16 z-10 -mx-1 mt-3 flex gap-2 overflow-x-auto bg-(--c-page)/95 px-1 py-2 backdrop-blur md:hidden" aria-label="Sections of this page">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => goTo(id)}
              aria-current={current === id ? 'true' : undefined}
              className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                current === id ? 'border-(--c-accent) bg-(--c-accent-soft) text-(--c-link)' : 'border-gray-200 bg-white text-(--c-text-2)'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      {error && (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {loading && !data && <div className="mt-5 h-56 animate-pulse rounded-2xl bg-gray-100" />}

      {data && (
        <>
          {/* who this is, and how far they got */}
          <section id="profile" className={`${card} mt-4 scroll-mt-32 md:scroll-mt-20 animate-page`}>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-(--c-grad-from) to-(--c-grad-to) text-2xl font-bold text-white shadow-sm">
                {displayName.trim().slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${stage.className}`}>{stage.label}</span>
                </div>
                <p className="mt-0.5 text-sm text-(--c-text-3)">
                  {[member.name && member.mobile, `Registered ${formatDateTime(member.registeredAt)}`].filter(Boolean).join(' · ')}
                </p>
              </div>
              {/* the numbers, as one strip instead of four cards */}
              <dl className="grid w-full grid-cols-2 gap-px overflow-hidden rounded-xl bg-gray-200 sm:flex sm:gap-0 sm:divide-x sm:divide-gray-200 sm:bg-(--c-page) lg:w-auto">
                {[
                  ['Logins', summary.logins],
                  ['Apps created', summary.apps],
                  ['App actions', summary.appActions],
                  ['User Panel actions', summary.panelActions],
                ].map(([label, value]) => (
                  <div key={label} className="bg-(--c-page) px-3 py-2 text-center sm:flex-1 sm:px-4 lg:min-w-24">
                    <dd className="text-2xl font-bold tabular-nums">{value.toLocaleString('en-IN')}</dd>
                    <dt className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-(--c-muted)">{label}</dt>
                  </div>
                ))}
              </dl>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-gray-200 pt-5 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <Detail label="Mobile">{member.mobile}</Detail>
              <Detail label="Email">{member.email}</Detail>
              <Detail label="Company">{member.company}</Detail>
              <Detail label="Location">{location}</Detail>
              <Detail label="Address">{member.address}</Detail>
              <Detail label="Came from">{[member.source, member.subSource].filter(Boolean).join(' · ')}</Detail>
              <Detail label="Campaign">{member.campaign}</Detail>
              <Detail label="Device">{[member.device, member.platform].filter(Boolean).join(' · ')}</Detail>
              <Detail label="Apps created">{data.ownedApps?.map((app) => app.name).join(', ')}</Detail>
              <Detail label="Last login">{member.lastLoginAt ? `${formatDateTime(member.lastLoginAt)} (${timeAgo(member.lastLoginAt)})` : null}</Detail>
              <Detail label="App downloaded">{member.appDownloaded ? 'Yes' : 'No'}</Detail>
              <Detail label="Registered">{formatDateTime(member.registeredAt)}</Detail>
            </dl>
          </section>

          {/* where they stopped: the App and the User Panel side by side */}
          {last && (
            <section id="last-activity" className="mt-4 scroll-mt-32 md:scroll-mt-20 animate-page rounded-2xl border border-amber-200 bg-amber-50 p-5 [animation-delay:80ms]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-amber-700">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                  </span>
                  Last activity · where they may be stuck
                </p>
                <p className="text-sm font-medium text-amber-800">{stage.hint}</p>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {(lastByPanel?.app || lastByPanel?.user_panel ? ['app', 'user_panel'].map((key) => lastByPanel[key] ?? { panel: key, empty: true }) : [last]).map((item) => (
                  <div key={item.panel ?? 'last'} className="rounded-xl bg-white/70 p-4 transition hover:bg-white">
                    {item.panel && (
                      <p className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-amber-700">
                        <span className={`rounded-full px-2.5 py-0.5 ${PANEL_STYLE[item.panel]}`}>{PANELS[item.panel]}</span>
                        Stuck in the {PANELS[item.panel]}
                      </p>
                    )}
                    {item.empty ? (
                      <p className="mt-2 text-sm text-amber-900/80">No activity yet</p>
                    ) : (
                      <>
                        <p className="mt-2 text-lg font-bold leading-tight text-amber-950">{item.title}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-amber-900">
                          {item.appName && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold">{item.appName}</span>}
                          {item.pageName && item.title !== `Opened ${item.pageName}` && <span>on {item.pageName}</span>}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-amber-800">
                          {formatDateTime(item.at)} · {timeAgo(item.at)}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* every app in one place: the ones they made, how much each was used and which pages they opened */}
          <section id="app-actions" className={`${card} mt-4 scroll-mt-32 md:scroll-mt-20 animate-page [animation-delay:160ms]`}>
            <h2 className="text-lg font-bold">App actions</h2>
            {appRows.length === 0 ? (
              <p className="mt-3 text-sm text-(--c-muted)">No app activity yet.</p>
            ) : (
              <ul className="stagger mt-3 divide-y divide-gray-100">
                {appRows.map((app) => {
                  const unused = !app.actions && !app.logins;
                  return (
                    <li key={app.id} className={`py-4 first:pt-0 last:pb-0 ${app.owned ? '' : 'opacity-90'}`}>
                      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold ${app.owned ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{app.name.slice(0, 1).toUpperCase()}</span>
                      <div className="min-w-0 flex-1 basis-56">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="break-words font-bold">{app.name}</span>
                          {app.owned && <span className="rounded-full bg-amber-50 px-2 py-px text-[0.65rem] font-bold text-amber-700">Created by them</span>}
                          {!app.owned && <span className="rounded-full bg-blue-50 px-2 py-px text-[0.65rem] font-bold text-blue-700">Platform app</span>}
                          {unused && <span className="rounded-full bg-gray-100 px-2 py-px text-[0.65rem] font-bold text-(--c-muted)">Not used yet</span>}
                        </p>
                        <p className="text-xs text-(--c-muted)">
                          {[app.createdAt && `Created ${formatDateTime(app.createdAt)}`, app.lastAt && `last used ${timeAgo(app.lastAt)}`].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <div className="grid w-full shrink-0 grid-cols-3 gap-2 text-center sm:w-auto">
                        {[
                          ['Opened', app.opens, 'times opened from their app list'],
                          ['Logins', app.logins, 'times logged in to this app'],
                          ['Actions', app.actions, 'total taps and pages seen inside'],
                        ].map(([label, value, hint]) => (
                          <div key={label} title={`${value} ${hint}`} className="min-w-0 rounded-xl bg-(--c-page) px-2 py-1.5 sm:min-w-[4.5rem]">
                            <p className={`text-lg font-bold tabular-nums leading-none ${value === 0 ? 'text-(--c-faint)' : ''}`}>{value}</p>
                            <p className="mt-1 text-[0.6rem] font-bold uppercase tracking-wide text-(--c-muted)">{label}</p>
                          </div>
                        ))}
                      </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:ml-14 sm:grid-cols-2">
                        {['app', 'user_panel'].map((panel) => {
                          const pages = [...app.pages.filter((page) => page.panel === panel), ...(panel === 'app' ? app.platformPages ?? [] : [])];
                          if (!app.owned && pages.length === 0) return null; // someone else's app: only show where they actually went
                          return (
                            <div key={panel} className="rounded-xl bg-(--c-page) p-3">
                              <p className="flex items-center gap-2 text-xs font-bold">
                                <span className={`rounded-full px-2 py-px text-[0.65rem] ${PANEL_STYLE[panel]}`}>{PANELS[panel]}</span>
                                <span className="text-(--c-muted)">{pages.length ? `${pages.reduce((n, page) => n + page.count, 0)} views` : ''}</span>
                              </p>
                              {pages.length ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {pages.map((page) => (
                                    <span key={`${page.from ?? ''}:${page.name}`} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium shadow-[0_1px_2px_rgba(20,33,61,0.06)] transition hover:shadow-sm ${page.from ? 'bg-blue-50' : 'bg-white'}`}>
                                      {page.from && <span className="font-bold text-blue-700">{page.from} ·</span>}
                                      {page.name}
                                      <b className="tabular-nums text-(--c-text-2)">{page.count}×</b>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-2 text-xs text-(--c-faint)">No activity</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* every step */}
          <section id="timeline" className={`${card} mt-4 scroll-mt-32 md:scroll-mt-20 animate-page [animation-delay:240ms]`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Activity timeline</h2>
              <div className="inline-flex gap-1 rounded-xl bg-(--c-page) p-1" role="group" aria-label="Filter the timeline">
                {FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={filter === value}
                    onClick={() => setFilter(value)}
                    className={`cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                      filter === value ? 'bg-gradient-to-r from-(--c-grad-from) via-(--c-grad-via) to-(--c-grad-to) text-white shadow-sm' : 'text-(--c-text-2) hover:bg-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {data.truncated && <p className="mt-1 text-xs text-(--c-muted)">Showing the latest {data.events.length} steps.</p>}

            {events.length === 0 ? (
              <p className="mt-4 text-sm text-(--c-muted)">Nothing here yet.</p>
            ) : (
              <ol className="stagger mt-5 flex flex-col">
                {events.map((event, index) => (
                  <li key={event.id} className="relative flex gap-4 pb-5 last:pb-0">
                    {index < events.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-gray-200" aria-hidden="true" />}
                    <span className={`relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ${KINDS[event.kind] ?? 'bg-gray-300'}`} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <p className="flex flex-wrap items-center gap-2 font-semibold">
                          {event.title}
                          {event.panel && <span className={`rounded-full px-2 py-px text-[0.65rem] font-bold ${PANEL_STYLE[event.panel]}`}>{PANELS[event.panel]}</span>}
                        </p>
                        <p className="whitespace-nowrap text-xs text-(--c-muted)">{formatDateTime(event.at)}</p>
                      </div>
                      <p className="text-sm text-(--c-text-3)">{[event.appName && `App: ${event.appName}`, event.detail].filter(Boolean).join(' · ')}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default RegistrationActivityPage;
