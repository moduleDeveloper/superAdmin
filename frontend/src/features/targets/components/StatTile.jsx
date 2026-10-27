import { Link } from 'react-router-dom';

import InfoTip from './InfoTip';

const overlay =
  'absolute inset-0 cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--c-accent)';

/**
 * One headline card: label, big value, a small line under it. `featured` outlines it in the accent colour (the main target).
 * Give it `to` (a page) or `onClick` and the whole card becomes clickable; `action` names where it leads, for screen readers.
 */
function StatTile({ label, value, tip, featured = false, to, onClick, action, children }) {
  const clickable = Boolean(to || onClick);
  return (
    <div
      className={`relative flex min-w-0 flex-col gap-1 rounded-2xl border bg-white p-3 shadow-[0_1px_3px_rgba(20,33,61,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(20,33,61,0.12)] ${
        featured ? 'border-2 border-(--c-accent)' : 'border-gray-200'
      }`}
    >
      {to && <Link to={to} state={{ backLabel: 'Targets' }} aria-label={action ?? label} className={overlay} />}
      {!to && onClick && <button type="button" onClick={onClick} aria-label={action ?? label} className={overlay} />}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.06em] text-(--c-muted)">{label}</p>
        {/* sits above the clickable layer so the tooltip still works */}
        <span className={clickable ? 'relative z-10' : undefined}>
          <InfoTip text={tip} />
        </span>
      </div>
      <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {children && <div className="text-xs leading-snug text-(--c-text-3)">{children}</div>}
    </div>
  );
}

export default StatTile;
