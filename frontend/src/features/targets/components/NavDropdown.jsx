import { useEffect, useRef, useState } from 'react';

import { ChevronDownIcon } from '../../../components/sidebar/icons';

const trigger =
  'flex h-10 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-medium text-(--c-text-2) transition hover:bg-(--c-accent-soft) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--c-accent)';

/** A top bar button that opens a small panel under it; closes on outside click, Escape or picking an item (same look as the dashboard's menus). */
function NavDropdown({ label, icon: Icon, align = 'left', width = 'sm:w-60', bordered = false, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => !ref.current?.contains(event.target) && setOpen(false);
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`${trigger} ${bordered ? 'border border-gray-300 bg-white' : ''}`}
      >
        {Icon && <Icon />}
        <span className="whitespace-nowrap">{label}</span>
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>
      {open && (
        <div
          className={`animate-pop fixed inset-x-2 top-[4.5rem] z-30 max-h-[70vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-[0_12px_32px_rgba(80,40,60,0.16)] sm:absolute sm:inset-x-auto sm:top-full sm:mt-2 ${width} ${
            align === 'right' ? 'sm:right-0' : 'sm:left-0'
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export default NavDropdown;
