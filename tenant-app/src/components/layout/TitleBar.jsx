import { Copy, Minus, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTenant } from '../../context/useTenant';
import { useTenantBrandingLogos } from '../../hooks/useTenantBrandingLogos';

const TitleBar = () => {
    const isElectron = typeof window !== 'undefined' && !!window.electron && !!window.electron.windowControls;
    const { tenant, tenantId } = useTenant();
    const [isWindowMaximized, setIsWindowMaximized] = useState(false);
    const tenantLogoUrl = tenant?.logoUrl || '/logo.png';
    const { headerLogoUrl } = useTenantBrandingLogos(tenantId, tenantLogoUrl);
    const tenantName = tenant?.name || 'ACIS Workspace';

    useEffect(() => {
        if (!isElectron || !window.electron?.windowControls) return;
        let active = true;

        window.electron.windowControls.getIsMaximized?.().then((value) => {
            if (!active) return;
            setIsWindowMaximized(Boolean(value));
        });

        const unsubscribe = window.electron.windowControls.onMaximizedChange?.((value) => {
            setIsWindowMaximized(Boolean(value));
        });

        return () => {
            active = false;
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [isElectron]);

    if (!isElectron) return null; // Don't show in standard web browsers

    return (
        <div
            style={{ WebkitAppRegion: 'drag', minHeight: 'var(--d-shell-titlebar-h)', height: 'var(--d-shell-titlebar-h)' }}
            className="flex w-full select-none items-center justify-between border-b border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--glass-bg)_88%,transparent)] px-2.5 backdrop-blur-xl"
        >
            <div className="flex items-center gap-2 truncate">
                <img src={headerLogoUrl || tenantLogoUrl} alt={tenantName} className="h-4.5 w-4.5 rounded-md border border-[var(--glass-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_88%,transparent)] object-cover shadow-sm" />
                <span className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--c-muted)]">
                    {tenantName}
                </span>
            </div>

            <div style={{ WebkitAppRegion: 'no-drag' }} className="flex h-full">
                <button
                    onClick={() => window.electron.windowControls.minimize()}
                    className="flex h-full w-10 items-center justify-center text-[var(--c-muted)] transition hover:bg-[var(--c-panel)] hover:text-[var(--c-text)]"
                >
                    <Minus size={14} />
                </button>
                <button
                    onClick={() => window.electron.windowControls.maximize()}
                    className="flex h-full w-10 items-center justify-center text-[var(--c-muted)] transition hover:bg-[var(--c-panel)] hover:text-[var(--c-text)]"
                >
                    {isWindowMaximized ? <Copy size={12} /> : <Square size={12} />}
                </button>
                <button
                    onClick={() => window.electron.windowControls.close()}
                    className="flex h-full w-10 items-center justify-center text-[var(--c-muted)] transition hover:bg-[var(--c-danger)] hover:text-white"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};

export default TitleBar;
