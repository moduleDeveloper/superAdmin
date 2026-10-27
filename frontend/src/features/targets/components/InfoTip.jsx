/** A small "i" that explains a number in plain words on hover or keyboard focus. */
function InfoTip({ text, align = 'right' }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-gray-300 text-[0.65rem] font-bold italic text-(--c-muted) transition hover:border-(--c-accent) hover:text-(--c-link) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--c-accent)"
      >
        i
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full z-30 mt-2 w-52 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-normal normal-case leading-snug tracking-normal text-(--c-text-2) opacity-0 shadow-[0_8px_24px_rgba(20,33,61,0.16)] transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 ${
          align === 'right' ? 'right-0' : 'left-0'
        }`}
      >
        {text}
      </span>
    </span>
  );
}

export default InfoTip;
