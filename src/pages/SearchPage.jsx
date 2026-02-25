import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import { isVisibleOnPlatform, SEARCH_ITEMS } from '../config/appNavigation';
import { getRuntimePlatform } from '../lib/runtimePlatform';

const SearchPage = () => {
  const { tenantId } = useParams();
  const [query, setQuery] = useState('');
  const runtimePlatform = getRuntimePlatform();
  const visibleSearchItems = useMemo(
    () => SEARCH_ITEMS.filter((item) => isVisibleOnPlatform(item, runtimePlatform)),
    [runtimePlatform],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleSearchItems;
    return visibleSearchItems.filter((item) =>
      `${item.label} ${item.description}`.toLowerCase().includes(q),
    );
  }, [query, visibleSearchItems]);

  return (
    <PageShell title="Universal Search" subtitle="Search everything by page name and purpose.">
      <div className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search pages, modules, actions..."
          className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-3 py-2.5 text-sm text-[var(--c-text)] outline-none focus:border-[var(--c-accent)] focus:ring-2 focus:ring-[var(--c-ring)]"
        />
      </div>

      <div className="mt-3 space-y-2">
        {results.map((item) => (
          <Link
            key={item.path}
            to={`/t/${tenantId}/${item.path}`}
            className="block rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4"
          >
            <p className="text-sm font-bold text-[var(--c-text)]">{item.label}</p>
            <p className="mt-1 text-sm text-[var(--c-muted)]">{item.description}</p>
          </Link>
        ))}
        {results.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--c-border)] bg-[var(--c-surface)] p-4 text-sm text-[var(--c-muted)]">
            No results found.
          </p>
        ) : null}
      </div>
    </PageShell>
  );
};

export default SearchPage;
