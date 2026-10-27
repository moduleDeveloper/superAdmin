// The platform's SETU app. Other customer trusts also contain "Setu" in their names.
export const SETU_APP_TRUST_ID = '7dfd3e03-7ff9-4543-9485-e169a4586738';

export const memberKey = (value) => value == null ? null : String(value).trim().toLowerCase();
export const phoneKey = (value) => {
    const digits = String(value ?? '').replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : null;
};

/**
 * The members with exactly one registration in total, for SETU's APP member role, split by whether they ever logged in
 * (by ID or phone): { notLoggedIn, loggedIn }.
 */
export function classifyOtpMembers(members, registrations, loginIdentities) {
    const byMember = new Map();
    registrations.forEach((row) => {
        const id = memberKey(row.members_id);
        const rows = byMember.get(id) ?? [];
        rows.push(row);
        byMember.set(id, rows);
    });

    const uniqueMembers = new Map(members.map((member) => [memberKey(member.members_id), member]));
    const notLoggedIn = [];
    const loggedIn = [];
    uniqueMembers.forEach((member, id) => {
        const rows = byMember.get(id) ?? [];
        if (!id || rows.length !== 1) return;
        const registration = rows[0];
        if (memberKey(registration.trust_id) !== SETU_APP_TRUST_ID || registration.role?.trim().toLowerCase() !== 'app member') return;
        const phone = phoneKey(member.Mobile);
        const didLogin = loginIdentities.memberIds.has(id) || (phone && loginIdentities.phones.has(phone));
        (didLogin ? loggedIn : notLoggedIn).push(member);
    });

    return { notLoggedIn, loggedIn };
}

/** Only the ones who never logged in (the "OTP Not Login" number). */
export const listOtpNotLogin = (members, registrations, loginIdentities) => classifyOtpMembers(members, registrations, loginIdentities).notLoggedIn;

export const countOtpNotLogin = (members, registrations, loginIdentities) => listOtpNotLogin(members, registrations, loginIdentities).length;
