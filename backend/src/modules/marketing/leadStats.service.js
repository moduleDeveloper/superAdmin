import { supabase } from '../../config/supabase.js';

const ID_CHUNK = 100;

const unwrap = ({ data, count, error }) => {
    if (error) throw error;
    return { data, count };
};

const last10 = (value) => String(value ?? '').replace(/\D/g, '').slice(-10);

/** Where a lead came from: Facebook / Instagram (Meta platform), Website, or something else. */
export function leadChannel(lead) {
    if (lead.platform === 'fb') return 'Facebook';
    if (lead.platform === 'ig') return 'Instagram';
    if (/website/i.test(lead.source ?? '')) return 'Website';
    if (/google/i.test(lead.source ?? '')) return 'Google Ads';
    if (/meta/i.test(lead.source ?? '')) return 'Meta (other)';
    return lead.source?.trim() || 'Other';
}

const chunk = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));

const receivedAt = (lead) => new Date(lead.lead_received_at).getTime();

/**
 * Matches leads to members: a member with the same mobile number (last 10 digits) who joined after the lead came in
 * (someone who was already a member did not come from the ad). Leads without a usable number cannot be matched.
 * A person who enquired more than once is one person, belonging to their first lead.
 * Returns { withMobile (different phone numbers), members: Map of phone -> members_id, first: Map of phone -> first lead }.
 */
async function matchLeadMembers(leads) {
    const first = new Map();
    leads.forEach((lead) => {
        const key = last10(lead.mobile);
        if (key.length === 10 && (!first.has(key) || receivedAt(lead) < receivedAt(first.get(key)))) first.set(key, lead);
    });

    const members = new Map();
    for (const mobiles of chunk([...first.keys()].map(Number), ID_CHUNK)) {
        const { data } = unwrap(await supabase.from('Members').select('Mobile, members_id, created_at').in('Mobile', mobiles));
        data.forEach((member) => {
            const key = last10(member.Mobile);
            if (new Date(member.created_at).getTime() >= receivedAt(first.get(key))) members.set(key, member.members_id);
        });
    }

    return { withMobile: first.size, members, first };
}

/** Of these leads, how many became members (see matchLeadMembers). */
export async function countConvertedLeads(leads) {
    const { withMobile, members } = await matchLeadMembers(leads);
    return { withMobile, converted: members.size };
}

const LOGIN_BATCH = 10; // how many members are checked at once

/**
 * Follows every person who enquired through the funnel: became a member -> logged in to the app -> created an app ->
 * that app has had activity. Returns { withMobile, people: [{ lead (their first), memberId, loggedIn, apps: [{ id, active }] }] },
 * one entry per person who became a member; apps are only looked up for people who logged in.
 */
export async function traceLeadPeople(leads) {
    const { withMobile, members, first } = await matchLeadMembers(leads);

    const loggedIn = new Set();
    const memberIds = [...new Set(members.values())];
    for (const batch of chunk(memberIds, LOGIN_BATCH)) {
        const counts = await Promise.all(
            batch.map(async (memberId) =>
                unwrap(await supabase.from('member_session').select('id', { count: 'exact', head: true }).eq('action_type', 'login').eq('members_id', memberId)).count
            )
        );
        batch.forEach((memberId, i) => counts[i] > 0 && loggedIn.add(memberId));
    }

    // member -> superuser -> the apps (Trust rows) that superuser owns
    const owner = new Map();
    for (const ids of chunk([...loggedIn], ID_CHUNK)) {
        const { data } = unwrap(await supabase.from('superuser').select('id, members_id').in('members_id', ids));
        data.forEach((row) => owner.set(row.id, row.members_id));
    }
    const appsByMember = new Map();
    const appIds = [];
    for (const ids of chunk([...owner.keys()], ID_CHUNK)) {
        const { data } = unwrap(await supabase.from('Trust').select('id, superuser_id').in('superuser_id', ids));
        data.forEach((row) => {
            const memberId = owner.get(row.superuser_id);
            appsByMember.set(memberId, [...(appsByMember.get(memberId) ?? []), { id: row.id, actions: 0, active: false }]);
            appIds.push(row.id);
        });
    }

    const actions = new Map(); // app id -> page_activity rows (all time)
    for (const ids of chunk(appIds, ID_CHUNK)) {
        const { data } = unwrap(await supabase.from('Trust').select('id, page_activity(count)').in('id', ids));
        data.forEach((row) => actions.set(row.id, row.page_activity?.[0]?.count ?? 0));
    }
    appsByMember.forEach((apps) =>
        apps.forEach((app) => {
            app.actions = actions.get(app.id) ?? 0;
            app.active = app.actions > 0;
        })
    );

    return {
        withMobile,
        firstLeads: [...first.values()], // one per different phone number
        people: [...members].map(([phone, memberId]) => ({
            lead: first.get(phone),
            memberId,
            loggedIn: loggedIn.has(memberId),
            apps: appsByMember.get(memberId) ?? [],
        })),
    };
}

/** Counts for a group of people (each stage is a subset of the one before): see summariseFunnel. */
function countStages(people) {
    const loggedIn = people.filter((p) => p.loggedIn);
    const creators = loggedIn.filter((p) => p.apps.length > 0);
    const activeCreators = creators.filter((p) => p.apps.some((app) => app.active));
    const sum = (list, pick) => list.reduce((total, p) => total + pick(p), 0);

    return {
        members: people.length,
        loggedIn: loggedIn.length,
        creators: creators.length,
        apps: sum(creators, (p) => p.apps.length),
        activeCreators: activeCreators.length,
        activeApps: sum(creators, (p) => p.apps.filter((app) => app.active).length),
        actions: sum(creators, (p) => p.apps.reduce((total, app) => total + app.actions, 0)),
    };
}

/**
 * The lead-to-app funnel: leads -> logged in -> created an app -> app has activity, counted as people.
 * `apps` / `activeApps` are the apps behind the last two stages (one member can own several).
 */
export function summariseFunnel(trace, leadCount) {
    const { members, actions, ...stages } = countStages(trace.people);
    return { leads: leadCount, withMobile: trace.withMobile, ...stages };
}

/** Campaign a lead belongs to; leads without one are grouped by where they came from. */
function campaignOf(lead) {
    const name = lead.campaign_name?.trim();
    if (name) return name;
    if (/website/i.test(lead.source ?? '')) return 'Website (no campaign)';
    if (/google/i.test(lead.source ?? '')) return 'Google Ads (no campaign)';
    if (/meta/i.test(lead.source ?? '')) return 'Meta (no campaign)';
    return `${lead.source?.trim() || 'Other'} (no campaign)`;
}

const adSetOf = (lead) => lead.adset_name?.trim() || null;

/** One table row for a group of leads: the leads themselves and the people (belonging to their first lead) among them. */
function describeGroup(label, leads, people) {
    const { members, actions, ...stages } = countStages(people);
    return { label, leads: leads.length, members, ...stages };
}

/** Rows for the leads grouped by `keyOf` (leads whose key is null are skipped), biggest first. */
function groupRows(leads, people, keyOf, extra = () => ({})) {
    const groups = new Map();
    leads.forEach((lead) => {
        const key = keyOf(lead);
        if (key !== null) groups.set(key, [...(groups.get(key) ?? []), lead]);
    });

    return [...groups]
        .map(([key, rows]) => ({
            ...describeGroup(key, rows, people.filter((p) => keyOf(p.lead) === key)),
            ...extra(rows, key),
        }))
        .sort((a, b) => b.leads - a.leads);
}

/**
 * Campaign performance: for each campaign, how many leads came in and how many of those people went on to log in,
 * create an app and use it. Each campaign also splits by platform (Facebook / Instagram / …) and by ad set.
 */
export function campaignPerformance(leads, trace) {
    return groupRows(leads, trace.people, campaignOf, (rows, campaign) => {
        const inCampaign = trace.people.filter((p) => campaignOf(p.lead) === campaign);
        return {
            channels: [...new Set(rows.map(leadChannel))],
            platforms: groupRows(rows, inCampaign, leadChannel),
            adSets: groupRows(rows, inCampaign, adSetOf),
        };
    });
}

/** The ad source a lead came from, for the quality cards. */
const SOURCES = [
    { key: 'meta', label: 'Meta Ads' },
    { key: 'google', label: 'Google Ads' },
    { key: 'website', label: 'Website' },
    { key: 'other', label: 'Other' },
];
const sourceOf = (lead) => {
    const source = lead.source ?? '';
    if (/website/i.test(source)) return 'website';
    if (/google/i.test(source)) return 'google';
    return /meta/i.test(source) ? 'meta' : 'other';
};

/** Key of the ad source a lead came from: meta, google, website or other. */
export const sourceKeyOf = (lead) => sourceOf(lead);

/** Name of the ad source a lead came from (Meta Ads, Google Ads, Website, Other). */
export const sourceLabelOf = (lead) => SOURCES.find((source) => source.key === sourceOf(lead)).label;

const RANK_MIN_LEADS = 10; // a source with fewer leads is shown but not ranked

const channelCounts = (leads) => {
    const counts = new Map();
    leads.forEach((lead) => counts.set(leadChannel(lead), (counts.get(leadChannel(lead)) ?? 0) + 1));
    return [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
};

/** The funnel, campaign table, sources and conversion for the leads where `inGroup(lead)` is true. */
export function leadSections(leads, trace, inGroup = () => true) {
    const groupLeads = leads.filter(inGroup);
    const people = trace.people.filter((p) => inGroup(p.lead));
    const sub = { withMobile: trace.firstLeads.filter(inGroup).length, people };

    return {
        funnel: summariseFunnel(sub, groupLeads.length),
        campaigns: campaignPerformance(groupLeads, sub),
        leadChannels: channelCounts(groupLeads),
        leadConversion: { leads: groupLeads.length, withMobile: sub.withMobile, converted: people.length },
    };
}

/**
 * Ad source quality: one card per source (Meta Ads, Website, …) with how many leads it brought, how many people built
 * an app, how many of those apps are still in use, and how much they are used. Sources are ranked by active apps per
 * 100 leads (so a source cannot win with two lucky apps); sources under ${RANK_MIN_LEADS} leads are not ranked.
 * Each source also carries its own lead sections, so choosing a card can switch the dashboard without a new request.
 */
export function sourceQuality(leads, trace) {
    const rows = SOURCES.map(({ key, label }) => {
        const inGroup = (lead) => sourceOf(lead) === key;
        const groupLeads = leads.filter(inGroup);
        const people = trace.people.filter((p) => inGroup(p.lead));
        const { members, ...stages } = countStages(people);
        const platforms = [...new Set(groupLeads.map(leadChannel))].filter((name) => name !== label && !/\(other\)$/.test(name));

        return {
            key,
            label,
            platforms,
            leads: groupLeads.length,
            ...stages,
            sections: leadSections(leads, trace, inGroup),
        };
    }).filter((row) => row.leads > 0);

    const ranked = rows
        .filter((row) => row.leads >= RANK_MIN_LEADS)
        .sort((a, b) => b.activeCreators / b.leads - a.activeCreators / a.leads || b.leads - a.leads);
    rows.forEach((row) => (row.rank = ranked.includes(row) ? ranked.indexOf(row) + 1 : null));

    return rows.sort((a, b) => b.leads - a.leads);
}

/**
 * Lead numbers for a period (start inclusive, end exclusive, ISO): how many came in, from where, paid or organic,
 * and how many became members. `total` is all leads ever received.
 */
export async function getLeadPeriodStats(start, end) {
    const [total, period] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase
            .from('leads')
            .select('id, lead_received_at, source, platform, is_organic, mobile')
            .gte('lead_received_at', start)
            .lt('lead_received_at', end)
            .limit(5000),
    ]);

    const leads = unwrap(period).data;
    const channels = new Map();
    leads.forEach((lead) => channels.set(leadChannel(lead), (channels.get(leadChannel(lead)) ?? 0) + 1));

    return {
        total: unwrap(total).count,
        received: leads.length,
        channels: [...channels].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
        paid: leads.filter((lead) => lead.is_organic === false).length,
        organic: leads.filter((lead) => lead.is_organic === true).length,
        ...(await countConvertedLeads(leads)),
    };
}
