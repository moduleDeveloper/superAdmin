import { Link } from 'react-router-dom';

import ChartCard, { EmptyChart } from '../../trust-insights/components/activity/ChartCard';
import { periodQuery } from '../../member-insights/utils/periodQuery';

/** The busiest apps in the period; each name opens that trust's activity page. */
function TopTrusts({ trusts, filter, loading }) {
  const max = Math.max(1, ...trusts.map((t) => t.count));
  const query = periodQuery(filter);

  return (
    <ChartCard
      title="Most Active Apps"
      action={
        <Link to="/organization-insights" className="text-xs font-medium text-(--c-link) hover:underline">
          View all ›
        </Link>
      }
    >
      {trusts.length === 0 ? (
        <EmptyChart loading={loading} />
      ) : (
        <ul className="space-y-3">
          {trusts.map((trust) => (
            <li key={trust.id} className="flex items-center gap-3 text-sm">
              <Link
                to={`/trust-insights/${trust.id}${query}`}
                state={{ backLabel: 'Dashboard', section: '/' }}
                title="View this app's activity"
                className="w-36 shrink-0 truncate text-(--c-text-2) hover:text-(--c-link) hover:underline"
              >
                {trust.name}
              </Link>
              <span className="h-2.5 flex-1 rounded-full bg-gray-100">
                <span className="block h-full rounded-full bg-(--c-accent)" style={{ width: `${(trust.count / max) * 100}%` }} />
              </span>
              <span className="w-10 shrink-0 text-right font-semibold tabular-nums">{trust.count.toLocaleString('en-IN')}</span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}

export default TopTrusts;
