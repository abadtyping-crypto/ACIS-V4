import { Copy, Minus, Square, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTenant } from '../../context/TenantContext';

const TitleBar = () => {
    const isElectron = typeof window !== 'undefined' && !!window.electron && !!window.electron.windowControls;
    const { tenant } = useTenant();
    const [isWindowMaximized, setIsWindowMaximized] = useState(false);
    const tenantLogoUrl = tenant?.logoUrl || '/logo.png';
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
        <div style={{ WebkitAppRegion: 'drag' }} className="flex h-9 w-full select-none items-center justify-between border-b border-[var(--c-border)] glass pl-3">
            <div className="flex items-center gap-2 truncate">
                <img src={tenantLogoUrl} alt={tenantName} className="h-5 w-5 rounded-md border border-white/70 bg-white object-cover shadow-sm" />
                <span className="truncate text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--c-muted)]">
                    {tenantName}
                </span>
            </div>

            <div style={{ WebkitAppRegion: 'no-drag' }} className="flex h-full">
                <button
                    onClick={() => window.electron.windowControls.minimize()}
                    className="flex h-full w-11 items-center justify-center text-[var(--c-muted)] transition hover:bg-[var(--c-panel)] hover:text-[var(--c-text)]"
                >
                    <Minus size={16} />
                </button>
                <button
                    onClick={() => window.electron.windowControls.maximize()}
                    className="flex h-full w-11 items-center justify-center text-[var(--c-muted)] transition hover:bg-[var(--c-panel)] hover:text-[var(--c-text)]"
                >
                    {isWindowMaximized ? <Copy size={13} /> : <Square size={14} />}
                </button>
                <button
                    onClick={() => window.electron.windowControls.close()}
                    className="flex h-full w-11 items-center justify-center text-[var(--c-muted)] transition hover:bg-rose-500 hover:text-white"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default TitleBar;
