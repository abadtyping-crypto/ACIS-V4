import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import SectionCard from './SectionCard';
import { useTenant } from '../../context/useTenant';
import { useAuth } from '../../context/useAuth';
import { fetchTenantPortals, deleteTenantPortal } from '../../lib/backendStore';
import { canUserPerformAction } from '../../lib/userControlPreferences';
import CurrencyValue from '../common/CurrencyValue';
import { DEFAULT_PORTAL_ICON, resolvePortalTypeIcon } from '../../lib/transactionMethodConfig';

/* ─── Fallback icon helper ────────────────────────────────────── */
const fallbackTypeIcon = (type) => {
    return resolvePortalTypeIcon(type);
};

/* ─── Portal List Item ────────────────────────────────────────── */
const PortalListItem = ({ portal, onEdit, onDelete, onOpen }) => {
    const balance = Number(portal.balance || 0);
    const isNegative = balance < 0;

    return (
        <div className="group flex items-center gap-2.5 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-2.5 py-2 transition hover:border-[var(--c-accent)]/40 hover:shadow-sm">
            {/* Icon */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--c-border)] bg-white">
                <img
                    src={portal.iconUrl || fallbackTypeIcon(portal.type)}
                    alt={portal.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DEFAULT_PORTAL_ICON;
                    }}
                />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[var(--c-text)]">{portal.name}</p>
                <p className="text-[10px] uppercase tracking-wider text-[var(--c-muted)]">{portal.type}</p>
                <p className={`mt-0.5 text-[10px] font-semibold ${isNegative ? 'text-rose-400' : 'text-emerald-400'}`}>
                    <CurrencyValue value={balance} iconSize="h-2.5 w-2.5" />
                </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                <ActionBtn
                    onClick={onOpen}
                    actionLabel="Open portal detail"
                    className="hover:text-[var(--c-accent)]"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                </ActionBtn>
                <ActionBtn
                    onClick={onEdit}
                    actionLabel="Edit portal"
                    className="hover:text-[var(--c-accent)]"
                >
                    <Pencil className="h-3.5 w-3.5" />
                </ActionBtn>
                <ActionBtn
                    onClick={onDelete}
                    actionLabel="Delete portal"
                    className="hover:text-rose-400"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </ActionBtn>
            </div>
        </div>
    );
};

const ActionBtn = ({ onClick, actionLabel, className = '', children }) => (
    <button
        type="button"
        onClick={onClick}
        aria-label={actionLabel}
        className={`rounded-lg bg-[var(--c-panel)] p-1.5 text-[var(--c-muted)] transition ${className}`}
    >
        {children}
    </button>
);

/* ─── Main Section ────────────────────────────────────────────── */
const PortalSetupSection = ({ isOpen, onToggle, refreshKey }) => {
    const navigate = useNavigate();
    const { tenantId } = useTenant();
    const { user } = useAuth();

    const [portals, setPortals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteStatus, setDeleteStatus] = useState('');
    const [localRefresh, setLocalRefresh] = useState(0);

    useEffect(() => {
        if (!tenantId || !isOpen) return;
        let active = true;
        fetchTenantPortals(tenantId).then((res) => {
            if (!active) return;
            if (res.ok) setPortals(res.rows || []);
            setIsLoading(false);
        });
        return () => { active = false; };
    }, [tenantId, isOpen, refreshKey, localRefresh]);

    const handleAddNew = () => {
        if (!canUserPerformAction(tenantId, user, 'createPortal')) {
            setDeleteStatus("You don't have permission to create portals.");
            return;
        }
        navigate(`/t/${tenantId}/portal-management/new`);
    };

    const handleEdit = (portalId) => {
        navigate(`/t/${tenantId}/portal-management/edit/${portalId}`);
    };

    const handleOpen = (portalId) => {
        navigate(`/t/${tenantId}/portal-management/${portalId}`);
    };

    const handleDelete = async (portal) => {
        if (!confirm(`Delete "${portal.name}"? It can be recovered from the Recycle Bin.`)) return;
        const res = await deleteTenantPortal(tenantId, portal.id, user.uid);
        if (res.ok) {
            setDeleteStatus('Portal moved to Recycle Bin.');
            setLocalRefresh((n) => n + 1);
            setTimeout(() => setDeleteStatus(''), 2500);
        } else {
            setDeleteStatus(res.error || 'Delete failed.');
        }
    };

    const primaryAction = (
        <button
            type="button"
            onClick={handleAddNew}
            className="compact-action flex items-center gap-1.5 rounded-xl bg-[var(--c-accent)] px-3 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
        >
            <Plus className="h-3.5 w-3.5" />
            Add New Portal
        </button>
    );

    return (
        <SectionCard
            title="Portal Setup & Configuration"
            subtitle="Manage portal names, categories, and transaction methods."
            defaultOpen={isOpen}
            onToggle={onToggle}
            primaryAction={primaryAction}
            titleIcon={Building2}
        >
            <div className="space-y-3">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--c-accent)] border-t-transparent" />
                    </div>
                ) : portals.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--c-border)] bg-[var(--c-panel)] py-8">
                        <Building2 className="h-8 w-8 text-[var(--c-muted)]/40" />
                        <p className="text-xs text-[var(--c-muted)]">No portals configured yet.</p>
                        <button
                            type="button"
                            onClick={handleAddNew}
                            className="compact-action flex items-center gap-1.5 rounded-xl border border-[var(--c-accent)]/40 px-4 text-xs font-semibold text-[var(--c-accent)] transition hover:bg-[var(--c-accent)]/10"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Create your first portal
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                        {portals.map((p) => (
                            <PortalListItem
                                key={p.id}
                                portal={p}
                                tenantId={tenantId}
                                onOpen={() => handleOpen(p.id)}
                                onEdit={() => handleEdit(p.id)}
                                onDelete={() => handleDelete(p)}
                            />
                        ))}
                    </div>
                )}

                {deleteStatus && (
                    <p className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-2 text-xs text-[var(--c-muted)]">
                        {deleteStatus}
                    </p>
                )}
            </div>
        </SectionCard>
    );
};

export default PortalSetupSection;
