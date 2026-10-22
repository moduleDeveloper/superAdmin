/** ISO instant -> '2026-10-08 16:26:35' in the viewer's timezone */
export const formatTimestamp = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('sv-SE');
};

export const MODULE_COLORS = ['var(--c-c1)', 'var(--c-c2)', 'var(--c-c3)', 'var(--c-c4)', 'var(--c-accent)', 'var(--c-good)', 'var(--c-c5)', 'var(--c-text-3)'];
