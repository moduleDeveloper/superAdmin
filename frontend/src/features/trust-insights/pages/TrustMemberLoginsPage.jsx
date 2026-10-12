import { Link, useLocation, useParams } from 'react-router-dom';

import MemberLoginsTable from '../components/members/MemberLoginsTable';
import { useTrustMemberLogins } from '../hooks/useTrustMemberLogins';

function TrustMemberLoginsPage() {
  // Opened from Organization Insights, or from a member's Apps page (/member-insights/:memberId/apps/:trustId/members).
  const { trustId, memberId } = useParams();
  const { search } = useLocation(); // the Apps page's period, handed back when going there again
  const { data, loading, error } = useTrustMemberLogins(trustId);

  return (
    <div className="mx-auto max-w-6xl">
      {memberId ? (
        <Link to={`/member-insights/${memberId}/apps${search}`} className="text-sm font-medium text-[#b04a4f] hover:underline">
          ← Back to member&apos;s apps
        </Link>
      ) : (
        <Link to="/organization-insights" className="text-sm font-medium text-[#b04a4f] hover:underline">
          ← Back to Trust Insights
        </Link>
      )}
      <h1 className="mt-3 text-3xl font-bold tracking-tight">Unique Member Logins</h1>
      <p className="mt-1 text-[#5b627a]">
        {data ? `${data.trust.name} · ` : ''}Members who have logged in to this trust, with their latest session event.
      </p>

      {error && (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6">
        <MemberLoginsTable members={data?.members ?? []} loading={loading} />
      </div>
    </div>
  );
}

export default TrustMemberLoginsPage;
