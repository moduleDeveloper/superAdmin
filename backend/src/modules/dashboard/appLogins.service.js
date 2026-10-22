import { supabase } from '../../config/supabase.js';

const unwrap = ({ data, count, error }) => {
    if (error) throw error;
    return { data, count };
};

/** Keeps a search term safe to put inside a PostgREST filter (no commas, brackets or wildcards). */
const clean = (value) => value.replace(/[,()%*\\]/g, ' ').trim();

/**
 * One page of the login sessions behind an app's "App Logins" number: every login to this app in the period, newest
 * first, with who logged in, how, from where and on which device. Searchable by name or mobile number.
 * Returns { trust: { id, name }, total, uniqueMembers, page, pageSize, logins: [...] }.
 */
export async function getAppLogins(trustId, { start, end }, { search, page, pageSize }) {
    const term = search ? clean(search) : '';

    let query = supabase
        .from('member_session')
        .select('id, members_id, member_name, mobile, action_at, app_platform, login_method, metadata', { count: 'exact' })
        .eq('trust_id', trustId)
        .eq('action_type', 'login')
        .gte('action_at', start)
        .lt('action_at', end);
    if (term) query = query.or(`member_name.ilike.%${term}%,mobile.ilike.%${term}%`);

    const [trust, sessions, members] = await Promise.all([
        supabase.from('Trust').select('id, name').eq('id', trustId).maybeSingle(),
        query.order('action_at', { ascending: false }).order('id', { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1),
        // how many different people, for the whole period (not just this page)
        supabase.from('member_session').select('members_id').eq('trust_id', trustId).eq('action_type', 'login').gte('action_at', start).lt('action_at', end).limit(5000),
    ]);

    const app = unwrap(trust).data;
    if (!app) return null;
    const { data: rows, count } = unwrap(sessions);

    // sessions without a saved name take the member's name
    const missing = [...new Set(rows.filter((row) => !row.member_name && row.members_id).map((row) => row.members_id))];
    const names = new Map();
    if (missing.length) {
        unwrap(await supabase.from('Members').select('members_id, Name').in('members_id', missing)).data.forEach((member) => names.set(member.members_id, member.Name));
    }

    return {
        trust: app,
        total: count ?? 0,
        uniqueMembers: new Set(unwrap(members).data.map((row) => row.members_id).filter(Boolean)).size,
        page,
        pageSize,
        logins: rows.map((row) => {
            const meta = row.metadata ?? {};
            return {
                id: row.id,
                memberId: row.members_id ?? null,
                name: row.member_name || names.get(row.members_id) || null,
                mobile: row.mobile ?? null,
                platform: row.app_platform ?? null,
                method: row.login_method ?? meta.login_method ?? null,
                city: meta.city ?? null,
                state: meta.state ?? null,
                device: [meta.device_brand ?? meta.device_manufacturer, meta.device_model].filter(Boolean).join(' ') || null,
                at: row.action_at,
            };
        }),
    };
}
