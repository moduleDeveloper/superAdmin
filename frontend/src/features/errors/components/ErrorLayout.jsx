import { Link } from 'react-router-dom';

import Logo from '../../../components/Logo';
import BackgroundBubbles from '../../auth/components/BackgroundBubbles';

/** Full-page shell for error screens: the login page's bubble background with a centred card. */
function ErrorLayout({ code, title, message, children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-(--c-page) px-4 py-10 font-sans text-(--c-text)">
      <BackgroundBubbles />

      <Link to="/" className="absolute left-6 top-6 z-10 sm:left-10 sm:top-8">
        <Logo className="h-12 w-12" />
      </Link>

      <main className="relative z-10 w-full max-w-[560px] rounded-[2rem] bg-white px-8 py-14 text-center shadow-[0_20px_60px_rgba(80,40,60,0.12)] sm:px-12">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.4em] text-(--c-text-2)">
          Investors Panel
        </p>
        <div className="mx-auto mt-3 h-0.5 w-11 bg-(--c-accent)" />

        <h1 className="mt-8 bg-gradient-to-r from-(--c-grad-from) to-(--c-grad-to) bg-clip-text text-7xl font-bold tracking-tight text-transparent">
          {code}
        </h1>
        <h2 className="mt-4 text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-3 text-base leading-snug text-(--c-text-3)">{message}</p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {children}
        </div>
      </main>
    </div>
  );
}

export const primaryButton =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-r from-(--c-grad-from) to-(--c-grad-to) px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90';
export const secondaryButton =
  'inline-flex items-center justify-center rounded-full border border-(--c-accent)/40 px-7 py-3 text-sm font-semibold text-(--c-text) transition hover:bg-(--c-soft-2)';

export default ErrorLayout;
