import { supabase } from '../../config/supabase.js';
import { listDayKeys, localDayKey, localHour } from '../../utils/dateRange.js';

const PAGE_SIZE = 1000;
const PAGE_BATCH = 8; // how many pages are fetched at once
const MAX_ROWS = 50000;
const TOP_TRUSTS = 5;
const ID_CHUNK = 100;

const unwrap = ({ data, count, error }) => {
    if (error) throw error;
    return { data, count };
};

const head = { count: 'exact', head: true };
const last10 = (value) => String(value ?? '').replace(/\D/g, '').slice(-10);

/**
 * Every row of `table` created in [start, end), fetched in parallel pages. `orderBy` is a unique column, so rows
 * that share a timestamp (a bulk import) are never skipped or repeated between pages.
 */
async function fetchPeriodRows(table, columns, orderBy, start, end) {
    const base = () => supabase.from(table).select(columns).gte('created_at', start).lt('created_at', end);

    const { count } = unwrap(await supabase.from(table).select(orderBy, head).gte('created_at', start).lt('created_at', end));
    const pages = Math.ceil(Math.min(count ?? 0, MAX_ROWS) / PAGE_SIZE);

    const rows = [];
    for (let i = 0; i < pages; i += PAGE_BATCH) {
        const batch = await Promise.all(
            Array.from({ length: Math.min(PAGE_BATCH, pages - i) }, async (_, j) => {
                const from = (i + j) * PAGE_SIZE;
                const { data } = unwrap(await base().order('created_at').order(orderBy).range(from, from + PAGE_SIZE - 1));
                return data;
            })
        );
        batch.forEach((page) => rows.push(...page));
    }
    return rows;
}

/** Counts per local day (first to last day of the range) and per hour of the day, for the graphs. */
function buildSeries(timestamps, { firstDay, lastDay }) {
    const perDay = new Map();
    const byHour = Array(24).fill(0);
    timestamps.forEach((value) => {
        const key = localDayKey(value);
        perDay.set(key, (perDay.get(key) ?? 0) + 1);
        byHour[localHour(value)] += 1;
    });

    return {
        trend: listDayKeys(firstDay, lastDay).map((date) => ({ date, count: perDay.get(date) ?? 0 })),
        byHour: byHour.map((count, hour) => ({ hour, count })),
    };
}

/** Leads by where they came from (Facebook / Instagram / Website / other). */
function leadChannel(lead) {
    if (lead.platform === 'fb') return 'Facebook';
    if (lead.platform === 'ig') return 'Instagram';
    if (/website/i.test(lead.source ?? '')) return 'Website';
    return lead.source ? 'Meta (other)' : 'Other';
}

/**
 * Of the leads received in the period, how many became members: a member with the same mobile number
 * (last 10 digits) who joined after the lead came in.
 */
async function countConvertedLeads(leads) {
    const received = new Map();
    leads.forEach((lead) => {
        const key = last10(lead.mobile);
        if (key.length === 10) received.set(key, Math.min(received.get(key) ?? Infinity, new Date(lead.lead_received_at).getTime()));
    });

    const mobiles = [...received.keys()].map(Number);
    const converted = new Set();
    for (let i = 0; i < mobiles.length; i += ID_CHUNK) {
        const { data } = unwrap(await supabase.from('Members').select('Mobile, created_at').in('Mobile', mobiles.slice(i, i + ID_CHUNK)));
        data.forEach((member) => {
            const key = last10(member.Mobile);
            if (new Date(member.created_at).getTime() >= received.get(key)) converted.add(key);
        });
    }

    return { withMobile: received.size, converted: converted.size };
}

/**
 * The investor dashboard: platform totals, how fast members / apps / leads / usage grew in the selected period,
 * the busiest apps, and where leads come from and how many became members. Only counts and small lists are sent.
 */
export async function getDashboard({ start, end, firstDay, lastDay, todayStart }) {
    const [members, trusts, activity, leads, totals] = await Promise.all([
        fetchPeriodRows('Members', 'created_at, members_id', 'members_id', start, end),
        fetchPeriodRows('Trust', 'created_at, id', 'id', start, end),
        fetchPeriodRows('page_activity', 'created_at, id, trust_id, user_reg_id, members_id', 'id', start, end),
        fetchPeriodRows('leads', 'created_at, id, lead_received_at, source, platform, mobile', 'id', start, end),
        Promise.all([
            supabase.from('Members').select('members_id', head),
            supabase.from('Members').select('members_id', head).eq('app_download', true),
            supabase.from('Members').select('members_id', head).gte('created_at', todayStart),
            supabase.from('Trust').select('id', head),
            supabase.from('Trust').select('id', head).gte('created_at', todayStart),
            supabase.from('leads').select('id', head),
            supabase.from('leads').select('id', head).gte('lead_received_at', todayStart),
        ]),
    ]);
    const [memberTotal, appDownloaded, memberToday, trustTotal, trustToday, leadTotal, leadToday] = totals.map((r) => unwrap(r).count);

    // Leads are placed in the period by when they were received (not when the row was saved).
    const periodLeads = leads.filter((lead) => lead.lead_received_at >= start && lead.lead_received_at < end);

    const perTrust = new Map();
    activity.forEach((row) => {
        if (row.trust_id) perTrust.set(row.trust_id, (perTrust.get(row.trust_id) ?? 0) + 1);
    });
    const top = [...perTrust].sort((a, b) => b[1] - a[1]).slice(0, TOP_TRUSTS);
    const { data: topNames } = top.length ? unwrap(await supabase.from('Trust').select('id, name').in('id', top.map(([id]) => id))) : { data: [] };
    const names = new Map(topNames.map((t) => [t.id, t.name]));

    const channels = new Map();
    periodLeads.forEach((lead) => channels.set(leadChannel(lead), (channels.get(leadChannel(lead)) ?? 0) + 1));

    const range = { firstDay, lastDay };
    return {
        period: { from: firstDay, to: lastDay },
        totals: {
            members: memberTotal,
            membersInPeriod: members.length,
            membersToday: memberToday,
            appDownloaded,
            trusts: trustTotal,
            trustsInPeriod: trusts.length,
            trustsToday: trustToday,
            leads: leadTotal,
            leadsInPeriod: periodLeads.length,
            leadsToday: leadToday,
        },
        activity: {
            total: activity.length,
            byUsers: activity.filter((row) => row.user_reg_id).length,
            byMembers: activity.filter((row) => row.members_id).length,
        },
        series: {
            members: buildSeries(members.map((r) => r.created_at), range),
            trusts: buildSeries(trusts.map((r) => r.created_at), range),
            activity: buildSeries(activity.map((r) => r.created_at), range),
            leads: buildSeries(periodLeads.map((r) => r.lead_received_at), range),
        },
        topTrusts: top.map(([id, count]) => ({ id, name: names.get(id) ?? 'Unknown trust', count })),
        leadChannels: [...channels].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
        leadConversion: { leads: periodLeads.length, ...(await countConvertedLeads(periodLeads)) },
    };
}
