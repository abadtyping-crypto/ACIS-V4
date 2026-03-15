const PageShell = ({ title, subtitle, icon: Icon, actionSlot, eyebrow = 'Workspace', children }) => {
  return (
    <section className="px-2 py-3 sm:px-3 lg:px-4 lg:py-4">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-6 lg:mb-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="glass flex items-start gap-4 rounded-[1.75rem] border border-[color:color-mix(in_srgb,var(--c-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--c-surface)_84%,transparent)] px-4 py-4 shadow-[0_18px_44px_-34px_color-mix(in_srgb,var(--c-accent)_32%,transparent)]">
              {Icon && (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_90%,transparent)] text-[var(--c-accent)] shadow-[0_10px_28px_-20px_color-mix(in_srgb,var(--c-accent)_45%,transparent)]">
                  <Icon size={28} strokeWidth={2.5} />
                </div>
              )}
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--c-muted)]">
                  {eyebrow}
                </p>
                <h1 className="font-title text-3xl leading-tight text-[var(--c-text)] sm:text-4xl">{title}</h1>
                <p className="mt-1 max-w-2xl text-sm font-medium text-[var(--c-muted)] sm:text-base">{subtitle}</p>
              </div>
            </div>
            {actionSlot ? <div className="flex items-center justify-start lg:justify-end">{actionSlot}</div> : null}
          </div>
        </header>
        {children}
      </div>
    </section>
  );
};

export default PageShell;
