import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import { useTheme } from '../context/ThemeContext';

const MobileProfilePage = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <PageShell title="Profile" subtitle="Mobile profile keeps only essential controls.">
      <section className="rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
        <p className="text-sm font-semibold text-[var(--c-text)]">Theme</p>
        <p className="mt-1 text-xs text-[var(--c-muted)]">Choose default device theme behavior.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              theme === 'light' ? 'bg-[var(--c-accent)] text-white' : 'bg-[var(--c-panel)] text-[var(--c-muted)]'
            }`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              theme === 'dark' ? 'bg-[var(--c-accent)] text-white' : 'bg-[var(--c-panel)] text-[var(--c-muted)]'
            }`}
          >
            Dark
          </button>
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              theme === 'system' ? 'bg-[var(--c-accent)] text-white' : 'bg-[var(--c-panel)] text-[var(--c-muted)]'
            }`}
          >
            System
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--c-muted)]">Current resolved theme: {resolvedTheme}</p>
      </section>

      <section className="mt-3 rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4">
        <p className="text-sm font-semibold text-[var(--c-text)]">Edit Profile</p>
        <p className="mt-1 text-xs text-[var(--c-muted)]">Open edit page to update profile details.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate(`/t/${tenantId}/profile/edit`)}
            className="rounded-xl bg-[var(--c-accent)] px-4 py-2 text-sm font-semibold text-white"
          >
            Open Edit Page
          </button>
          <button
            type="button"
            onClick={() => navigate(`/t/${tenantId}/settings`)}
            className="rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-2 text-sm font-semibold text-[var(--c-text)]"
          >
            Open Settings
          </button>
        </div>
      </section>
    </PageShell>
  );
};

export default MobileProfilePage;
