import { useState } from 'react';

function Avatar({ name, logoUrl }) {
  const [failed, setFailed] = useState(false);

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt=""
        onError={() => setFailed(true)}
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--c-accent-soft) text-sm font-semibold text-(--c-link)">
      {(name || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}

export default Avatar;
