import { Link } from 'react-router-dom';

import { periodQuery } from '../../../member-insights/utils/periodQuery';
import ChartCard, { EmptyChart } from './ChartCard';

/** The members with the most actions in this trust; each name opens that member's own activity page for the trust. */
function TopMembers({ members, trustId, filter, loading }) {
  const max = Math.max(1, ...members.map((m) => m.count));
  const query = periodQuery(filter);

  return (
    <ChartCard title="Most Active Members">
      {members.length === 0 ? (
        <EmptyChart loading={loading} />
      ) : (
        <ul className="space-y-3">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-3 text-sm">
              <Link
                state={{ backLabel: 'App Actions', section: '/organization-insights' }}
                to={`/member-insights/${member.id}/activity${query ? `${query}&` : '?'}trust=${trustId}`}
                title="View this member's activity"
                className="w-44 shrink-0 truncate text-(--c-text-2) hover:text-(--c-link) hover:underline"
              >
                {member.name}
              </Link>
              <span className="h-2.5 flex-1 rounded-full bg-gray-100">
                <span className="block h-full rounded-full bg-(--c-link)" style={{ width: `${(member.count / max) * 100}%` }} />
              </span>
              <span className="w-9 shrink-0 text-right font-semibold tabular-nums">{member.count}</span>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}

export default TopMembers;
