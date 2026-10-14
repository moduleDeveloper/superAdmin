import { Fragment, useState } from 'react';

import ScrollTable from '../../../components/ScrollTable';
import { COLORS } from '../../marketing/utils/leadStats';

const SMALL_SAMPLE = 10; // fewer leads than this and a percentage is too shaky to read much into

const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-[#6b7188]';
const number = (value) => value.toLocaleString('en-IN');
const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : null);

const BADGES = {
  Facebook: { text: 'Fb', color: COLORS.facebook },
  Instagram: { text: 'Ig', color: COLORS.instagram },
  Website: { text: 'Web', color: COLORS.website },
  'Google Ads': { text: 'Gs', color: COLORS.google },
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
function Figures({ row }) {
  const activeRate = percent(row.activeCreators, row.creators);
  const leadToApp = percent(row.creators, row.leads);
  const shaky = row.leads < SMALL_SAMPLE;

  return (
    <>
      <td className="px-4 py-3 tabular-nums text-[#3a3f55]">{number(row.leads)}</td>
      <td className="px-4 py-3 tabular-nums text-[#3a3f55]">{number(row.loggedIn)}</td>
      <td className="px-4 py-3 tabular-nums">
        <span className="font-semibold">{number(row.creators)}</span>
        {row.apps > 0 && <span className="ml-1.5 text-xs text-[#7b8196]">{number(row.apps)} app{row.apps === 1 ? '' : 's'}</span>}
      </td>
      <td className="px-4 py-3 font-semibold tabular-nums">{number(row.activeCreators)}</td>
      <td className="px-4 py-3">
        {activeRate === null ? (
          <span className="text-[#9aa0b4]">—</span>
        ) : (
          <div className={`flex items-center gap-3 ${shaky ? 'opacity-50' : ''}`} title={shaky ? 'Few leads: treat this percentage with care' : undefined}>
            <span className="h-2 w-24 rounded-full bg-[#f3ece6]">
              <span className="block h-full rounded-full bg-[#e8793f]" style={{ width: `${activeRate}%` }} />
            </span>
            <span className="w-9 text-right font-semibold tabular-nums">{activeRate}%</span>
          </div>
        )}
      </td>
      <td className={`px-4 py-3 font-semibold tabular-nums ${shaky ? 'text-[#9aa0b4]' : ''}`} title={shaky ? 'Few leads: treat this percentage with care' : undefined}>
        {leadToApp === null ? '—' : `${leadToApp}%`}
      </td>
    </>
  );
}

function SubRows({ title, rows }) {
  if (rows.length === 0) return null;
  return (
    <>
      <tr className="bg-[#fbf6f3]">
        <td colSpan={7} className="px-4 py-1.5 pl-16 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[#7b8196]">
          {title}
        </td>
      </tr>
      {rows.map((row) => (
        <tr key={`${title}-${row.label}`} className="bg-[#fffaf7]">
          <td className="px-4 py-2.5 pl-16 text-[#3a3f55]">{row.label}</td>
          <Figures row={row} />
        </tr>
      ))}
    </>
  );
}

/**
 * Which campaign brings people who build and use apps. One row per campaign (leads with no campaign are grouped by
 * where they came from); a campaign opens to show the same numbers by platform and by ad set.
 */
function CampaignTable({ campaigns, loading, scope, control }) {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (label) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(label)) next.add(label);
      return next;
    });

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,33,61,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
        <h3 className="text-sm font-semibold">Campaign Performance{scope ? ` · ${scope}` : ''}</h3>
        {campaigns && <span className="rounded-full bg-[#fde6d6] px-2.5 py-0.5 text-xs font-semibold text-[#b04a4f]">{campaigns.length}</span>}
        </div>
        {control}
      </div>
      <p className="mt-1 text-xs text-[#7b8196]">
        Which campaign brings people who build and use apps · leads received in this period, followed through · matched by mobile number
      </p>

      {loading && !campaigns ? (
        <div className="mt-4 h-40 animate-pulse rounded-xl bg-gray-50" />
      ) : campaigns.length === 0 ? (
        <p className="mt-4 rounded-xl border border-gray-200 px-4 py-10 text-center text-sm text-[#7b8196]">No leads in this period</p>
      ) : (
        <ScrollTable className="mt-4">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-[#fbf6f3]">
              <tr>
                <th className={th}>Campaign</th>
                <th className={th}>Leads</th>
                <th className={th}>Logged In</th>
                <th className={th}>Apps Created</th>
                <th className={th}>Active</th>
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
                            <p className="text-xs text-[#7b8196]">{campaign.channels.join(' · ')}</p>
                          </div>
                          {expandable && (
                            <button
                              type="button"
                              onClick={() => toggle(campaign.label)}
                              aria-expanded={isOpen}
                              title={isOpen ? 'Hide the split' : 'Split by platform and ad set'}
                              className="ml-auto inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-[#6b7188] hover:bg-gray-50"
                            >
                              <Chevron open={isOpen} />
                            </button>
                          )}
                        </div>
                      </td>
                      <Figures row={campaign} />
                    </tr>
                    {isOpen && (
                      <>
                        <SubRows title="By platform" rows={campaign.platforms} />
                        <SubRows title="By ad set" rows={campaign.adSets} />
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
