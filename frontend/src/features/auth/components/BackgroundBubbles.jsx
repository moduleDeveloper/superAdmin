function BackgroundBubbles() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute -top-44 right-[-6%] h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-(--c-bubble-a) to-(--c-bubble-b)/80" />
      <div className="absolute left-[-9%] top-[40%] hidden h-[26rem] w-[26rem] rounded-full bg-(--c-bubble-b)/70 lg:block" />
      <div className="absolute bottom-[-18%] left-[-8%] h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-(--c-bubble-s1) via-(--c-bubble-s2) to-(--c-bubble-s3)/80" />
      <div className="absolute bottom-[-24%] left-[26%] hidden h-[30rem] w-[30rem] rounded-full bg-(--c-bubble-a)/80 lg:block" />
      <div className="absolute right-[26%] top-[12%] hidden h-52 w-52 rounded-full bg-(--c-bubble-b)/40 lg:block" />

      {/* Reserved space on the right, kept as a dot grid */}
      <div
        className="absolute bottom-[10%] right-[4.5%] hidden h-24 w-24 opacity-60 lg:block"
        style={{
          backgroundImage: 'radial-gradient(var(--c-dot) 1.5px, transparent 1.5px)',
          backgroundSize: '16px 16px',
        }}
      />
    </div>
  );
}

export default BackgroundBubbles;
