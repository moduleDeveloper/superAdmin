import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import BackLink from '../../../components/BackLink';
import AreaChart from '../../../components/AreaChart';
import OverviewPanel from '../../../components/OverviewPanel';
import StatsGrid from '../../../components/StatsGrid';
import ActivityFilters from '../components/activity/ActivityFilters';
import ModulesDonut from '../components/activity/ModulesDonut';
import RecentActivityTable from '../components/activity/RecentActivityTable';
import RoutesChart from '../components/activity/RoutesChart';
import TopMembers from '../components/activity/TopMembers';
import { useTrustMemberActions } from '../hooks/useTrustMemberActions';
import { periodTitle } from '../utils/periodTitle';
import { buildActivitySeries } from '../utils/trustSeries';

const NO_OPTIONS = { users: [], modules: [], pages: [] };

/** What all the members of one trust did in its app (the App Actions column of Organization Insights). */
function TrustMemberActionsPage() {
  const { trustId } = useParams();
  const [searchParams] = useSearchParams();

  const [initial] = useState(() => ({
    range: searchParams.get('range') || '7d',
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
  }));
  const [filter, setFilter] = useState(initial);

  const { data, loadedAt, loading, error } = useTrustMemberActions(trustId, filter);

  const series = useMemo(
    () => buildActivitySeries({ trend: data?.trend ?? [], byHour: data?.byHour ?? [] }, data?.period, loadedAt),
    [data, loadedAt]
  );

  const initialLoad = loading && !data;
  const summary = data?.summary;
  const activeDays = summary?.activeDays ?? 0;

  const stats = [
    { marker: '#7a4a8c', label: 'Total Actions', value: summary?.totalActivities.toLocaleString('en-IN'), hint: 'By members, in selected range' },
    { marker: '#1f8a3b', label: 'Active Days', value: summary?.activeDays.toLocaleString('en-IN'), hint: 'Days with activity' },
    { marker: '#e8912f', label: 'Unique Pages Visited', value: summary?.uniquePages.toLocaleString('en-IN'), hint: 'Distinct pages' },
    {
      marker: '#2a8fa3',
      label: 'Avg Actions per Day',
      value: summary?.avgPerDay.toFixed(1),
      hint: `Over ${activeDays} active day${activeDays === 1 ? '' : 's'}`,
    },
  ];
  const canReset =
    Boolean(filter.user || filter.target) ||
    filter.range !== initial.range ||
    filter.from !== initial.from ||
    filter.to !== initial.to;

  return (
    <div className="mx-auto max-w-7xl">
      <BackLink to="/organization-insights" label="Back to Trust Insights" />
      <h1 className="mt-3 text-lg font-bold tracking-tight lg:text-3xl">App Actions{data ? ` - ${data.trust.name}` : ''}</h1>
      <p className="mt-1 text-[#5b627a]">Page visits and usage by the members of this trust.</p>

      {error && (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-5">
        <ActivityFilters
          filter={filter}
          options={data?.filters ?? NO_OPTIONS}
          period={data?.period}
          userLabel="Member"
          onChange={(patch) =>
            setFilter((prev) => ({
              ...prev,
              ...patch,
              // switching away from a custom range drops its dates
              ...(patch.range && patch.range !== 'custom' ? { from: undefined, to: undefined } : {}),
            }))
          }
          onReset={() => setFilter(initial)}
          canReset={canReset}
        />

        <OverviewPanel
          storageKey="overview-collapsed:trust-member-actions"
          summary={summary && `Total actions ${summary.totalActivities.toLocaleString('en-IN')} · ${summary.activeDays} active day${summary.activeDays === 1 ? '' : 's'}`}
          stats={<StatsGrid stats={stats} loading={initialLoad} />}
          chart={
            <AreaChart
              title={periodTitle('Member Actions', filter, data?.period)}
              series={series}
              loading={loading}
              noun="action"
              emptyText="No member actions in this period"
            />
          }
        />

        <div className="grid items-start gap-5 lg:grid-cols-2">
          <RoutesChart routes={data?.topRoutes ?? []} loading={loading} />
          <ModulesDonut modules={data?.topModules ?? []} total={summary?.totalActivities ?? 0} loading={loading} />
        </div>

        <TopMembers members={data?.topMembers ?? []} trustId={trustId} filter={filter} loading={loading} />

        <RecentActivityTable rows={data?.recent ?? []} loading={loading} title="Recent Member Actions" userLabel="Member" />
      </div>
    </div>
  );
}

export default TrustMemberActionsPage;
