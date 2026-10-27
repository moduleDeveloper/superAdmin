import test from 'node:test';
import assert from 'node:assert/strict';
import { countOtpNotLogin, phoneKey, SETU_APP_TRUST_ID } from '../src/modules/dashboard/otpNotLogin.logic.js';

const member = { members_id: 'member-a', Mobile: '+91 98765-43210' };
const registration = { members_id: member.members_id, trust_id: SETU_APP_TRUST_ID, role: 'APP member' };
const logins = (memberIds = [], phones = []) => ({ memberIds: new Set(memberIds), phones: new Set(phones) });

test('one SETU APP registration without any login counts one unique member', () => {
    assert.equal(countOtpNotLogin([member, member], [registration], logins()), 1);
});

test('no registration, another app, or a different SETU role is excluded', () => {
    for (const rows of [[], [{ ...registration, trust_id: 'another-trust' }], [{ ...registration, role: 'Owner' }]]) {
        assert.equal(countOtpNotLogin([member], rows, logins()), 0);
    }
});

test('any extra registration excludes the member, including inactive or duplicate SETU rows', () => {
    for (const extra of [
        { ...registration, trust_id: 'another-trust', is_active: false },
        { ...registration },
    ]) {
        assert.equal(countOtpNotLogin([member], [registration, extra], logins()), 0);
    }
});

test('an all-time login by member ID excludes the member even without a mobile match', () => {
    assert.equal(countOtpNotLogin([member], [registration], logins([member.members_id])), 0);
});

test('a login under another ID with the same last ten mobile digits excludes the member', () => {
    assert.equal(countOtpNotLogin([member], [registration], logins(['other-member'], ['9876543210'])), 0);
    assert.equal(phoneKey('0091 (98765) 43210'), '9876543210');
});

test('missing or short mobiles do not accidentally match one another', () => {
    assert.equal(phoneKey(null), null);
    assert.equal(phoneKey('1234'), null);
    assert.equal(countOtpNotLogin([{ ...member, Mobile: null }], [registration], logins()), 1);
    assert.equal(countOtpNotLogin([{ ...member, Mobile: '1234' }], [registration], logins([], ['9876543210'])), 1);
});

test('members outside the selected cohort cannot contribute to its count', () => {
    const other = { ...member, members_id: 'outside-range' };
    const rows = [registration, { ...registration, members_id: other.members_id }];
    assert.equal(countOtpNotLogin([member], rows, logins()), 1);
    assert.equal(countOtpNotLogin([], rows, logins()), 0);
});
