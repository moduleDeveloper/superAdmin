import ChartCard from '../../trust-insights/components/activity/ChartCard';

/** How many of the period's leads (that left a phone number) went on to join as members. */
function LeadConversion({ conversion, loading, scope }) {
  const rate = conversion && conversion.withMobile > 0 ? Math.round((conversion.converted / conversion.withMobile) * 100) : null;

  return (
    <ChartCard title={scope ? `Leads Who Became Members · ${scope}` : 'Leads Who Became Members'}>
      {loading && !conversion ? (
        <div className="h-40 animate-pulse rounded-xl bg-gray-50" />
      ) : rate === null ? (
        <p className="flex h-40 items-center justify-center text-sm text-[#7b8196]">No leads in this period</p>
      ) : (
        <div className="flex h-40 flex-col justify-center">
          <p className="text-5xl font-bold tabular-nums tracking-tight text-[#14213d]">{rate}%</p>
          <div className="mt-4 h-2.5 rounded-full bg-[#f3ece6]">
            <div className="h-full rounded-full bg-gradient-to-r from-[#e8793f] to-[#b04a4f]" style={{ width: `${rate}%` }} />
          </div>
          <p className="mt-3 text-sm text-[#5b627a]">
            <span className="font-semibold text-[#14213d]">{conversion.converted.toLocaleString('en-IN')}</span> of{' '}
            {conversion.withMobile.toLocaleString('en-IN')} leads joined as members after enquiring
          </p>
          <p className="mt-1 text-xs text-[#7b8196]">Matched by mobile number</p>
        </div>
      )}
    </ChartCard>
  );
}

export default LeadConversion;
