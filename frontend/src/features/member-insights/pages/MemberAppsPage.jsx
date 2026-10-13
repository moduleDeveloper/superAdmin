import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import BackLink from '../../../components/BackLink';
import PeriodFilter from '../../../components/PeriodFilter';
import Avatar from '../../../components/Avatar';
import ScrollTable from '../../../components/ScrollTable';
import SearchInput from '../../../components/SearchInput';
import SortableTh from '../../../components/SortableTh';
import { formatDateRange, formatDateTime } from '../../../utils/formatDate';
import { useMemberApps } from '../hooks/useMemberApps';
import { periodQuery } from '../utils/periodQuery';

const Empty = () => <span className="text-[#9aa0b4]">—</span>;

const FIRST_DIRECTION = { name: 'asc', legalName: 'asc', memberCount: 'desc', activityCount: 'desc', uniqueLogins: 'desc', createdAt: 'desc' };

function sortApps(apps, { key, dir }) {
  const sign = dir === 'asc' ? 1 : -1;
  return [...apps].sort((a, b) => {
    const aEmpty = a[key] == null || a[key] === '';
    const bEmpty = b[key] == null || b[key] === '';
    if (aEmpty !== bEmpty) return aEmpty ? 1 : -1; // apps with no value always come last
    if (aEmpty) return a.name.localeCompare(b.name);

    const byColumn =
      key === 'createdAt'
        ? new Date(a[key]) - new Date(b[key])
        : key === 'memberCount' || key === 'activityCount' || key === 'uniqueLogins'
          ? a[key] - b[key]
          : a[key].localeCompare(b[key], undefined, { sensitivity: 'base' });
    return sign * byColumn || a.name.localeCompare(b.name);
  });
}

/** The apps (trusts) one member created, i.e. the trusts owned by their superuser. */
function MemberAppsPage() {
  const { memberId } = useParams();
  const [searchParams] = useSearchParams();
  // opens on the period chosen in the member table (7 days when linked without one)
  const [period, setPeriod] = useState(() => ({
    range: searchParams.get('range') || '7d',
    from: searchParams.get('from') || undefined,
    to: searchParams.get('to') || undefined,
  }));
  const { data, loading, error } = useMemberApps(memberId, period);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });

  const rows = useMemo(() => {
    const text = search.trim().toLowerCase();
    const apps = (data?.apps ?? []).filter(
      (app) => !text || [app.name, app.legalName, app.appType].some((value) => value?.toLowerCase().includes(text))
    );
    return sortApps(apps, sort);
  }, [data, search, sort]);

  const onSort = (key) =>
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: FIRST_DIRECTION[key] }
    );

  const member = data?.member;
  // The app's user activity, for the period chosen here.
  const activityPath = (trustId) => `/member-insights/${memberId}/apps/${trustId}/activity${periodQuery(period)}`;

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink to="/member-insights" label="Back to Member Insights" />
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Apps created by {member ? member.name ?? 'Unnamed member' : 'member'}</h1>
      {member && (
        <p className="mt-1 text-[#5b627a]">
          {[member.mobile, member.email, member.companyName].filter(Boolean).join(' · ') || 'Every app this member created.'}
        </p>
      )}

      {error && (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {!error && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,33,61,0.06)]">
          <p className="text-sm font-semibold">User activity period</p>
          <div className="mt-2">
            <PeriodFilter
              filter={period}
              onChange={(patch) =>
                setPeriod((prev) => ({
                  ...prev,
                  ...patch,
                  ...(patch.range && patch.range !== 'custom' ? { from: undefined, to: undefined } : {}),
                }))
              }
            />
          </div>
          <p className="mt-1.5 text-xs text-[#6b7188]">{data?.period ? formatDateRange(data.period.from, data.period.to) : ''}</p>
        </div>
      )}

      {!error && (
        <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(20,33,61,0.06)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold">Apps</h2>
              {data && (
                <span className="rounded-full bg-[#fde6d6] px-2.5 py-0.5 text-xs font-semibold text-[#b04a4f]">{data.apps.length}</span>
              )}
            </div>
            <div className="sm:w-72">
              <SearchInput value={search} onChange={setSearch} placeholder="Search app or legal name" label="Search apps" />
            </div>
          </div>

          <ScrollTable className="mt-4">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr>
                  <SortableTh label="App Name" sortKey="name" sort={sort} onSort={onSort} />
                  <SortableTh label="Legal Name" sortKey="legalName" sort={sort} onSort={onSort} />
                  <SortableTh label="Members" sortKey="memberCount" sort={sort} onSort={onSort} />
                  <SortableTh label="Number of User Activity" sortKey="activityCount" sort={sort} onSort={onSort} />
                  <SortableTh label="Unique Logins" sortKey="uniqueLogins" sort={sort} onSort={onSort} />
                  <SortableTh label="Created At" sortKey="createdAt" sort={sort} onSort={onSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading &&
                  Array.from({ length: 4 }, (_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-3.5">
                        <div className="h-5 animate-pulse rounded bg-gray-100" />
                      </td>
                    </tr>
                  ))}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[#5b627a]">
                      {search ? 'No apps match your search.' : 'This member has not created any app.'}
                    </td>
                  </tr>
                )}

                {rows.map((app) => (
                  <tr key={app.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={app.name} logoUrl={app.logoUrl} />
                        <div className="min-w-0">
                          <Link to={activityPath(app.id)} className="font-semibold text-[#b04a4f] hover:underline">
                            {app.name}
                          </Link>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-[#5b627a]">
                            {app.appType && <span>{app.appType}</span>}
                            {!app.isActive && <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium">Inactive</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#3a3f55]">{app.legalName ?? <Empty />}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{app.memberCount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {app.activityCount > 0 ? (
                        <Link
                          to={activityPath(app.id)}
                          title="View this app's user activity"
                          className="font-semibold text-[#b04a4f] hover:underline"
                        >
                          {app.activityCount.toLocaleString('en-IN')}
                        </Link>
                      ) : (
                        <span className="text-[#9aa0b4]">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {app.uniqueLogins > 0 ? (
                        <Link
                          to={`/member-insights/${memberId}/apps/${app.id}/members${periodQuery(period)}`}
                          title="View the members who logged in"
                          className="font-semibold text-[#b04a4f] hover:underline"
                        >
                          {app.uniqueLogins.toLocaleString('en-IN')}
                        </Link>
                      ) : (
                        <span className="text-[#9aa0b4]">0</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[#3a3f55]">{formatDateTime(app.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollTable>
        </section>
      )}
    </div>
  );
}

export default MemberAppsPage;
