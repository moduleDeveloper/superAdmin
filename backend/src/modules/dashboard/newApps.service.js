import { firstLeadByPhone, organicOwners } from './activeApps.service.js';
import { fetchPeriodRows } from './dashboard.service.js';
import { sortPeople } from './otpNotLoginReport.service.js';
import { leadChannel, sourceKeyOf, sourceLabelOf } from '../marketing/leadStats.service.js';

const last10 = (value) => String(value ?? '').replace(/\D/g, '').slice(-10);
const text = (value) => String(value ?? '').toLowerCase();
const DIRECT = { key: 'direct', label: 'Direct (no ad lead)' };

const SORTS = {
    createdAt: (app) => new Date(app.createdAt).getTime(),
    app: (app) => text(app.name) || null,
    owner: (app) => text(app.owner) || null,
    mobile: (app) => (app.ownerMobile != null ? String(app.ownerMobile) : null),
    source: (app) => text(app.sourceLabel),
    ownerApps: (app) => app.ownerApps,
};

/**
 * The apps (Trust rows) created in the period, each with who built it and where that person came from (the same rule as
 * Most Active Apps: a lead with their number that came in before the app, else an organic / WhatsApp / unknown member,
 * else "direct"). Also how many different people built them. `source` narrows the list, `search` matches the app, owner or mobile.
 */
export async function getNewApps({ start, end }, { source, search, sort, page, pageSize }) {
    const [trusts, leads] = await Promise.all([
        fetchPeriodRows('Trust', 'created_at, id, name, superuser_id, superuser:superuser_id(id, name, mobile, members_id)', 'id', start, end),
        firstLeadByPhone(),
    ]);

    const leadBefore = (trust) => {
        const lead = leads.get(last10(trust.superuser?.mobile));
        return lead && lead.lead_received_at <= trust.created_at ? lead : null;
    };
    const memberLeads = await organicOwners(trusts.filter((trust) => !leadBefore(trust)));

    const perOwner = new Map();
    trusts.forEach((trust) => perOwner.set(trust.superuser_id, (perOwner.get(trust.superuser_id) ?? 0) + 1));

    const apps = trusts.map((trust) => {
        const lead = leadBefore(trust) ?? memberLeads.get(trust.superuser?.members_id) ?? null;
        const group = lead ? { key: sourceKeyOf(lead), label: sourceLabelOf(lead) } : DIRECT;
        return {
            id: trust.id,
            name: trust.name?.trim() || 'Untitled app',
            owner: trust.superuser?.name?.trim() || null,
            ownerMobile: trust.superuser?.mobile ?? null,
            ownerMemberId: trust.superuser?.members_id ?? null,
            ownerApps: perOwner.get(trust.superuser_id) ?? 1, // how many apps this person built in the period
            sourceKey: group.key,
            sourceLabel: group.label,
            platform: lead ? leadChannel(lead) : null,
            campaign: lead?.campaign_name?.trim() || null,
            createdAt: trust.created_at,
        };
    });

    const bySource = new Map();
    apps.forEach((app) => {
        const entry = bySource.get(app.sourceKey) ?? { key: app.sourceKey, label: app.sourceLabel, count: 0 };
        entry.count += 1;
        bySource.set(app.sourceKey, entry);
    });

    const term = (search ?? '').trim().toLowerCase();
    const digits = term.replace(/\D/g, '');
    const filtered = apps.filter(
        (app) =>
            (!source || app.sourceKey === source) &&
            (!term || app.name.toLowerCase().includes(term) || (app.owner ?? '').toLowerCase().includes(term) || (digits && String(app.ownerMobile ?? '').includes(digits)))
    );
    const sorted = sortPeople(filtered, sort ?? {}, SORTS, 'createdAt');

    return {
        period: { from: start, to: end },
        total: apps.length,
        people: perOwner.size,
        sources: [...bySource.values()].sort((a, b) => b.count - a.count),
        filteredTotal: filtered.length,
        page,
        pageSize,
        apps: sorted.slice((page - 1) * pageSize, page * pageSize),
    };
}
