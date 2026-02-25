import SettingCard from './SettingCard';

const SecuritySection = () => {
  return (
    <SettingCard
      title="Security"
      description="Administrative protections for access and critical actions."
    >
      <div className="space-y-3">
        <button
          type="button"
          className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-2.5 text-left text-sm font-semibold text-[var(--c-text)] transition hover:bg-[var(--c-surface)]"
        >
          Update admin password
        </button>
        <button
          type="button"
          className="w-full rounded-xl border border-[var(--c-border)] bg-[var(--c-panel)] px-4 py-2.5 text-left text-sm font-semibold text-[var(--c-text)] transition hover:bg-[var(--c-surface)]"
        >
          Configure 2-step verification
        </button>
        <button
          type="button"
          className="w-full rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900"
        >
          Revoke all active sessions
        </button>
      </div>
    </SettingCard>
  );
};

export default SecuritySection;
