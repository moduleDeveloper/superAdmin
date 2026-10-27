import { formatPercent, percentOf } from '../../../utils/percent';
import ChartCard from '../../trust-insights/components/activity/ChartCard';

/** How many of the period's leads (that left a phone number) went on to join as members. */
function LeadConversion({ conversion, loading, scope }) {
  const rate = conversion ? percentOf(conversion.converted, conversion.withMobile) : null;

  return (
    <ChartCard title={scope ? `Leads Who Became Members · ${scope}` : 'Leads Who Became Members'}>
      {loading && !conversion ? (
        <div className="h-40 animate-pulse rounded-xl bg-gray-50" />
      ) : rate === null ? (
        <p className="flex h-40 items-center justify-center text-sm text-(--c-muted)">No leads in this period</p>
      ) : (
        <div className="flex h-40 flex-col justify-center">
          <p className="text-5xl font-bold tabular-nums tracking-tight text-(--c-text)">{formatPercent(rate)}%</p>
          <div className="mt-4 h-2.5 rounded-full bg-(--c-track)">
            <div className="animate-grow h-full origin-left rounded-full bg-gradient-to-r from-(--c-grad-from) to-(--c-grad-to)" style={{ width: `${Math.min(100, rate)}%` }} />
          </div>
          <p className="mt-3 text-sm text-(--c-text-3)">
            <span className="font-semibold text-(--c-text)">{conversion.converted.toLocaleString('en-IN')}</span> of{' '}
            {conversion.withMobile.toLocaleString('en-IN')} leads joined as members after enquiring
          </p>
          <p className="mt-1 text-xs text-(--c-muted)">Matched by mobile number</p>
        </div>
      )}
    </ChartCard>
  );
}

export default LeadConversion;
