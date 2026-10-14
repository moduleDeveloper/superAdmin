/** A small dropdown for choosing which ad source a dashboard section looks at. `options` is [{ value, label }]. */
function SourceSelect({ value, onChange, options, label }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      className="h-9 max-w-full cursor-pointer rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#e8793f] focus:ring-2 focus:ring-[#e8793f]/20"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default SourceSelect;
