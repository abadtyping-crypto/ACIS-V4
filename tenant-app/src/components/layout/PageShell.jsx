import { useOutletContext } from 'react-router-dom';

const PageShell = ({
  title,
  subtitle,
  icon: Icon,
  actionSlot,
  eyebrow = 'Workspace',
  widthPreset = 'content',
  maxWidthClass = '',
  children,
}) => {
  const context = useOutletContext() || {};
  const layoutMode = context.layoutMode || 'wide';

  const widthClassByPreset = {
    content: 'compact-page-width-content',
    form: 'compact-page-width-form',
    data: 'compact-page-width-data',
    full: 'compact-page-width-full',
  };
  const effectiveMaxWidth = maxWidthClass || widthClassByPreset[widthPreset] || widthClassByPreset.content;
  const headerMargin = layoutMode === 'mini' || layoutMode === 'compact' ? 'mb-3' : 'mb-4 lg:mb-5';

  return (
    <section className="compact-page">
      <div className={`compact-page ${effectiveMaxWidth}`}>
        <header className={headerMargin}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="compact-card glass flex items-start gap-3 rounded-[1.15rem] border border-[color:color-mix(in_srgb,var(--c-border)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--c-surface)_84%,transparent)] shadow-[0_18px_44px_-34px_color-mix(in_srgb,var(--c-accent)_32%,transparent)]">
              {Icon && (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_90%,transparent)] text-[var(--c-accent)] shadow-[0_10px_28px_-20px_color-mix(in_srgb,var(--c-accent)_45%,transparent)]">
                  <Icon size={22} strokeWidth={2.3} />
                </div>
              )}
              <div className="min-w-0">
                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--c-muted)]">
                  {eyebrow}
                </p>
                <h1 className="truncate font-title text-xl font-semibold leading-tight text-[var(--c-text)] sm:text-2xl lg:text-[1.7rem]">{title}</h1>
                <p className="mt-1 line-clamp-2 max-w-2xl text-[13px] font-medium text-[var(--c-muted)] sm:text-sm">{subtitle}</p>
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
