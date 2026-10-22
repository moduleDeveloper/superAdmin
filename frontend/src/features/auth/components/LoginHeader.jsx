import Logo from '../../../components/Logo';

function LoginHeader() {
  return (
    <header className="relative z-10 flex items-center justify-between px-6 pt-8 sm:px-10 lg:px-[5.7%]">
      <div className="flex items-center gap-4">
        <Logo className="h-24 w-24" />
        <p className="text-3xl font-medium leading-tight">
         SETU AI
        </p>
      </div>
      <div className="hidden items-center gap-3 text-[0.65rem] font-medium uppercase tracking-[0.4em] text-(--c-text-2) sm:flex lg:pr-[1%]">
        Investors
        <span className="h-0.5 w-10 bg-(--c-accent)" />
      </div>
    </header>
  );
}

export default LoginHeader;
