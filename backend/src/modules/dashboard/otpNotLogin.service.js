import { supabase } from '../../config/supabase.js';
import { classifyOtpMembers, memberKey, phoneKey } from './otpNotLogin.logic.js';

const PAGE_SIZE = 1000;
const ID_CHUNK = 100;
const PARALLEL = 6;

const unwrap = ({ data, count, error }) => {
    if (error) throw error;
    return { data, count };
};

/** All-time login identities. A logout or other session event is not a login. */
export async function fetchLoginIdentities() {
    const { count } = unwrap(await supabase.from('member_session').select('id', { count: 'exact', head: true }).eq('action_type', 'login'));
    const pages = Math.ceil((count ?? 0) / PAGE_SIZE);
    const memberIds = new Set();
    const phones = new Set();

    for (let page = 0; page < pages; page += PARALLEL) {
        const batches = await Promise.all(Array.from({ length: Math.min(PARALLEL, pages - page) }, async (_, offset) => {
            const from = (page + offset) * PAGE_SIZE;
            return unwrap(await supabase.from('member_session').select('members_id, mobile').eq('action_type', 'login').order('id').range(from, from + PAGE_SIZE - 1)).data;
        }));
        batches.flat().forEach((row) => {
            const id = memberKey(row.members_id);
            const phone = phoneKey(row.mobile);
            if (id) memberIds.add(id);
            if (phone) phones.add(phone);
        });
    }

    return { memberIds, phones };
}

/** { notLoggedIn, loggedIn } of the SETU app members created in the selected date range; registrations and logins are all-time. */
export async function classifyOtpMembersOf(members, loginIdentities) {
    const ids = [...new Set(members.map((member) => memberKey(member.members_id)).filter(Boolean))];
    const groups = Array.from({ length: Math.ceil(ids.length / ID_CHUNK) }, (_, index) => ids.slice(index * ID_CHUNK, (index + 1) * ID_CHUNK));
    const registrations = [];

    for (let i = 0; i < groups.length; i += PARALLEL) {
        const batches = await Promise.all(groups.slice(i, i + PARALLEL).map(async (group) => {
            const rows = [];
            for (let from = 0; ; from += PAGE_SIZE) {
                const { data } = unwrap(await supabase.from('reg_members').select('members_id, trust_id, role').in('members_id', group).order('id').range(from, from + PAGE_SIZE - 1));
                rows.push(...data);
                if (data.length < PAGE_SIZE) break;
            }
            return rows;
        }));
        registrations.push(...batches.flat());
    }

    return classifyOtpMembers(members, registrations, loginIdentities);
}
