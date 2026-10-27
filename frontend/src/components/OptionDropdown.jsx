import { useEffect, useRef, useState } from 'react';

/**
 * A compact dropdown for choosing one of a few options, styled like PeriodDropdown (for the top bar).
 * `options` is [{ value, label, count?, tone? }]; `onChange(value)` is called with the chosen one. `icon` is drawn before the label; `block` makes it fill its row (side by side with another block).
 */
function OptionDropdown({ value, options, onChange, label, icon, align = 'left', block = false }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !box.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  // while the options are still loading there is nothing to choose or show yet
  const current = options.find((item) => item.value === value) ?? options[0] ?? null;

  return (
    <div ref={box} className={`relative ${block ? 'min-w-0 flex-1' : 'shrink-0'}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={!current}
        title={label}
        className={`flex h-10 cursor-pointer items-center gap-2 rounded-xl ${block ? 'w-full' : ''} disabled:cursor-wait disabled:opacity-60 border border-gray-300 bg-white px-3 text-sm font-semibold text-(--c-text-2) transition hover:border-(--c-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--c-accent)`}
      >
        {icon}
        <span className={`whitespace-nowrap ${block ? 'min-w-0 flex-1 truncate text-left' : ''}`}>{current ? current.label : 'Loading…'}</span>
        <svg viewBox="0 0 20 20" className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m5 8 5 5 5-5" />
        </svg>
      </button>

      {open && current && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full z-30 mt-2 w-60 rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_12px_32px_rgba(20,33,61,0.16)]`}>
          <ul role="listbox" aria-label={label} className="flex flex-col gap-0.5">
            {options.map((item) => {
              const active = item.value === value;
              return (
                <li key={item.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                      active ? 'bg-(--c-accent-soft) text-(--c-link)' : 'text-(--c-text-2) hover:bg-gray-50'
                    }`}
                  >
                    {item.tone && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.tone }} aria-hidden="true" />}
                    <span className="flex-1">{item.label}</span>
                    {item.count != null && <span className="rounded-full bg-(--c-page) px-2 py-px text-xs tabular-nums text-(--c-muted)">{item.count.toLocaleString('en-IN')}</span>}
                    {active && <span aria-hidden="true">✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default OptionDropdown;
