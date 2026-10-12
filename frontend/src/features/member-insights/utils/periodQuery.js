/** The selected period as a URL query ("?range=7d" / "?range=custom&from=…&to=…"), so a linked page opens on the same period. */
export function periodQuery({ range, from, to }) {
  const params = new URLSearchParams();
  if (range) params.set('range', range);
  if (range === 'custom') {
    if (from) params.set('from', from);
    if (to) params.set('to', to);
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}
