import { supabase } from '../../config/supabase.js';

const ACTIVITY_LIMIT = 5000;
const RECENT = 8;
const TOP_MODULES = 7;

const unwrap = ({ data, error }) => {
    if (error) throw error;
    return data;
};

/** Plain-words title for an action recorded in page_activity.metadata.action. */
const ACTION_TITLES = {
    app_clicked: 'Opened an app',
    create_new_app_clicked: 'Tapped "Create new app"',
    app_creation_started: 'Started creating an app',
    app_launched: 'Launched their app',
    launch_failed: 'App launch failed',
    logout_clicked: 'Logged out',
    social_icon_clicked: 'Tapped a social icon',
};

/**
 * The extra detail behind one app's journey card, for the period: where its users spend their time (by module),
 * the latest activity, the app link and when the owner joined. Looked up when a card is opened, not for the whole list.
 */
export async function getAppJourney(trustId, { start, end }) {
    const [trust, links, activity] = await Promise.all([
        supabase.from('Trust').select('id, name, app_slug, superuser:superuser_id(name, mobile, members_id)').eq('id', trustId).maybeSingle(),
        supabase.from('shareApp_links').select('web_app_url').eq('trust_id', trustId).limit(1).maybeSingle(),
        supabase
            .from('page_activity')
            .select('page_id, metadata, created_at, members_id, user_reg_id')
            .eq('trust_id', trustId)
            .gte('created_at', start)
            .lt('created_at', end)
            .order('created_at', { ascending: false })
            .limit(ACTIVITY_LIMIT),
    ]);

    const app = unwrap(trust);
    if (!app) return null;
    const rows = unwrap(activity);

    const pageIds = [...new Set(rows.map((row) => row.page_id).filter(Boolean))];
    const pages = new Map();
    for (let i = 0; i < pageIds.length; i += 100) {
        unwrap(await supabase.from('page_routes').select('id, name, module, platform').in('id', pageIds.slice(i, i + 100))).forEach((page) => pages.set(page.id, page));
    }

    const moduleOf = (row) => pages.get(row.page_id)?.module?.trim() || pages.get(row.page_id)?.name?.trim() || 'Other';
    const counts = new Map();
    rows.forEach((row) => counts.set(moduleOf(row), (counts.get(moduleOf(row)) ?? 0) + 1));
    const modules = [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, TOP_MODULES);

    const recent = rows.slice(0, RECENT).map((row) => {
        const action = row.metadata?.action;
        const page = pages.get(row.page_id);
        const place = row.user_reg_id ? 'User Panel' : 'App';
        return {
            at: row.created_at,
            title: ACTION_TITLES[action] ?? `Opened ${page?.name?.trim() || page?.module?.trim() || row.metadata?.route || 'a page'}`,
            detail: action ? [place, row.metadata?.trust_name ?? row.metadata?.social_platform ?? row.metadata?.sample_app_name].filter(Boolean).join(' · ') : [place, page?.module?.trim()].filter(Boolean).join(' · '),
            kind: action ?? 'page',
            panel: Boolean(row.user_reg_id),
        };
    });

    const ownerId = app.superuser?.members_id;
    const owner = ownerId ? unwrap(await supabase.from('Members').select('created_at, app_download, source').eq('members_id', ownerId).maybeSingle()) : null;

    return {
        appLink: links.data?.web_app_url ?? null,
        appSlug: app.app_slug ?? null,
        ownerMobile: app.superuser?.mobile ?? null,
        joinedAt: owner?.created_at ?? null,
        downloaded: owner?.app_download ?? null,
        ownerSource: owner?.source ?? null,
        modules,
        recent,
        activityCount: rows.length,
    };
}
