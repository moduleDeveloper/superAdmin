import { useMemo, useRef } from 'react';

import AreaChart from '../../../components/AreaChart';
import OverviewPanel from '../../../components/OverviewPanel';
import Pagination from '../../../components/Pagination';
import PeriodFilter from '../../../components/PeriodFilter';
import StatsGrid from '../../../components/StatsGrid';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { usePinned } from '../../../hooks/usePinned';
import { useSessionState } from '../../../hooks/useSessionState';
import { useStoredToggle } from '../../../hooks/useStoredToggle';
import { formatDateRange, formatDateTime } from '../../../utils/formatDate';
import { periodTitle } from '../../trust-insights/utils/periodTitle';
import { buildCountSeries } from '../../trust-insights/utils/trustSeries';
import MemberFilters from '../components/MemberFilters';
import MemberTable from '../components/MemberTable';
import { useMemberGrowth } from '../hooks/useMemberGrowth';
import { useMemberLeads } from '../hooks/useMemberLeads';
import { useMemberList } from '../hooks/useMemberList';
import { useMemberSummary } from '../hooks/useMemberSummary';
import { EXTRA_COLUMN_COUNT, hiddenSortLabel } from '../utils/memberColumns';

const panel = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,33,61,0.06)]';
const PIN_OFFSET = 88; // px = 4rem header + 1.5rem gap; matches the panel's lg:top-[5.5rem]

const DEFAULT_SORT = { key: 'createdAt', dir: 'desc' }; // newest first
const DEFAULT_VIEW = { search: '', trust: '', appDownload: 'all', sort: DEFAULT_SORT, page: 1, pageSize: 25 };

// Which way a column sorts the first time it is clicked.
const FIRST_DIRECTION = { createdAt: 'desc', appDownloaded: 'desc', appCount: 'desc', lastAppCreated: 'desc', actionCount: 'desc', managerActivity: 'desc', lastAction: 'desc', name: 'asc', mobile: 'asc', email: 'asc', company: 'asc' };

const number = (n) => (n == null ? undefined : n.toLocaleString('en-IN'));

function MemberInsightsPage() {
  const [period, setPeriod] = useSessionState('member-insights:period', { range: '7d' });
  const [view, setView] = useSessionState('member-insights:view', DEFAULT_VIEW);
  const debouncedSearch = useDebouncedValue(view.search);

  // The less important columns can be hidden; the choice is remembered. Hidden, the server skips their (slowest) lookups.
  const [showExtra, toggleExtra] = useStoredToggle('member-table-extra-columns', false);
  const { summary, trusts, error: summaryError, ready } = useMemberSummary();
  const growth = useMemberGrowth(period);
  const leads = useMemberLeads(period);
  const { data, loading, error } = useMemberList({
    page: view.page,
    pageSize: view.pageSize,
    sortBy: view.sort.key,
    sort: view.sort.dir,
    search: debouncedSearch.trim(),
    trust: view.trust,
    appDownload: view.appDownload,
    columns: showExtra ? 'all' : 'core',
    ...period,
  });

  // Any change to the table's filters, sort or period goes back to page 1.
  const update = (patch) => setView((prev) => ({ ...prev, page: 1, ...patch }));
  const changePeriod = (next) => {
    setPeriod(next);
    setView((prev) => ({ ...prev, page: 1 }));
  };
  const changeSort = (key) =>
    update({
      sort: view.sort.key === key ? { key, dir: view.sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: FIRST_DIRECTION[key] },
    });

  const filtered = view.search.trim() !== '' || view.trust !== '' || view.appDownload !== 'all';
  const canReset =
    filtered ||
    view.sort.key !== DEFAULT_SORT.key ||
    view.sort.dir !== DEFAULT_SORT.dir ||
    view.pageSize !== DEFAULT_VIEW.pageSize;

  // The graph shows the whole period; the table's search and filters only narrow the list below it.
  const series = useMemo(
    () => buildCountSeries(growth.data ?? { counts: [], granularity: 'day' }, growth.data?.period, growth.loadedAt),
    [growth.data, growth.loadedAt]
  );

  const [lastDate, lastTime] = summary?.lastJoined ? formatDateTime(summary.lastJoined.createdAt).split(', ') : [];

  const stats = [
    { marker: 'var(--c-c2)', label: 'Total Members', value: number(summary?.totalMembers), hint: 'Across all trusts' },
    { marker: 'var(--c-good)', label: 'Apps Created', value: number(growth.data?.appsCreated), hint: growth.data ? `${number(growth.data.totalApps)} apps in total` : undefined },
    {
      marker: 'var(--c-c3)',
      label: 'Joined in Period',
      value: number(growth.data?.total),
      hint: growth.data ? formatDateRange(growth.data.period.from, growth.data.period.to) : undefined,
    },
    {
      marker: 'var(--c-c4)',
      label: 'Last Member Joined',
      value: lastDate ?? '—',
      hint: summary?.lastJoined ? `${lastTime} · ${summary.lastJoined.trustName ?? 'Unknown trust'}` : undefined,
    },
  ];

  // "34 of 72" as "47%": one decimal under 10%, none above; null when there is nothing to divide by.
  const share = (part, whole) => {
    if (!whole) return undefined;
    const percent = (part / whole) * 100;
    return `${percent < 10 ? percent.toFixed(1) : Math.round(percent)}%`;
  };

  // A second group under the overview: what the period looked like for the apps themselves.
  const appStats = [
    {
      marker: 'var(--c-c1)',
      label: 'Members Who Created Apps',
      value: number(growth.data?.appCreators),
      // of the members who joined in the period, the share who created an app (creators who joined earlier are not in that base)
      percent: growth.data && share(growth.data.appCreatorsJoined, growth.data.total),
      hint: growth.data ? `of ${number(growth.data.total)} members who joined` : undefined,
    },
    {
      marker: 'var(--c-c2)',
      label: 'Apps With Logins',
      value: number(growth.data?.appsWithLogins),
      // apps with a login relative to the members who created apps (can pass 100%: it is not a share of one group)
      percent: growth.data && share(growth.data.appsWithLogins, growth.data.appCreators),
      hint: growth.data ? `for ${number(growth.data.appCreators)} members who created apps` : undefined,
    },
    {
      marker: 'var(--c-accent)',
      label: 'Avg User Activity per App',
      value: growth.data ? (growth.data.avgActivityPerApp ?? '—') : undefined,
      hint: growth.data?.avgActivityPerApp != null ? `${number(growth.data.totalActivity)} user activities ÷ ${number(growth.data.appsWithActivity)} apps` : growth.data ? 'No user activity in the period' : undefined,
    },
    {
      marker: 'var(--c-c1)',
      label: 'Avg App Activity per App',
      value: growth.data ? (growth.data.avgAppActivityPerApp ?? '—') : undefined,
      hint: growth.data?.avgAppActivityPerApp != null ? `${number(growth.data.totalAppActivity)} app activities ÷ ${number(growth.data.appsWithAppActivity)} apps` : growth.data ? 'No app activity in the period' : undefined,
    },
  ];

  // A third group: the leads that came in during the period and how many of them joined as members.
  const leadData = leads.data;
  const leadStats = [
    {
      marker: 'var(--c-c4)',
      label: 'Leads Received',
      value: number(leadData?.received),
      hint: leadData
        ? leadData.channels.length > 0
          ? leadData.channels.slice(0, 3).map((c) => `${number(c.count)} ${c.label}`).join(' · ')
          : `of ${number(leadData.total)} in total`
        : undefined,
    },
    {
      marker: 'var(--c-good)',
      label: 'Became Members',
      value: number(leadData?.converted),
      // matched by mobile number: a member with the same number who joined after the lead came in
      percent: leadData && share(leadData.converted, leadData.withMobile),
      hint: leadData ? `of ${number(leadData.withMobile)} leads with a mobile number` : undefined,
    },
    {
      marker: 'var(--c-accent)',
      label: 'From Paid Ads',
      value: number(leadData?.paid),
      percent: leadData && share(leadData.paid, leadData.received),
      hint: leadData ? `${number(leadData.organic)} organic` : undefined,
    },
  ];

  // The table panel scrolls with the page until it reaches the top, then pins there and its rows scroll.
  const panelRef = useRef(null);
  const pinned = usePinned(panelRef, PIN_OFFSET);

  const hiddenSort = hiddenSortLabel(view.sort.key, showExtra);
  const anyError = error || summaryError || growth.error || leads.error;

  return (
    <div className="mx-auto max-w-7xl">
      {anyError && (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {anyError}
        </p>
      )}

      {/* Date selector on top, then one panel: the headline numbers next to the members-joined graph. */}
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <h2 className="text-lg font-semibold">Member Overview</h2>
        <PeriodFilter filter={period} onChange={changePeriod} />
      </div>

      <OverviewPanel
        className="mt-4"
        storageKey="overview-collapsed:members"
        summary={summary && growth.data && `Total members ${number(summary.totalMembers)} · Joined in period ${number(growth.data.total)}`}
        stats={<StatsGrid stats={stats} loading={!ready || !growth.data} />}
        extra={
          <div className="space-y-4">
            <div className="rounded-xl border border-(--c-border) bg-white/60">
              <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-[0.08em] text-(--c-muted)">Apps in this period</p>
              <StatsGrid stats={appStats} loading={!growth.data} />
            </div>
            <div className="rounded-xl border border-(--c-border) bg-white/60">
              <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-[0.08em] text-(--c-muted)">Leads in this period</p>
              <StatsGrid stats={leadStats} loading={!leads.data} />
            </div>
          </div>
        }
        chart={
          <AreaChart
            title={periodTitle('Members Joined', period, growth.data?.period)}
            series={series}
            loading={growth.loading}
            noun="member"
            emptyText="No members joined in this period"
          />
        }
      />

      {/* On large screens this panel sticks below the header and is exactly one screen tall. */}
      <section
        ref={panelRef}
        className={`${panel} mt-5 flex flex-col lg:sticky lg:top-[5.5rem] lg:h-[calc(100vh-8rem)] lg:min-h-[420px]`}
      >
        <div className="mb-4 flex shrink-0 flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold">Members Joined in Selected Period</h2>
            {data && (
              <span className="rounded-full bg-(--c-accent-soft) px-2.5 py-0.5 text-xs font-semibold text-(--c-link)">
                {filtered ? `${number(data.total)} found` : number(data.total)}
              </span>
            )}
          </div>

          <MemberFilters
            search={view.search}
            onSearchChange={(search) => update({ search })}
            trust={view.trust}
            onTrustChange={(trust) => update({ trust })}
            trusts={trusts}
            appDownload={view.appDownload}
            onAppDownloadChange={(appDownload) => update({ appDownload })}
            onReset={() => setView(DEFAULT_VIEW)}
            canReset={canReset}
            showExtra={showExtra}
            onToggleExtra={toggleExtra}
            extraCount={EXTRA_COLUMN_COUNT}
          />

          {hiddenSort && (
            <p className="text-xs text-(--c-muted)">
              Sorted by <span className="font-medium text-(--c-text-2)">{hiddenSort}</span>, which is hidden. Show more columns to see it.
            </p>
          )}
        </div>

        <MemberTable
          members={data?.members ?? []}
          loading={loading}
          sort={view.sort}
          onSort={changeSort}
          filtered={filtered}
          pinned={pinned}
          period={period}
          showExtra={showExtra}
          scrollResetKey={[view.page, view.pageSize, view.sort.key, view.sort.dir, debouncedSearch, view.trust, view.appDownload, period.range, period.from, period.to].join('|')}
        />

        <Pagination
          page={view.page}
          pageSize={view.pageSize}
          total={data?.total ?? 0}
          loading={loading}
          onPageChange={(page) => setView((prev) => ({ ...prev, page }))}
          onPageSizeChange={(pageSize) => update({ pageSize })}
        />
      </section>
    </div>
  );
}

export default MemberInsightsPage;
