import PageShell from '../components/layout/PageShell';

const FavoritesPage = () => {
  return (
    <PageShell title="Favorites" subtitle="Pinned shortcuts for faster daily actions.">
      <div className="rounded-2xl border border-dashed border-[var(--c-border)] bg-[var(--c-surface)] p-6">
        <p className="text-sm text-[var(--c-muted)]">
          Favorites are ready for customization. Current bottom bar supports customizable item order via
          local storage wiring.
        </p>
      </div>
    </PageShell>
  );
};

export default FavoritesPage;

