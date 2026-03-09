import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CalendarIcon,
  ExpenseIcon,
  HomeIcon,
  InvoiceIcon,
  PortalIcon,
  QuotationIcon,
  ReceiptIcon,
  SettingsIcon,
  StarIcon,
  TasksIcon,
  UserPlusIcon,
} from '../components/icons/AppIcons';
import PageShell from '../components/layout/PageShell';
import { SEARCH_ITEMS } from '../config/appNavigation';

const SEARCH_FAVORITES_KEY = 'acis_search_favorites_v1';

const iconByKey = {
  dashboard: HomeIcon,
  settings: SettingsIcon,
  clientOnboarding: UserPlusIcon,
  dailyTransactions: ReceiptIcon,
  tasksTracking: TasksIcon,
  invoiceManagement: InvoiceIcon,
  proformaQuotation: QuotationIcon,
  operationExpenses: ExpenseIcon,
  portalManagement: PortalIcon,
  documentCalendar: CalendarIcon,
};

const readFavorites = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SEARCH_FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((value) => String(value || ''));
  } catch {
    return [];
  }
};

const FavoritesPage = () => {
  const { tenantId } = useParams();
  const favoriteKeys = readFavorites();

  const favoriteItems = useMemo(() => {
    const order = new Map(favoriteKeys.map((key, index) => [key, index]));
    return SEARCH_ITEMS.filter((item) => order.has(item.key)).sort(
      (a, b) => (order.get(a.key) || 0) - (order.get(b.key) || 0),
    );
  }, [favoriteKeys]);

  return (
    <PageShell title="Favorites" subtitle="Quick shortcuts from your starred search apps.">
      {favoriteItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--c-border)] bg-[var(--c-surface)] p-6">
          <p className="text-sm text-[var(--c-muted)]">No favorites yet. Open Search page and tap star on any app.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {favoriteItems.map((item) => {
            const Icon = iconByKey[item.key] || SettingsIcon;
            return (
              <Link
                key={item.path}
                to={`/t/${tenantId}/${item.path}`}
                className="group relative overflow-hidden rounded-2xl border border-[var(--c-border)] bg-[color:color-mix(in_srgb,var(--c-surface)_88%,transparent)] p-3 transition hover:border-[var(--c-accent)]/45"
              >
                <span className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--c-accent)] bg-[var(--c-accent)]/20 text-[var(--c-accent)]">
                  <StarIcon className="h-4 w-4 fill-current" />
                </span>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] text-[var(--c-accent)]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-2 line-clamp-2 text-[13px] font-bold leading-tight text-[var(--c-text)]">{item.label}</p>
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
};

export default FavoritesPage;
