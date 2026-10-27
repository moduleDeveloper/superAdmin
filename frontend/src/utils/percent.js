/** part as a share of whole, in percent (0-100, not rounded), or null when there is no whole. */
export const percentOf = (part, whole) => (whole > 0 ? (part / whole) * 100 : null);

/**
 * A percentage with up to one decimal, only when there is one: 20 → "20", 20.64 → "20.6", 0.3 → "0.3".
 * A share that exists but is below 0.1 shows as "<0.1" instead of a misleading "0". No % sign.
 */
export function formatPercent(value) {
  if (value == null || Number.isNaN(value)) return '0';
  if (value <= 0) return '0';
  const rounded = Math.round(value * 10) / 10;
  return rounded === 0 ? '<0.1' : String(rounded);
}
