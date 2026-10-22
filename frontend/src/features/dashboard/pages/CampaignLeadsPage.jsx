import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import BackLink from '../../../components/BackLink';
import PeriodFilter from '../../../components/PeriodFilter';
import Pagination from '../../../components/Pagination';
import ScrollTable from '../../../components/ScrollTable';
import SearchInput from '../../../components/SearchInput';
import SortableTh, { HeadCell } from '../../../components/SortableTh';
import { formatDateTime } from '../../../utils/formatDate';
import { periodQuery } from '../../member-insights/utils/periodQuery';
import { useCampaignLeads } from '../hooks/useCampaignLeads';

const STAGES = {
  lead: { label: 'Lead only', className: 'bg-gray-100 text-(--c-muted)' },
  member: { label: 'Joined', className: 'bg-(--c-accent-soft) text-(--c-link)' },
  loggedIn: { label: 'Logged in', className: 'bg-(--c-accent-soft) text-(--c-link)' },
  app: { label: 'Created app', className: 'bg-amber-50 text-amber-700' },
  active: { label: 'App in use', className: 'bg-green-50 text-green-700' },
};

const COLUMNS = 6;
const BADGE = 'rounded-full px-2.5 py-0.5 text-xs font-semibold';

/** Where a lead's badge leads: one app opens its activity, several open the member's list of apps; earlier steps have no app to open. */
function appPath(lead, period) {
  if (!lead.memberId || !lead.appIds?.length) return null;
  const query = periodQuery(period);
  return lead.appIds.length === 1
    ? `/member-insights/${lead.memberId}/apps/${lead.appIds[0]}/activity${query}`
    : `/member-insights/${lead.memberId}/apps${query}`;
}

/** The individual leads behind a campaign (or one of its platforms / ad sets), searchable and sortable by when they came in. */
function CampaignLeadsPage() {
  const [params] = useSearchParams();
  const target = {
    campaign: params.get('campaign') ?? '',
    source: params.get('source') || undefined,
    platform: params.get('platform') || undefined,
    adSet: params.get('adSet') || undefined,
    stage: ['loggedIn', 'app'].includes(params.get('stage')) ? params.get('stage') : undefined, // opened from the Logged In / Apps Created column
  };

  // opens on the period chosen on the dashboard
  const [period, setPeriod] = useState(() => ({
    range: params.get('range') || '7d',
    from: params.get('from') || undefined,
    to: params.get('to') || undefined,
  }));

  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState({ key: 'receivedAt', dir: 'desc' });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(input.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);

  const { data, loading, error } = useCampaignLeads(period, target, { search, page, pageSize, sort: sort.dir });
  const total = data?.total ?? 0;

  const onSort = (key) => {
    setSort((current) => ({ key, dir: current.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(1);
  };

  const scope = [target.platform, target.adSet].filter(Boolean).join(' · ');
  const stageTitle = { loggedIn: 'who logged in', app: 'who built an app' }[target.stage];
  const summary = data?.summary;
  const stageSummary =
    summary && (target.stage === 'app'
      ? `${summary.people.toLocaleString('en-IN')} ${summary.people === 1 ? 'person' : 'people'} built ${summary.apps.toLocaleString('en-IN')} app${summary.apps === 1 ? '' : 's'} in total`
      : `${summary.people.toLocaleString('en-IN')} ${summary.people === 1 ? 'person' : 'people'} logged in to the app`);

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink to="/" label="Back to Dashboard" />
      <h1 className="mt-3 text-3xl font-bold tracking-tight">{target.campaign || 'Campaign'} leads{stageTitle ? ` ${stageTitle}` : ''}</h1>
      <p className="mt-1 text-(--c-text-3)">
        {[stageSummary, scope].filter(Boolean).join(' · ') || 'Every lead this campaign brought in the selected period, and how far each one got.'}
      </p>

      {!target.campaign ? (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          No campaign selected. Open this page from the Campaign Performance table.
        </p>
      ) : (
        <>
          {error && (
            <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,33,61,0.06)]">
            <p className="text-sm font-semibold">Leads received</p>
            <div className="mt-2">
              <PeriodFilter
                filter={period}
                onChange={(patch) => {
                  setPeriod((prev) => ({
                    ...prev,
                    ...patch,
                    ...(patch.range && patch.range !== 'custom' ? { from: undefined, to: undefined } : {}),
                  }));
                  setPage(1);
                }}
              />
            </div>
          </div>

          <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,33,61,0.06)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-semibold">Leads</h2>
                {data && <span className="rounded-full bg-(--c-accent-soft) px-2.5 py-0.5 text-xs font-semibold text-(--c-link)">{total.toLocaleString('en-IN')}</span>}
              </div>
              <div className="sm:w-72">
                <SearchInput value={input} onChange={setInput} placeholder="Search name or mobile number" label="Search leads" />
              </div>
            </div>

            <ScrollTable className="mt-4">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr>
                    <HeadCell>Name</HeadCell>
                    <HeadCell>Mobile</HeadCell>
                    <HeadCell>Platform</HeadCell>
                    <HeadCell>Ad Set</HeadCell>
                    <SortableTh label="Received At" sortKey="receivedAt" sort={sort} onSort={onSort} />
                    <HeadCell>Progress</HeadCell>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-gray-200 ${loading && data ? 'opacity-60' : ''}`}>
                  {!data &&
                    loading &&
                    Array.from({ length: 6 }, (_, i) => (
                      <tr key={i}>
                        <td colSpan={COLUMNS} className="px-4 py-3.5">
                          <div className="h-5 animate-pulse rounded bg-gray-100" />
                        </td>
                      </tr>
                    ))}

                  {data && data.leads.length === 0 && (
                    <tr>
                      <td colSpan={COLUMNS} className="px-4 py-12 text-center text-(--c-text-3)">
                        {search ? 'No leads match your search.' : 'No leads in this period.'}
                      </td>
                    </tr>
                  )}

                  {data?.leads.map((lead) => {
                    const stage = STAGES[lead.stage] ?? STAGES.lead;
                    const to = appPath(lead, period);
                    return (
                      <tr key={lead.id}>
                        <td className="px-4 py-3 font-semibold">{lead.name || 'Unnamed lead'}</td>
                        <td className="px-4 py-3 tabular-nums text-(--c-text-2)">{lead.mobile || <span className="text-(--c-faint)">—</span>}</td>
                        <td className="px-4 py-3 text-(--c-text-2)">{lead.channel}</td>
                        <td className="px-4 py-3 text-(--c-text-2)">{lead.adSet || <span className="text-(--c-faint)">—</span>}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-(--c-text-2)">{lead.receivedAt ? formatDateTime(lead.receivedAt) : '—'}</td>
                        <td className="px-4 py-3">
                          {to ? (
                            <Link
                              to={to}
                              state={{ backLabel: 'Campaign Leads', section: '/' }}
                              title={lead.appIds.length === 1 ? 'Open this app' : `Open the ${lead.appIds.length} apps this member created`}
                              className={`${BADGE} ${stage.className} hover:underline`}
                            >
                              {stage.label}
                              {lead.appIds.length > 1 ? ` (${lead.appIds.length})` : ''} →
                            </Link>
                          ) : (
                            <span className={`${BADGE} ${stage.className}`}>{stage.label}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollTable>

            {data && (
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                loading={loading}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default CampaignLeadsPage;
