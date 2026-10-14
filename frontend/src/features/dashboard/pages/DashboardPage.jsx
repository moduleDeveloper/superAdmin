import { useMemo } from 'react';

import AreaChart from '../../../components/AreaChart';
import DonutChart from '../../../components/DonutChart';
import PeriodFilter from '../../../components/PeriodFilter';
import StatsGrid from '../../../components/StatsGrid';
import { useSessionState } from '../../../hooks/useSessionState';
import { COLORS } from '../../marketing/utils/leadStats';
import { periodTitle } from '../../trust-insights/utils/periodTitle';
import { buildActivitySeries } from '../../trust-insights/utils/trustSeries';
import CampaignTable from '../components/CampaignTable';
import FunnelChart from '../components/FunnelChart';
import SourceQualityCards from '../components/SourceQualityCards';
import SourceSelect from '../components/SourceSelect';
import LeadConversion from '../components/LeadConversion';
import MostActiveApps from '../components/MostActiveApps';
import TopTrusts from '../components/TopTrusts';
import { useActiveApps } from '../hooks/useActiveApps';
import { useDashboard } from '../hooks/useDashboard';

const card = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,33,61,0.06)]';
const number = (value) => value?.toLocaleString('en-IN');
const EMPTY_SERIES = { trend: [], byHour: [] };
const CHANNEL_COLORS = { Facebook: COLORS.facebook, Instagram: COLORS.instagram, Website: COLORS.website };

/** Investor overview: how big the platform is, how fast it is growing, and whether the marketing is working. */
function DashboardPage() {
  const [filter, setFilter] = useSessionState('dashboard:filter', { range: '7d' });
  const { data, loadedAt, loading, error } = useDashboard(filter);

  // Choosing an ad source card narrows the lead sections (funnel, campaigns, sources, conversion) to that source.
  const [sourceKey, setSourceKey] = useSessionState('dashboard:source', null);
  const source = data?.sources.find((s) => s.key === sourceKey) ?? null;
  const leadData = source ? source.sections : data; // a source with no leads in this period falls back to all

  // Most Active Apps has its own choice: an ad source, or the apps that came without an ad lead. The default list comes
  // with the dashboard; any other choice is asked for (and cached) when picked.
  const [appScope, setAppScope] = useSessionState('dashboard:app-scope', 'all');
  const scopedApps = useActiveApps(filter, appScope);
  const activeApps = appScope === 'all' ? data?.activeApps : scopedApps.data;
  const activeAppsLoading = appScope === 'all' ? loading && !data : scopedApps.loading;

  // Clicking a source card sets both the lead sections and the app list; each can be changed on its own afterwards.
  const chooseSource = (key) => {
    setSourceKey(key);
    setAppScope(key ?? 'all');
  };
  const sourceControl = (
    <SourceSelect
      label="Show leads from"
      value={source?.key ?? ''}
      onChange={(value) => setSourceKey(value || null)}
      options={[{ value: '', label: 'All sources' }, ...(data?.sources ?? []).map((s) => ({ value: s.key, label: `${s.label} (${s.leads})` }))]}
    />
  );

  const graphs = useMemo(() => {
    const build = (key) => buildActivitySeries(data?.series[key] ?? EMPTY_SERIES, data?.period, loadedAt);
    return { members: build('members'), trusts: build('trusts'), activity: build('activity'), leads: build('leads') };
  }, [data, loadedAt]);

  const channels = (leadData?.leadChannels ?? []).map(({ label, count }) => ({
    label,
    value: count,
    color: CHANNEL_COLORS[label] ?? COLORS.other,
  }));

  const t = data?.totals;
  const stats = [
    {
      marker: '#7a4a8c',
      label: 'Total Members',
      value: number(t?.members),
      hint: t ? `+${number(t.membersInPeriod)} in period · ${number(t.appDownloaded)} downloaded the app` : undefined,
    },
    {
      marker: '#1f8a3b',
      label: 'Total Apps',
      value: number(t?.trusts),
      hint: t ? `+${number(t.trustsInPeriod)} in period · ${number(t.trustsToday)} today` : undefined,
    },
    {
      marker: '#e8912f',
      label: 'Total Leads',
      value: number(t?.leads),
      hint: t ? `+${number(t.leadsInPeriod)} in period · ${number(t.leadsToday)} today` : undefined,
    },
    {
      marker: '#2a8fa3',
      label: 'App Activity',
      value: number(data?.activity.total),
      hint: data ? `${number(data.activity.byUsers)} by users · ${number(data.activity.byMembers)} by members` : undefined,
    },
  ];

  const chart = (title, noun, data_, nounPlural) => (
    <section className={card}>
      <AreaChart title={periodTitle(title, filter, data?.period)} series={data_} loading={loading} noun={noun} nounPlural={nounPlural} emptyText={`No ${nounPlural ?? `${noun}s`} in this period`} />
    </section>
  );

  return (
    <div className="mx-auto max-w-7xl">
      {error && (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Platform Overview</h2>
          <p className="mt-1 text-sm text-[#5b627a]">Totals are all-time; the graphs and “in period” numbers follow the date range.</p>
        </div>
        <PeriodFilter filter={filter} onChange={setFilter} />
      </div>

      <section className="mt-4 rounded-2xl border border-[#ebe0d7] bg-[#f7efe9] py-2">
        <StatsGrid stats={stats} loading={loading && !data} />
      </section>

      <div className="mt-5">
        <SourceQualityCards sources={data?.sources} selected={source?.key ?? null} onSelect={chooseSource} loading={loading && !data} />
      </div>

      <div className="mt-5">
        <FunnelChart funnel={leadData?.funnel} loading={loading && !data} scope={source?.label} control={sourceControl} />
      </div>

      <div className="mt-5">
        <CampaignTable campaigns={leadData?.campaigns} loading={loading && !data} scope={source?.label} control={sourceControl} />
      </div>

      <div className="mt-5">
        <MostActiveApps
          apps={activeApps?.apps}
          scopeCounts={data?.activeApps.scopeCounts ?? activeApps?.scopeCounts}
          scope={appScope}
          onScopeChange={setAppScope}
          filter={filter}
          loading={activeAppsLoading}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {chart('Members Joined', 'member', graphs.members)}
        {chart('Apps Created', 'app', graphs.trusts)}
        {chart('App Activity', 'action', graphs.activity)}
        {chart('Leads Received', 'lead', graphs.leads)}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <TopTrusts trusts={data?.topTrusts ?? []} filter={filter} loading={loading} />
        <section className={card}>
          <DonutChart title={source ? `Lead Sources · ${source.label}` : 'Lead Sources'} slices={channels} loading={loading} />
        </section>
        <LeadConversion conversion={leadData?.leadConversion} loading={loading} scope={source?.label} />
      </div>
    </div>
  );
}

export default DashboardPage;
