/** Up/down arrows for sortable column headers. `direction` is 'asc', 'desc' or null (not sorted). */
function SortArrows({ direction }) {
  const on = 'var(--c-c1)';
  const off = 'var(--c-faint)';

  return (
    <svg viewBox="0 0 10 14" className="h-3.5 w-2.5" aria-hidden="true">
      <path d="M5 1 9 6H1Z" fill={direction === 'asc' ? on : off} />
      <path d="M5 13 1 8h8Z" fill={direction === 'desc' ? on : off} />
    </svg>
  );
}

export default SortArrows;
