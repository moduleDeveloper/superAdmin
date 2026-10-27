import { fetchPeriodRows } from './dashboard.service.js';
import { classifyOtpMembersOf, fetchLoginIdentities } from './otpNotLogin.service.js';
import { sourceKeyOf, sourceLabelOf } from '../marketing/leadStats.service.js';

const NO_CAMPAIGN = 'No campaign';
const clean = (value) => (typeof value === 'string' && value.trim() ? value.trim() : null);
const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
const byCount = ([, a], [, b]) => b - a;

/** The platform a member came through: Facebook / Instagram from Members.sub_source. */
const platformOf = (member) => {
    const sub = (member.sub_source ?? '').trim().toLowerCase();
    if (sub === 'fb' || sub === 'facebook') return 'Facebook';
    if (sub === 'ig' || sub === 'instagram') return 'Instagram';
    return clean(member.sub_source);
};

const text = (value) => String(value ?? '').toLowerCase();

/** What each sortable column compares. Empty values sort last in both directions. */
const SORTS = {
    registeredAt: (person) => new Date(person.registeredAt).getTime(),
    name: (person) => text(person.name) || null,
    mobile: (person) => person.mobile ?? null,
    source: (person) => text(person.sourceLabel),
    campaign: (person) => text(person.campaign),
    status: (person) => (person.loggedIn ? 1 : 0),
};

export function sortPeople(people, { key, dir }, sorts = SORTS, fallback = 'registeredAt') {
    const read = sorts[key] ?? sorts[fallback];
    const sign = dir === 'asc' ? 1 : -1;
    return [...people].sort((a, b) => {
        const x = read(a);
        const y = read(b);
        if (x == null && y == null) return 0;
        if (x == null) return 1;
        if (y == null) return -1;
        return x < y ? -sign : x > y ? sign : 0;
    });
}

/**
 * The SETU app members of the period split into "never logged in" and "logged in" (the numbers on the dashboard's OTP card).
 * `status` (all | notLoggedIn | loggedIn) picks which of them the page is about: they are counted per source and, inside
 * each source, per campaign (with the platform split), and one sorted page of the people themselves is returned.
 * `source` / `campaign` / `search` narrow the people list only; the counts cover everyone in the status.
 */
export async function getOtpNotLoginReport({ start, end }, { source, campaign, search, status, sort, page, pageSize }) {
    const [members, loginIdentities] = await Promise.all([
        fetchPeriodRows('Members', 'created_at, members_id, Name, Mobile, source, sub_source, campaign_name', 'members_id', start, end),
        fetchLoginIdentities(),
    ]);
    const { notLoggedIn, loggedIn } = await classifyOtpMembersOf(members, loginIdentities);

    const describe = (member, didLogin) => {
        const lead = { source: member.source, platform: (member.sub_source ?? '').toLowerCase() };
        return {
            id: member.members_id,
            name: clean(member.Name),
            mobile: member.Mobile != null ? String(member.Mobile) : null,
            sourceKey: sourceKeyOf(lead),
            sourceLabel: sourceLabelOf(lead),
            platform: platformOf(member),
            campaign: clean(member.campaign_name) ?? NO_CAMPAIGN,
            registeredAt: member.created_at,
            loggedIn: didLogin,
        };
    };
    const everyone = [...notLoggedIn.map((m) => describe(m, false)), ...loggedIn.map((m) => describe(m, true))];
    const counts = { all: everyone.length, notLoggedIn: notLoggedIn.length, loggedIn: loggedIn.length };

    const inStatus = status === 'notLoggedIn' ? everyone.filter((p) => !p.loggedIn) : status === 'loggedIn' ? everyone.filter((p) => p.loggedIn) : everyone;

    // per source -> per campaign -> per platform
    const groups = new Map();
    inStatus.forEach((person) => {
        const group = groups.get(person.sourceKey) ?? { key: person.sourceKey, label: person.sourceLabel, count: 0, campaigns: new Map() };
        group.count += 1;
        const entry = group.campaigns.get(person.campaign) ?? { count: 0, platforms: new Map() };
        entry.count += 1;
        if (person.platform) bump(entry.platforms, person.platform);
        group.campaigns.set(person.campaign, entry);
        groups.set(person.sourceKey, group);
    });
    const sources = [...groups.values()]
        .sort((a, b) => b.count - a.count)
        .map((group) => ({
            key: group.key,
            label: group.label,
            count: group.count,
            campaigns: [...group.campaigns]
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([name, entry]) => ({ name, count: entry.count, platforms: [...entry.platforms].sort(byCount).map(([label, count]) => ({ label, count })) })),
        }));

    const term = (search ?? '').trim().toLowerCase();
    const digits = term.replace(/\D/g, '');
    const filtered = inStatus.filter(
        (person) =>
            (!source || person.sourceKey === source) &&
            (!campaign || person.campaign === campaign) &&
            (!term || (person.name ?? '').toLowerCase().includes(term) || (digits && (person.mobile ?? '').includes(digits)))
    );
    const sorted = sortPeople(filtered, sort ?? {});

    return {
        period: { from: start, to: end },
        counts,
        total: inStatus.length,
        sources,
        filteredTotal: filtered.length,
        page,
        pageSize,
        people: sorted.slice((page - 1) * pageSize, page * pageSize),
    };
}
