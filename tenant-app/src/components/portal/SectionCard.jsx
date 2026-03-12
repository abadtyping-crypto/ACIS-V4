import { useState } from 'react';

const SectionCard = ({ title, subtitle, children, defaultOpen = true, primaryAction, titleIcon: TitleIcon = null }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <section className="overflow-hidden rounded-3xl border border-[var(--c-border)] bg-[var(--c-surface)] shadow-[0_20px_45px_-30px_rgba(15,23,42,0.75)] transition-all duration-300">
            {/* Header */}
            <header className="flex items-center justify-between p-4 sm:p-5">
                <div
                    className="flex flex-1 cursor-pointer items-center gap-3"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {TitleIcon ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-accent)]">
                            <TitleIcon className="h-4 w-4" />
                        </div>
                    ) : null}
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${isOpen ? 'border-[var(--c-accent)] bg-[var(--c-accent)] text-white' : 'border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-muted)]'}`}>
                        <svg className={`h-4 w-4 transition-transform duration-300 ${isOpen ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-[var(--c-text)] sm:text-base">{title}</h3>
                        {subtitle && <p className="text-[10px] font-medium sm:text-xs text-[var(--c-muted)]">{subtitle}</p>}
                    </div>
                </div>

                {primaryAction && (
                    <div className="flex-shrink-0">
                        {primaryAction}
                    </div>
                )}
            </header>

            {/* Content Body */}
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] border-t border-[var(--c-border)] opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
                <div className="bg-[color:color-mix(in_srgb,var(--c-panel)_35%,transparent)] p-4 sm:p-6">
                    {children}
                </div>
            </div>
        </section>
    );
};

export default SectionCard;
