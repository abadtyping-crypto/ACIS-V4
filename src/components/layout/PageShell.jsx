const PageShell = ({ title, subtitle, icon: Icon, actionSlot, children }) => {
  return (
    <section className="px-2 py-3 sm:px-3 lg:px-4 lg:py-4">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            {Icon && (
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--c-border)] bg-[var(--c-accent-soft)] text-[var(--c-accent)] shadow-sm">
                <Icon size={28} strokeWidth={2.5} />
              </div>
            )}
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.24em] text-[var(--c-muted)]">
                Admin Settings
              </p>
              <h1 className="font-title text-3xl leading-tight text-[var(--c-text)] sm:text-4xl">{title}</h1>
              <p className="mt-1 max-w-2xl text-sm text-[var(--c-muted)] sm:text-base">{subtitle}</p>
            </div>
          </div>
          {actionSlot ? <div className="flex items-center justify-start lg:justify-end">{actionSlot}</div> : null}
        </header>
        {children}
      </div>
    </section>
  );
};

export default PageShell;
