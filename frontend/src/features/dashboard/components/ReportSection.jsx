import { useId } from 'react';

const Chevron = () => (
  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 8 5 5 5-5" />
  </svg>
);

/**
 * A collapsible report card. `id` is used for the anchor (#report-<id>) so the sidebar can open and scroll to it.
 * `summary` is a short line shown only while the card is closed.
 */
function ReportSection({ id, icon, iconBg, title, subtitle, count, summary, open, onToggle, children }) {
  const bodyId = useId();

  return (
    <section id={`report-${id}`} className="min-w-0 scroll-mt-24 rounded-2xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(20,33,61,0.06)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full cursor-pointer flex-wrap items-center gap-4 rounded-2xl px-5 py-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-(--c-accent)"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: iconBg }} aria-hidden="true">
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-base font-bold">
            {title}
            {count != null && <span className="rounded-full bg-(--c-accent-soft) px-2 py-0.5 text-xs font-bold text-(--c-link)">{count}</span>}
          </span>
          <span className="mt-0.5 block text-sm text-(--c-muted)">{subtitle}</span>
        </span>
        {!open && summary && (
          <span className="hidden max-w-[45%] items-center gap-2 truncate rounded-xl bg-(--c-band) px-3 py-2 text-sm text-(--c-text-2) md:flex">{summary}</span>
        )}
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
          <Chevron />
        </span>
      </button>

      {open && (
        <div id={bodyId} className="animate-reveal min-w-0 px-4 pb-4 sm:px-5 sm:pb-5">
          {children}
        </div>
      )}
    </section>
  );
}

export default ReportSection;
