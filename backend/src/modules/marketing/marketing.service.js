import { supabase } from '../../config/supabase.js';

const MAX_PERIOD_ROWS = 5000;

const unwrap = ({ data, count, error }) => {
    if (error) throw error;
    return { data, count };
};

const toLead = (row) => ({
    id: row.id,
    receivedAt: row.lead_received_at,
    source: row.source,
    platform: row.platform,
    isOrganic: row.is_organic,
    status: row.lead_status,
    campaign: row.campaign_name,
});

/**
 * Lead numbers for the Marketing overview. The leads of the selected period are sent as small rows (no names,
 * numbers or emails); the page groups them into the graph and charts. Totals are all-time.
 */
export async function getLeadsOverview({ start, end, firstDay, lastDay, todayStart }) {
    const [total, today, period, latest] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true }).gte('lead_received_at', todayStart),
        supabase
            .from('leads')
            .select('id, lead_received_at, source, platform, is_organic, lead_status, campaign_name')
            .gte('lead_received_at', start)
            .lt('lead_received_at', end)
            .order('lead_received_at', { ascending: false })
            .limit(MAX_PERIOD_ROWS),
        supabase.from('leads').select('name, source, lead_received_at').order('lead_received_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const leads = unwrap(period).data.map(toLead);
    const lastLead = unwrap(latest).data;

    return {
        totalLeads: unwrap(total).count,
        leadsToday: unwrap(today).count,
        period: { count: leads.length, from: firstDay, to: lastDay },
        lastLead: lastLead ? { name: lastLead.name, source: lastLead.source, receivedAt: lastLead.lead_received_at } : null,
        leads,
    };
}
