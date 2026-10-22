import { BUSINESS_TZ } from '../../../utils/businessDate';
import { buildCreationSeries } from '../../trust-insights/utils/trustSeries';

const hourFormat = new Intl.DateTimeFormat('en-GB', { timeZone: BUSINESS_TZ, hour: 'numeric', hour12: false });

export const COLORS = {
  facebook: '#3b6fd4',
  instagram: '#c2457a',
  website: '#9333ea',
  google: '#d9a21b',
  other: 'var(--c-faint)',
  paid: 'var(--c-accent)',
  organic: 'var(--c-good)',
  unknown: 'var(--c-faint)',
};

const PLATFORM_NAMES = { fb: 'Facebook', ig: 'Instagram' };

/** Where a lead came from: the Meta platform (Facebook / Instagram), the website, or something else. */
export function channelOf(lead) {
  if (PLATFORM_NAMES[lead.platform]) return PLATFORM_NAMES[lead.platform];
  if (/website/i.test(lead.source ?? '')) return 'Website';
  if (/google/i.test(lead.source ?? '')) return 'Google Ads';
  if (/meta/i.test(lead.source ?? '')) return 'Meta (other)';
  return lead.source?.trim() || 'Other';
}

const count = (leads, keyOf) => {
  const counts = new Map();
  leads.forEach((lead) => {
    const key = keyOf(lead);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
};

/** Leads per hour / day / week for the graph, reusing the creation-series builder (it counts `createdAt`). */
export const buildLeadSeries = (leads, period, now) =>
  buildCreationSeries(
    leads.map((lead) => ({ createdAt: lead.receivedAt })),
    period,
    now
  );

export function channelSlices(leads) {
  const counts = count(leads, channelOf);
  const color = { Facebook: COLORS.facebook, Instagram: COLORS.instagram, Website: COLORS.website, 'Google Ads': COLORS.google };
  return [...counts]
    .map(([label, value]) => ({ label, value, color: color[label] ?? COLORS.other }))
    .sort((a, b) => b.value - a.value);
}

export function paidSlices(leads) {
  // Google Ads leads carry no organic flag, but they are ads: only an explicit organic flag overrides that
  const isPaid = (lead) => lead.isOrganic === false || (lead.isOrganic == null && /google/i.test(lead.source ?? ''));
  const counts = count(leads, (lead) => (lead.isOrganic === true ? 'Organic' : isPaid(lead) ? 'Paid (ads)' : 'Not tracked'));
  return [
    { label: 'Paid (ads)', value: counts.get('Paid (ads)') ?? 0, color: COLORS.paid },
    { label: 'Organic', value: counts.get('Organic') ?? 0, color: COLORS.organic },
    { label: 'Not tracked', value: counts.get('Not tracked') ?? 0, color: COLORS.unknown },
  ];
}

/** Top campaigns by leads; leads with no campaign (website, organic) are grouped as "No campaign". */
export function campaignBars(leads, limit = 6) {
  const counts = count(leads, (lead) => lead.campaign?.trim() || 'No campaign');
  return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, limit);
}

/** Leads by hour of the day (0-23, business timezone): when people send enquiries. */
export function hourColumns(leads) {
  const counts = Array(24).fill(0);
  leads.forEach((lead) => {
    counts[Number(hourFormat.format(new Date(lead.receivedAt))) % 24] += 1;
  });
  return counts.map((value, hour) => {
    const label = `${hour % 12 || 12} ${hour < 12 ? 'am' : 'pm'}`;
    return { label: label.replace(' ', ''), title: label, value };
  });
}
