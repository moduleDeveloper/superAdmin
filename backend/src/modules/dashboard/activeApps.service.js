import { supabase } from '../../config/supabase.js';
import { leadChannel, sourceKeyOf, sourceLabelOf } from '../marketing/leadStats.service.js';

const PAGE_SIZE = 1000;
const TOP_APPS = 10;
const DETAIL_BATCH = 5; // how many apps are looked up at once

/** What the list can be limited to: every app, the apps from one ad source, or the apps that came without an ad lead. */
export const APP_SCOPES = ['all', 'meta', 'google', 'website', 'other', 'direct'];

const unwrap = ({ data, count, error }) => {
    if (error) throw error;
    return { data, count };
};

const last10 = (value) => String(value ?? '').replace(/\D/g, '').slice(-10);

/** Each person's earliest lead, by phone number (last 10 digits). */
async function firstLeadByPhone() {
    const { data } = unwrap(
        await supabase.from('leads').select('mobile, lead_received_at, source, platform, campaign_name, adset_name').limit(5000)
    );

    const first = new Map();
    data.forEach((lead) => {
        const key = last10(lead.mobile);
        if (key.length === 10 && (!first.has(key) || lead.lead_received_at < first.get(key).lead_received_at)) first.set(key, lead);
    });
    return first;
}

/** Every app with activity in the period, busiest first: App actions (members') + User Panel (registered users'). */
async function activityPerApp(start, end) {
    const apps = [];
    for (let page = 0; ; page += PAGE_SIZE) {
        const { data } = unwrap(
            await supabase
                .from('Trust')
                .select('id, name, created_at, superuser:superuser_id(id, name, mobile, members_id), member_rows:page_activity(count), user_rows:page_activity(count)')
                .not('member_rows.members_id', 'is', null)
                .gte('member_rows.created_at', start)
                .lt('member_rows.created_at', end)
                .not('user_rows.user_reg_id', 'is', null)
                .gte('user_rows.created_at', start)
                .lt('user_rows.created_at', end)
                .order('id')
                .range(page, page + PAGE_SIZE - 1)
        );
        data.forEach((row) => {
            const appActions = row.member_rows?.[0]?.count ?? 0;
            const userPanel = row.user_rows?.[0]?.count ?? 0;
            if (appActions + userPanel > 0) apps.push({ ...row, appActions, userPanel, score: appActions + userPanel });
        });
        if (data.length < PAGE_SIZE) break;
    }
    return apps.sort((a, b) => b.score - a.score);
}

/** Logins in the period, the last activity ever, and how the owner first logged in (platform, method, place). */
async function appDetails(app, start, end) {
    const owner = app.superuser;
    const [logins, lastActive, firstLogin] = await Promise.all([
        supabase
            .from('member_session')
            .select('id', { count: 'exact', head: true })
            .eq('action_type', 'login')
            .eq('trust_id', app.id)
            .gte('action_at', start)
            .lt('action_at', end),
        supabase.from('page_activity').select('created_at').eq('trust_id', app.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        owner?.members_id
            ? supabase
                  .from('member_session')
                  .select('action_at, app_platform, login_method, metadata')
                  .eq('members_id', owner.members_id)
                  .eq('action_type', 'login')
                  .order('action_at')
                  .limit(1)
                  .maybeSingle()
            : Promise.resolve({ data: null }),
    ]);

    const login = unwrap(firstLogin).data;
    return {
        logins: unwrap(logins).count,
        lastActiveAt: unwrap(lastActive).data?.created_at ?? null,
        firstLogin: login
            ? {
                  at: login.action_at,
                  platform: login.app_platform,
                  method: login.login_method,
                  city: login.metadata?.city ?? null,
                  state: login.metadata?.state ?? null,
              }
            : null,
    };
}

/**
 * The busiest apps in the period (top 10), ranked by App actions + User Panel, each with where the owner came from
 * (a lead with the owner's mobile number that came in before the app was created) and a short journey.
 *
 * `scope` limits the list before it is cut to ten: 'all', one ad source ('meta' | 'google' | 'website' | 'other'), or
 * 'direct' (owners with no matching lead). `scopeCounts` says how many apps with activity fall in each group.
 */
export async function getMostActiveApps({ start, end }, scope = 'all') {
    const [ranked, leads] = await Promise.all([activityPerApp(start, end), firstLeadByPhone()]);

    const apps = ranked.map((app) => {
        const lead = leads.get(last10(app.superuser?.mobile));
        const fromAd = lead && lead.lead_received_at <= app.created_at ? lead : null;
        return { app, fromAd, group: fromAd ? sourceKeyOf(fromAd) : 'direct' };
    });

    const scopeCounts = Object.fromEntries(APP_SCOPES.map((key) => [key, key === 'all' ? apps.length : apps.filter((a) => a.group === key).length]));
    const chosen = (scope === 'all' ? apps : apps.filter((a) => a.group === scope)).slice(0, TOP_APPS);

    const rows = [];
    for (let i = 0; i < chosen.length; i += DETAIL_BATCH) {
        const batch = await Promise.all(chosen.slice(i, i + DETAIL_BATCH).map(({ app }) => appDetails(app, start, end)));
        batch.forEach((details, j) => {
            const { app, fromAd } = chosen[i + j];
            rows.push({
                id: app.id,
                name: app.name,
                owner: app.superuser?.name ?? null,
                ownerMobile: app.superuser?.mobile ?? null,
                createdAt: app.created_at,
                appActions: app.appActions,
                userPanel: app.userPanel,
                score: app.score,
                ...details,
                cameFrom: fromAd
                    ? {
                          source: sourceLabelOf(fromAd),
                          platform: leadChannel(fromAd),
                          campaign: fromAd.campaign_name?.trim() || null,
                          adSet: fromAd.adset_name?.trim() || null,
                          receivedAt: fromAd.lead_received_at,
                      }
                    : null,
            });
        });
    }
    return { apps: rows, scopeCounts };
}
