import PageShell from '../components/layout/PageShell';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useTenant } from '../context/TenantContext';
import { useTenantNotifications } from '../hooks/useTenantNotifications';
import {
  Settings,
  Users,
  Briefcase,
  FileText,
  Bell,
  CheckCircle2,
} from 'lucide-react';

const TOPIC_ICONS = {
  settings: Settings,
  users: Users,
  finance: Briefcase,
  documents: FileText,
  default: Bell,
};

const getButtonStyles = (actionLabel = '') => {
  const label = String(actionLabel).toLowerCase();
  if (label.includes('delete') || label.includes('remove')) {
    return 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50';
  }
  if (label.includes('confirm') || label.includes('approve')) {
    return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50';
  }
  if (label.includes('retrieve') || label.includes('restore')) {
    return 'bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50';
  }
  // Default Neutral View
  return 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700';
};

const toDateLabel = (value) => {
  if (!value) return '';
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString();
  if (typeof value?.toMillis === 'function') return new Date(value.toMillis()).toLocaleString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleString();
};

const toRelativeTime = (value) => {
  const now = Date.now();
  const exact = toDateLabel(value);
  let then = 0;
  if (typeof value?.toMillis === 'function') then = value.toMillis();
  else if (typeof value?.toDate === 'function') then = value.toDate().getTime();
  else then = new Date(value).getTime();
  if (!Number.isFinite(then)) return exact;
  const diffSeconds = Math.max(1, Math.floor((now - then) / 1000));
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return toDateLabel(value);
};

const resolveTenantRoute = (tenantId, routePath = '') => {
  const raw = String(routePath || '').trim();
  if (!raw) return '';
  if (raw.startsWith(`/t/${tenantId}/`)) return raw;
  if (raw.startsWith('/t/')) return raw;
  if (raw.startsWith('/')) return `/t/${tenantId}${raw}`;
  return `/t/${tenantId}/${raw}`;
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
  const { notifications, isLoading, markAsRead, markActionTaken } = useTenantNotifications(tenantId, user);

  const handleActionClick = async (e, action, item) => {
    e.stopPropagation(); // Avoid triggering the main card click
    if (!item || item.actionTakenBy) return;
    
    const notificationId = item.id;
    if (action.actionType === 'link' && action.route) {
      if (!item.isRead) {
         await markAsRead(notificationId);
      }
      const targetRoute = resolveTenantRoute(tenantId, action.route);
      if (targetRoute) navigate(targetRoute);
    } else if (action.actionType === 'api') {
      const actionRes = await markActionTaken(notificationId, action);
      if (!actionRes.ok) {
        alert(actionRes.error || 'Unable to complete action.');
      }
    }
  };

  return (
    <PageShell title="Notifications" subtitle="System alerts and operational updates.">
      <div className="space-y-3">
        {isLoading ? (
          <p className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 text-sm text-[var(--c-muted)]">
            Loading notifications...
          </p>
        ) : notifications.length === 0 ? (
          <p className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 text-sm text-[var(--c-muted)]">
            No notifications found.
          </p>
        ) : notifications.map((item) => {
          const TopicIcon = TOPIC_ICONS[item.topic] || TOPIC_ICONS.default;
          
          return (
          <article
            key={item.id}
            className={`rounded-2xl border p-4 transition ${item.isRead
              ? 'border-[var(--c-border)] bg-[var(--c-surface)]'
              : 'border-[var(--c-ring)] bg-[var(--c-panel)]'
              } ${item.routePath ? 'cursor-pointer hover:border-[var(--c-ring)]' : ''}`}
            onClick={async () => {
              if (!item.isRead) await markAsRead(item.id);
              if (item.routePath) {
                const targetRoute = resolveTenantRoute(tenantId, item.routePath);
                if (targetRoute) navigate(targetRoute);
              }
            }}
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.createdBy) navigate(`/t/${tenantId}/profile/${item.createdBy}`);
                  }}
                  className="shrink-0 transition hover:opacity-80"
                  title="View Profile"
                >
                  <img
                    src={item.createdByUser?.photoURL || '/avatar.png'}
                    alt={item.createdByUser?.displayName || 'User'}
                    className="h-10 w-10 rounded-full border border-[var(--c-border)] object-cover shadow-sm"
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <TopicIcon className="h-4 w-4 text-[var(--c-muted)]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--c-muted)]">
                      [{item.topic || 'System'}]
                    </span>
                    {!item.isRead ? <span className="h-2 w-2 rounded-full bg-[var(--c-accent)]" /> : null}
                  </div>
                  <p className="mt-1 text-sm font-black text-[var(--c-text)]">
                    {item.title || item.subject || item.eventType || 'Notification'}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-[var(--c-muted)]">
                    {item.createdAt ? (
                      <span title={toDateLabel(item.createdAt)}>
                        {toRelativeTime(item.createdAt)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="pl-[3.25rem]">
              <p className="text-sm font-medium leading-relaxed text-[var(--c-muted)]">
                {item.detail || item.message || item.body || 'No detail available.'}
              </p>

              {item.entityType === 'portal' && item.entityMeta ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_50%,transparent)] px-3 py-2">
                  <img
                    src={item.entityMeta.iconUrl || '/portals/portals.png'}
                    alt={item.entityMeta.name || 'Portal'}
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-sm font-bold text-[var(--c-text)]">{item.entityMeta.name}</p>
                    <p className="text-xs font-semibold text-[var(--c-muted)]">{toBalanceLabel(item.entityMeta.balance)}</p>
                  </div>
                </div>
              ) : null}

              {item.actionTakenBy ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      Action taken by {item.actionTakenByUser?.displayName || item.actionTakenBy}
                      {item.actionTakenLabel ? ` (${item.actionTakenLabel})` : ''}
                    </span>
                  </div>
                </div>
              ) : Array.isArray(item.actions) && item.actions.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--c-border)] pt-4">
                  {item.actions.map((action, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => handleActionClick(e, action, item)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${getButtonStyles(action.label)}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        )})}
      </div>
    </PageShell>
  );
};

export default NotificationsPage;


