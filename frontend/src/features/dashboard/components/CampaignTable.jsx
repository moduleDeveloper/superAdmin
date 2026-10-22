import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';

import ScrollTable from '../../../components/ScrollTable';
import { COLORS } from '../../marketing/utils/leadStats';

const SMALL_SAMPLE = 10; // fewer leads than this and a percentage is too shaky to read much into

const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-(--c-muted)';
const number = (value) => value.toLocaleString('en-IN');
const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : null);

const BADGES = {
  Facebook: { text: 'Fb', color: COLORS.facebook },
  Instagram: { text: 'Ig', color: COLORS.instagram },
  Website: { text: 'Web', color: COLORS.website },
  'Google Ads': { text: 'Gs', color: COLORS.google },
  WhatsApp: { text: 'Wa', color: '#1fa855' },
  Organic: { text: 'Or', color: '#d63384' },
};

function Badge({ channel }) {
  const { text, color } = BADGES[channel] ?? { text: 'Ot', color: COLORS.other };
  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[0.7rem] font-bold text-white"
      style={{ background: color }}
      aria-hidden="true"
    >
      {text}
    </span>
  );
}

function Chevron({ open }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${open ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 8 5 5 5-5" />
    </svg>
  );
}

/** The numbers of one row (a campaign, or one of its platforms / ad sets). */
function NumberLink({ to, title, children }) {
  return (
    <Link
      to={to}
      state={{ backLabel: 'Dashboard' }}
      title={title}
      className="rounded-md px-1.5 py-0.5 font-semibold text-(--c-good) underline decoration-dotted underline-offset-4 hover:bg-(--c-good-bg)"
    >
      {children}
    </Link>
  );
}

/** `pathFor(stage)` is the page listing the people behind a number: all leads, or those who logged in ('loggedIn') / built an app ('app'). */
function Figures({ row, pathFor }) {
  const leadsTo = pathFor();
  const activeRate = percent(row.activeCreators, row.creators);
  const leadToApp = percent(row.creators, row.leads);
  const shaky = row.leads < SMALL_SAMPLE;

  return (
    <>
      <td className="px-4 py-3 tabular-nums text-(--c-text-2)">
        {leadsTo ? (
          <Link
            to={leadsTo}
            state={{ backLabel: 'Dashboard' }}
            title="See these leads"
            className="rounded-md px-1.5 py-0.5 font-semibold text-(--c-link) underline decoration-dotted underline-offset-4 hover:bg-(--c-accent-soft)"
          >
            {number(row.leads)}
          </Link>
        ) : (
          number(row.leads)
        )}
      </td>
      <td className="px-4 py-3 tabular-nums text-(--c-text-2)">
        {row.loggedIn > 0 ? (
          <NumberLink to={pathFor('loggedIn')} title="See the people who logged in">
            {number(row.loggedIn)}
          </NumberLink>
        ) : (
          number(row.loggedIn)
        )}
      </td>
      <td className="px-4 py-3 tabular-nums">
        {row.apps > 0 ? (
          <NumberLink to={pathFor('app')} title={`${number(row.creators)} people built ${number(row.apps)} app${row.apps === 1 ? '' : 's'}: see who`}>
            {number(row.apps)}
          </NumberLink>
        ) : (
          <span className="font-semibold">0</span>
        )}
      </td>
      <td className="px-4 py-3 font-semibold tabular-nums">{number(row.activeCreators)}</td>
      <td className="px-4 py-3">
        {activeRate === null ? (
          <span className="text-(--c-faint)">—</span>
        ) : (
          <div className={`flex items-center gap-3 ${shaky ? 'opacity-50' : ''}`} title={shaky ? 'Few leads: treat this percentage with care' : undefined}>
            <span className="h-2 w-24 rounded-full bg-(--c-track)">
              <span className="block h-full rounded-full bg-(--c-accent)" style={{ width: `${activeRate}%` }} />
            </span>
            <span className="w-9 text-right font-semibold tabular-nums">{activeRate}%</span>
          </div>
        )}
      </td>
      <td className={`px-4 py-3 font-semibold tabular-nums ${shaky ? 'text-(--c-faint)' : ''}`} title={shaky ? 'Few leads: treat this percentage with care' : undefined}>
        {leadToApp === null ? '—' : `${leadToApp}%`}
      </td>
    </>
  );
}

/** Sub-rows of a campaign; `field` ('platform' | 'adSet') narrows the lead page opened from a row's Leads number. */
function SubRows({ title, rows, leadsPath, field }) {
  if (rows.length === 0) return null;
  return (
    <>
      <tr className="bg-(--c-page)">
        <td colSpan={7} className="px-4 py-1.5 pl-16 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-(--c-muted)">
          {title}
        </td>
      </tr>
      {rows.map((row) => (
        <tr key={`${title}-${row.label}`} className="bg-(--c-page)">
          <td className="px-4 py-2.5 pl-16 text-(--c-text-2)">{row.label}</td>
          <Figures row={row} pathFor={(stage) => leadsPath({ [field]: row.label, ...(stage && { stage }) })} />
        </tr>
      ))}
    </>
  );
}

/**
 * Which campaign brings people who build and use apps. One row per campaign (leads with no campaign are grouped by
 * where they came from); a campaign opens to show the same numbers by platform and by ad set.
 */
function CampaignTable({ campaigns, scope, control, filter, sourceKey, embedded = false }) {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (label) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(label)) next.add(label);
      return next;
    });

  // The page listing the leads behind a row: this campaign (optionally one platform / ad set), for the period shown here.
  const leadsPath = (campaign, extra = {}) => {
    const params = new URLSearchParams({ campaign, ...(sourceKey && { source: sourceKey }), ...extra });
    if (filter?.range) params.set('range', filter.range);
    if (filter?.range === 'custom') {
      if (filter.from) params.set('from', filter.from);
      if (filter.to) params.set('to', filter.to);
    }
    return `/campaign-leads?${params}`;
  };

  return (
    <section className={embedded ? '' : 'rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,33,61,0.06)]'}>
      {!embedded && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-sm font-semibold">Campaign Performance{scope ? ` · ${scope}` : ''}</h3>
              {campaigns && <span className="rounded-full bg-(--c-accent-soft) px-2.5 py-0.5 text-xs font-semibold text-(--c-link)">{campaigns.length}</span>}
            </div>
            {control}
          </div>
          <p className="mt-1 text-xs text-(--c-muted)">
            Which campaign brings people who build and use apps · leads received in this period, followed through · matched by mobile number
          </p>
        </>
      )}

      {!campaigns ? (
        <div className="mt-4 h-40 animate-pulse rounded-xl bg-gray-50" />
      ) : campaigns.length === 0 ? (
        <p className="mt-4 rounded-xl border border-gray-200 px-4 py-10 text-center text-sm text-(--c-muted)">No leads in this period</p>
      ) : (
        <ScrollTable className="mt-4">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-(--c-page)">
              <tr>
                <th className={th}>Campaign</th>
                <th className={th}>Leads</th>
                <th className={th} title="People who logged in to the app">People Logged In</th>
                <th className={th} title="Total apps built by the people from this campaign (one person can build more than one)">Total Apps Created</th>
                <th className={th} title="People who built an app that has had activity">Active People</th>
                <th className={th} title="Of the people who created an app, how many have an app with activity">Active Rate</th>
                <th className={th} title="Of the leads, how many created an app">Lead → App</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {campaigns.map((campaign) => {
                const expandable = campaign.platforms.length > 1 || campaign.adSets.length > 0;
                const isOpen = open.has(campaign.label);

                return (
                  <Fragment key={campaign.label}>
                    <tr>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Badge channel={campaign.channels[0]} />
                          <div className="min-w-0">
                            <p className="font-semibold">{campaign.label}</p>
                            <p className="text-xs text-(--c-muted)">{campaign.channels.join(' · ')}</p>
                          </div>
                          {expandable && (
                            <button
                              type="button"
                              onClick={() => toggle(campaign.label)}
                              aria-expanded={isOpen}
                              title={isOpen ? 'Hide the split' : 'Split by platform and ad set'}
                              className="ml-auto inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-(--c-muted) hover:bg-gray-50"
                            >
                              <Chevron open={isOpen} />
                            </button>
                          )}
                        </div>
                      </td>
                      <Figures row={campaign} pathFor={(stage) => leadsPath(campaign.label, stage ? { stage } : {})} />
                    </tr>
                    {isOpen && (
                      <>
                        <SubRows title="By platform" rows={campaign.platforms} leadsPath={(extra) => leadsPath(campaign.label, extra)} field="platform" />
                        <SubRows title="By ad set" rows={campaign.adSets} leadsPath={(extra) => leadsPath(campaign.label, extra)} field="adSet" />
                      </>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </ScrollTable>
      )}
    </section>
  );
}

export default CampaignTable;
