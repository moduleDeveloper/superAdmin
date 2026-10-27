import { supabase } from '../../config/supabase.js';
import { listDayKeys, localDayKey, localHour } from '../../utils/dateRange.js';
import { getMostActiveApps } from './activeApps.service.js';
import { classifyOtpMembersOf, fetchLoginIdentities } from './otpNotLogin.service.js';
import { isOrganicMember, isUnknownMember, isWhatsAppMember, leadSections, organicMemberLead, sourceQuality, traceLeadPeople, unknownMemberLead, whatsappMemberLead } from '../marketing/leadStats.service.js';

const PAGE_SIZE = 1000;
const PAGE_BATCH = 8; // how many pages are fetched at once
const MAX_ROWS = 50000;
const TOP_TRUSTS = 5;

const unwrap = ({ data, count, error }) => {
    if (error) throw error;
    return { data, count };
};

const head = { count: 'exact', head: true };

/**
 * Every row of `table` created in [start, end), fetched in parallel pages. `orderBy` is a unique column, so rows
 * that share a timestamp (a bulk import) are never skipped or repeated between pages.
 */
export async function fetchPeriodRows(table, columns, orderBy, start, end) {
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

/**
 * The investor dashboard: platform totals, how fast members / apps / leads / usage grew in the selected period,
 * the busiest apps, and where leads come from and how many became members. Only counts and small lists are sent.
 */
export async function getDashboard({ start, end, firstDay, lastDay, todayStart }) {
    const [members, trusts, activity, leads, totals, activeApps, loginIdentities] = await Promise.all([
        fetchPeriodRows('Members', 'created_at, members_id, Name, Mobile, source, sub_source, campaign_name', 'members_id', start, end),
        fetchPeriodRows('Trust', 'created_at, id, superuser_id', 'id', start, end),
        fetchPeriodRows('page_activity', 'created_at, id, trust_id, user_reg_id, members_id', 'id', start, end),
        fetchPeriodRows('leads', 'created_at, id, lead_received_at, source, platform, is_organic, mobile, campaign_name, adset_name', 'id', start, end),
        Promise.all([
            supabase.from('Members').select('members_id', head),
            supabase.from('Members').select('members_id', head).eq('app_download', true),
            supabase.from('Members').select('members_id', head).gte('created_at', todayStart),
            supabase.from('Trust').select('id', head),
            supabase.from('Trust').select('id', head).gte('created_at', todayStart),
            supabase.from('leads').select('id', head),
            supabase.from('leads').select('id', head).gte('lead_received_at', todayStart),
        ]),
        getMostActiveApps({ start, end }),
        fetchLoginIdentities(),
    ]);
    const [memberTotal, appDownloaded, memberToday, trustTotal, trustToday, leadTotal, leadToday] = totals.map((r) => unwrap(r).count);

    // Leads are placed in the period by when they were received (not when the row was saved).
    // Compared as instants: the database returns +05:30 text while start/end are UTC ('Z') text, so strings must not be compared.
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const periodLeads = leads.filter((lead) => {
        const receivedMs = new Date(lead.lead_received_at).getTime();
        return receivedMs >= startMs && receivedMs < endMs;
    });

    const perTrust = new Map();
    activity.forEach((row) => {
        if (row.trust_id) perTrust.set(row.trust_id, (perTrust.get(row.trust_id) ?? 0) + 1);
    });
    const top = [...perTrust].sort((a, b) => b[1] - a[1]).slice(0, TOP_TRUSTS);
    const { data: topNames } = top.length ? unwrap(await supabase.from('Trust').select('id, name').in('id', top.map(([id]) => id))) : { data: [] };
    const names = new Map(topNames.map((t) => [t.id, t.name]));

    // The reports also count members who joined on their own (Members.source = 'Organic') as organic leads, and
    // WhatsApp broadcast members (Members.source = 'WA Broadcasting') as WhatsApp leads.
    // The headline numbers and the leads graph keep counting the leads table only.
    // Members with no source are "Unknown" leads, unless the same phone number already came in as a lead.
    const leadPhones = new Set(periodLeads.map((lead) => String(lead.mobile ?? '').replace(/\D/g, '').slice(-10)).filter((phone) => phone.length === 10));
    const unknownMembers = members.filter((member) => isUnknownMember(member) && !leadPhones.has(String(member.Mobile ?? '').replace(/\D/g, '').slice(-10)));
    const reportLeads = [...periodLeads, ...members.filter(isOrganicMember).map(organicMemberLead), ...members.filter(isWhatsAppMember).map(whatsappMemberLead), ...unknownMembers.map(unknownMemberLead)];
    const [trace, otpMembers] = await Promise.all([
        traceLeadPeople(reportLeads, loginIdentities.memberIds),
        classifyOtpMembersOf(members, loginIdentities),
    ]);
    const range = { firstDay, lastDay };
    return {
        period: { from: firstDay, to: lastDay },
        totals: {
            members: memberTotal,
            membersInPeriod: members.length,
            otpNotLogin: otpMembers.notLoggedIn.length,
            otpLoggedIn: otpMembers.loggedIn.length,
            membersToday: memberToday,
            appDownloaded,
            trusts: trustTotal,
            trustsInPeriod: trusts.length,
            appBuilders: new Set(trusts.map((trust) => trust.superuser_id).filter(Boolean)).size, // different people who built them
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
        ...leadSections(reportLeads, trace), // funnel, campaigns, leadChannels, leadConversion for all leads
        sources: sourceQuality(reportLeads, trace),
        activeApps,
    };
}
