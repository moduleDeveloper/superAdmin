import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import ScrollTable from '../../../components/ScrollTable';
import { formatTimestamp } from '../../trust-insights/utils/chart';
import { periodQuery } from '../../member-insights/utils/periodQuery';
import { COLORS } from '../../marketing/utils/leadStats';
import SourceSelect from './SourceSelect';

const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-[#6b7188]';
const number = (value) => value.toLocaleString('en-IN');

const SOURCE_COLORS = { 'Meta Ads': COLORS.facebook, 'Google Ads': COLORS.google, Website: COLORS.website };
const LOGIN_METHODS = { otp: 'Mobile OTP verified', secret_code: 'Secret code' };
const PLATFORMS = { android: 'Android', ios: 'iOS', web: 'Web' };

const platformName = (value) => PLATFORMS[value] ?? value ?? null;

/** The detail pages behind the two activity numbers (both open on the Dashboard's period; back returns here). */
const appActionsPath = (app, filter) => `/trust-insights/${app.id}/member-actions${periodQuery(filter)}`;
const userPanelPath = (app, filter) => `/trust-insights/${app.id}${periodQuery(filter)}`;
const fromDashboard = { backLabel: 'Dashboard', section: '/' };

function CameFrom({ from }) {
  if (!from) return <span className="text-xs text-[#9aa0b4]">Direct / unknown</span>;
  const color = SOURCE_COLORS[from.source] ?? COLORS.other;
  return (
    <div>
      <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ background: color }}>
        {from.source.replace(' Ads', '')}
      </span>
      {from.platform !== from.source && <p className="mt-0.5 text-xs text-[#7b8196]">{from.platform}</p>}
    </div>
  );
}

function Step({ index, title, detail, time, last }) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!last && <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-0.5 bg-[#f0d9c9]" aria-hidden="true" />}
      <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ee7b3e] to-[#b04a4f] text-sm font-bold text-white">
        {index}
      </span>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        {detail && <p className="mt-0.5 text-sm text-[#5b627a]">{detail}</p>}
        {time && <p className="mt-0.5 text-xs text-[#7b8196]">{time}</p>}
      </div>
    </li>
  );
}

/** One app's journey from the first ad click to its use, in the steps the data can back. */
function JourneyDrawer({ app, filter, onClose }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const { cameFrom, firstLogin } = app;
  const place = [firstLogin?.city, firstLogin?.state].filter(Boolean).join(', ');
  const who = [app.owner, platformName(firstLogin?.platform), place].filter(Boolean).join(' · ');

  const steps = [
    cameFrom && {
      title: 'Clicked an ad',
      detail: [cameFrom.source, cameFrom.platform !== cameFrom.source && cameFrom.platform, cameFrom.campaign].filter(Boolean).join(' · '),
      time: formatTimestamp(cameFrom.receivedAt),
    },
    firstLogin && {
      title: 'Logged in',
      detail: [LOGIN_METHODS[firstLogin.method] ?? firstLogin.method, platformName(firstLogin.platform)].filter(Boolean).join(' · '),
      time: formatTimestamp(firstLogin.at),
    },
    { title: 'Created own app', detail: `${app.name} is live`, time: formatTimestamp(app.createdAt) },
    {
      title: 'Used app & User Panel',
      detail: `${number(app.appActions)} app actions · ${number(app.userPanel)} panel activities in this period`,
      time: app.lastActiveAt ? `Last active ${formatTimestamp(app.lastActiveAt)}` : null,
    },
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`${app.name} journey`}>
      <button type="button" className="absolute inset-0 cursor-default bg-black/30" onClick={onClose} aria-label="Close" tabIndex={-1} />

      <aside className="relative flex h-full w-full max-w-[26rem] flex-col overflow-y-auto bg-[#fffaf7] p-6 shadow-[-20px_0_60px_rgba(80,40,60,0.18)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#b04a4f]">Client journey</p>
            <h3 className="mt-2 break-words text-xl font-bold tracking-tight">{app.name}</h3>
            {who && <p className="mt-1 text-sm text-[#5b627a]">{who}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-lg text-[#3a3f55] shadow hover:bg-gray-50"
            aria-label="Close"
            autoFocus
          >
            ×
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {[
            ['App actions', app.appActions, appActionsPath(app, filter), 'See what members did in this app'],
            ['User Panel', app.userPanel, userPanelPath(app, filter), 'See what the app\'s users did'],
            ['Logins', app.logins],
          ].map(([label, value, to, hint]) => {
            const tile = (
              <>
                <p className="text-[0.7rem] text-[#6b7188]">{label}</p>
                <p className={`text-lg font-bold tabular-nums ${to && value > 0 ? 'text-[#b04a4f]' : ''}`}>{number(value)}</p>
              </>
            );
            return to && value > 0 ? (
              <Link key={label} to={to} state={fromDashboard} title={hint} className="rounded-xl bg-[#f8ece4] px-3 py-2.5 transition hover:bg-[#fde6d6]">
                {tile}
              </Link>
            ) : (
              <div key={label} className="rounded-xl bg-[#f8ece4] px-3 py-2.5">
                {tile}
              </div>
            );
          })}
        </div>

        <ol className="mt-7">
          {steps.map((step, i) => (
            <Step key={step.title} index={i + 1} {...step} last={i === steps.length - 1} />
          ))}
        </ol>

      </aside>
    </div>
  );
}

const SCOPE_LABELS = {
  all: 'All apps',
  meta: 'Meta Ads',
  google: 'Google Ads',
  website: 'Website',
  other: 'Other sources',
  direct: 'Direct (no ad lead)',
};

/**
 * The busiest apps in the period, ranked by App actions (members) + User Panel (registered users).
 * The dropdown limits them to one ad source, or to apps whose owner came without an ad lead; the ranking is done
 * inside that group. Click an app name to see its journey.
 */
function MostActiveApps({ apps, scopeCounts, scope, onScopeChange, filter, loading }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = apps?.find((app) => app.id === selectedId) ?? null;
  const peak = Math.max(1, ...(apps ?? []).map((app) => app.score));

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,33,61,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
        <h3 className="text-sm font-semibold">Most Active Apps{scope !== 'all' ? ` · ${SCOPE_LABELS[scope]}` : ''}</h3>
        {apps && <span className="rounded-full bg-[#fde6d6] px-2.5 py-0.5 text-xs font-semibold text-[#b04a4f]">{apps.length}</span>}
        </div>
        <SourceSelect
          label="Show apps from"
          value={scope}
          onChange={onScopeChange}
          options={Object.entries(SCOPE_LABELS)
            // a group with no apps is left out, except the one currently chosen
            .filter(([key]) => key === 'all' || key === scope || (scopeCounts?.[key] ?? 0) > 0)
            .map(([key, label]) => ({ value: key, label: scopeCounts ? `${label} (${scopeCounts[key] ?? 0})` : label }))}
        />
      </div>
      <p className="mt-1 text-xs text-[#7b8196]">
        Ranked by App actions + User Panel activity in this period · click an app name for its journey, or a number for the detail
      </p>

      {loading && !apps ? (
        <div className="mt-4 h-52 animate-pulse rounded-xl bg-gray-50" />
      ) : apps.length === 0 ? (
        <p className="mt-4 rounded-xl border border-gray-200 px-4 py-10 text-center text-sm text-[#7b8196]">{scope === 'all' ? 'No app activity in this period' : `No active apps from ${SCOPE_LABELS[scope]} in this period`}</p>
      ) : (
        <ScrollTable className="mt-4">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-[#fbf6f3]">
              <tr>
                <th className={th}>#</th>
                <th className={th}>App</th>
                <th className={th}>Came from</th>
                <th className={th}>Campaign</th>
                <th className={th}>App actions</th>
                <th className={th}>User Panel</th>
                <th className={th}>Logins</th>
                <th className={th}>Last active</th>
                <th className={th}>Activity score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {apps.map((app, i) => (
                <tr key={app.id}>
                  <td className="px-4 py-3">
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${i === 0 ? 'bg-gradient-to-br from-[#ee7b3e] to-[#b04a4f] text-white' : 'bg-[#f3ece6] text-[#6b7188]'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setSelectedId(app.id)} className="cursor-pointer text-left font-semibold hover:text-[#b04a4f] hover:underline">
                      {app.name}
                    </button>
                    {app.owner && <p className="text-xs text-[#7b8196]">{app.owner}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <CameFrom from={app.cameFrom} />
                  </td>
                  <td className="max-w-[14rem] px-4 py-3 text-xs text-[#3a3f55]">{app.cameFrom?.campaign ?? <span className="text-[#9aa0b4]">—</span>}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {app.appActions > 0 ? (
                      <Link to={appActionsPath(app, filter)} state={fromDashboard} title="See what members did in this app" className="hover:underline">
                        {number(app.appActions)}
                      </Link>
                    ) : (
                      '0'
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-[#b04a4f]">
                    {app.userPanel > 0 ? (
                      <Link to={userPanelPath(app, filter)} state={fromDashboard} title="See what the app's users did" className="hover:underline">
                        {number(app.userPanel)}
                      </Link>
                    ) : (
                      '0'
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-[#3a3f55]">{number(app.logins)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-[#3a3f55]">{app.lastActiveAt ? formatTimestamp(app.lastActiveAt) : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-2 w-20 rounded-full bg-[#f3ece6]">
                        <span className="block h-full rounded-full bg-gradient-to-r from-[#ee7b3e] to-[#b04a4f]" style={{ width: `${(app.score / peak) * 100}%` }} />
                      </span>
                      <span className="font-bold tabular-nums">{number(app.score)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      )}

      {selected && <JourneyDrawer app={selected} filter={filter} onClose={() => setSelectedId(null)} />}
    </section>
  );
}

export default MostActiveApps;
