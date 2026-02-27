import PageShell from '../components/layout/PageShell';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useTenantNotifications } from '../hooks/useTenantNotifications';

const toDateLabel = (value) => {
  if (!value) return '';
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString();
  if (typeof value?.toMillis === 'function') return new Date(value.toMillis()).toLocaleString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleString();
};

const toBalanceLabel = (value) => {
  const amount = Number(value || 0);
  const sign = amount < 0 ? '-' : '';
  return `${sign}AED ${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const NotificationsPage = () => {
  const { tenantId } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, isLoading, markAsRead } = useTenantNotifications(tenantId, user);

  return (
    <PageShell title="Notifications" subtitle="System alerts and operational updates.">
      <div className="space-y-2">
        {isLoading ? (
          <p className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 text-sm text-[var(--c-muted)]">
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <p className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 text-sm text-[var(--c-muted)]">
            No notifications found.
          </p>
        ) : notifications.map((item) => (
          <article
            key={item.id}
            className={`rounded-2xl border p-4 ${item.isRead
              ? 'border-[var(--c-border)] bg-[var(--c-surface)]'
              : 'border-[var(--c-ring)] bg-[var(--c-panel)]'
              } ${item.routePath ? 'cursor-pointer hover:border-[var(--c-ring)]' : ''}`}
            onClick={async () => {
              if (!item.isRead) await markAsRead(item.id);
              if (item.routePath) navigate(item.routePath);
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <img
                src={item.createdByUser?.photoURL || '/avatar.png'}
                alt={item.createdByUser?.displayName || 'User'}
                className="h-8 w-8 rounded-full border border-[var(--c-border)] object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[var(--c-muted)]">
                  {item.createdByUser?.displayName || 'Unknown user'}
                </p>
              </div>
              {!item.isRead ? (
                <span className="ml-auto inline-flex rounded-full bg-[var(--c-accent)] px-2 py-0.5 text-[10px] font-bold text-white">
                  Unread
                </span>
              ) : null}
            </div>
            <p className="text-sm font-bold text-[var(--c-text)]">
              {item.title || item.subject || item.eventType || 'Notification'}
            </p>
            <p className="mt-1 text-sm text-[var(--c-muted)]">
              {item.detail || item.message || item.body || 'No detail available.'}
            </p>
            {item.entityType === 'portal' && item.entityMeta ? (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] px-2 py-1.5">
                <img
                  src={item.entityMeta.iconUrl || '/portals/portals.png'}
                  alt={item.entityMeta.name || 'Portal'}
                  className="h-6 w-6 rounded object-cover"
                />
                <p className="text-xs font-semibold text-[var(--c-text)]">
                  {item.entityMeta.name} • {toBalanceLabel(item.entityMeta.balance)}
                </p>
              </div>
            ) : null}
            {item.createdAt ? (
              <p className="mt-2 text-[11px] font-semibold text-[var(--c-muted)]">
                {toDateLabel(item.createdAt)}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </PageShell>
  );
};

export default NotificationsPage;

